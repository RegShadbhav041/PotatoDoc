"""Grad-CAM review of grouped-test errors (Phase 1 close-out).
For the ENSEMBLE's misclassified grouped-test images: per-member probs + M3 Grad-CAM
overlay saved to outputs_irish_grouped/gradcam_errors/. Writes errors.json.
Usage: python scripts/error_review.py
"""
import base64
import io
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import sys
sys.path.insert(0, "D:/Potato")
from train_image import build_model  # noqa: E402

BASE = Path("D:/Potato")
NEW = BASE / "outputs_irish_grouped"
CLASSES = ["early_blight", "late_blight", "healthy", "non_leaf"]
C2I = {c: i for i, c in enumerate(CLASSES)}
API = ["Early Blight", "Late Blight", "Healthy", "Non-Leaf"]
MN = [0.485, 0.456, 0.406]
SD = [0.229, 0.224, 0.225]


def tfm(transfer):
    norm = transforms.Normalize(MN, SD) if transfer else transforms.Normalize([0.5] * 3, [0.5] * 3)
    return transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224),
                               transforms.ToTensor(), norm])


class DS(Dataset):
    def __init__(self, df, t):
        self.df = df.reset_index(drop=True)
        self.t = t

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        r = self.df.iloc[i]
        return self.t(Image.open(r["filepath"]).convert("RGB")), C2I[r["label"]]


def gradcam(m, x, dev):
    convs = [mo for mo in m.modules() if isinstance(mo, nn.Conv2d)]
    layer = convs[-1]
    store = {}

    def fwd(mo, i, o):
        o.retain_grad()
        store["a"] = o

    fh = layer.register_forward_hook(fwd)
    m.zero_grad()
    out = m(x)
    cls = int(out.argmax(1))
    out[0, cls].backward()
    fh.remove()
    A = store["a"][0].detach()
    G = store["a"].grad
    if G is None:
        cam = A.mean(0).relu().cpu().numpy()
    else:
        w = G[0].detach().mean(dim=(1, 2), keepdim=True)
        cam = (w * A).sum(0).relu().cpu().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
    return cam, cls


te = pd.read_csv(BASE / "Irish_grouped_test.csv")
dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
models = {}
for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
    ck = torch.load(NEW / mid / "best.pt", map_location=dev, weights_only=False)
    m = build_model(mid, ck.get("n_classes", 4)).to(dev)
    m.load_state_dict(ck["state"])
    m.eval()
    models[mid] = m

probs = {}
with torch.no_grad():
    for mid, m in models.items():
        P = []
        for x, _ in DataLoader(DS(te, tfm(mid != "small_cnn")), batch_size=32, num_workers=0):
            P.append(torch.softmax(m(x.to(dev)), 1).cpu().numpy())
        probs[mid] = np.concatenate(P)
ens = np.mean(list(probs.values()), axis=0)
true = te.label.map(C2I).values
pred = ens.argmax(1)
err_idx = np.where(pred != true)[0]
print("ensemble errors:", len(err_idx), "/", len(te), flush=True)

outdir = NEW / "gradcam_errors"
outdir.mkdir(exist_ok=True)
import matplotlib.cm as cm

recs = []
for k, i in enumerate(err_idx):
    r = te.iloc[i]
    img = Image.open(r["filepath"]).convert("RGB")
    m3 = models["efficientnetb0"]
    x = tfm(True)(img).unsqueeze(0).to(dev)
    cam, _ = gradcam(m3, x, dev)
    heat = Image.fromarray((cam * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR)
    heat = (np.array(cm.jet(np.array(heat) / 255.0))[:, :, :3] * 255).astype(np.uint8)
    blend = Image.fromarray(((0.45 * heat + 0.55 * np.array(img)).astype(np.uint8)))
    fn = f"err{k:02d}_true-{r['label']}_pred-{CLASSES[pred[i]]}.jpg"
    blend.save(outdir / fn, quality=85)
    p = np.clip(ens[i], 1e-9, 1)
    ent = float(-(p * np.log(p)).sum()) / math.log(4)
    recs.append({"file": fn, "src": r["filepath"], "true": r["label"],
                 "pred": CLASSES[pred[i]], "maxprob": round(float(ens[i].max()), 4),
                 "entropy": round(ent, 4),
                 "m1": API[int(probs["small_cnn"][i].argmax())],
                 "m2": API[int(probs["mobilenetv2"][i].argmax())],
                 "m3": API[int(probs["efficientnetb0"][i].argmax())]})
    print(fn, f"max={ens[i].max():.3f} ent={ent:.3f}", flush=True)
(NEW / "errors.json").write_text(json.dumps(recs, indent=1))
print("saved", len(recs), "overlays + errors.json")
