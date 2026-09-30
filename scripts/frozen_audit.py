"""A2: frozen RANDOM-split weights (outputs_image/best.pt) evaluated on grouped test.
Writes outputs_irish_grouped/frozen_audit.json (never touches outputs_image/).
Usage: python scripts/frozen_audit.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from sklearn.metrics import accuracy_score, f1_score, matthews_corrcoef
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import sys
sys.path.insert(0, "D:/Potato")
from train_image import build_model  # noqa: E402

BASE = Path("D:/Potato")
OLD = BASE / "outputs_image"
NEW = BASE / "outputs_irish_grouped"
CLASSES = ["early_blight", "late_blight", "healthy", "non_leaf"]
C2I = {c: i for i, c in enumerate(CLASSES)}


class DS(Dataset):
    def __init__(self, df, tfm):
        self.df = df.reset_index(drop=True)
        self.tfm = tfm

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        r = self.df.iloc[i]
        return self.tfm(Image.open(r["filepath"]).convert("RGB")), C2I[r["label"]]


def tfm(transfer=True):
    norm = transforms.Normalize([0.485, 0.456, 0.406],
                                [0.229, 0.224, 0.225]) if transfer \
        else transforms.Normalize([0.5] * 3, [0.5] * 3)
    return transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224),
                               transforms.ToTensor(), norm])


te = pd.read_csv(BASE / "Irish_grouped_test.csv")
dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("device:", dev, "test n:", len(te), flush=True)
res = {"protocol": "frozen random-split weights -> grouped test (leakage audit, NOT formal)",
       "n": len(te), "models": {}}
for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
    ck = torch.load(OLD / mid / "best.pt", map_location=dev, weights_only=False)
    m = build_model(mid, ck.get("n_classes", 4)).to(dev)
    m.load_state_dict(ck["state"])
    m.eval()
    P, T = [], []
    with torch.no_grad():
        for x, y in DataLoader(DS(te, tfm(mid != "small_cnn")), batch_size=32,
                               num_workers=0):
            P.append(torch.softmax(m(x.to(dev)), 1).cpu().numpy())
            T.append(y.numpy())
    P, T = np.concatenate(P), np.concatenate(T)
    pred = P.argmax(1)
    res["models"][mid] = {"acc": round(float(accuracy_score(T, pred)), 5),
                          "f1_macro": round(float(f1_score(T, pred, average="macro",
                                                           zero_division=0)), 5),
                          "mcc": round(float(matthews_corrcoef(T, pred)), 5)}
    print(mid, res["models"][mid], flush=True)
probs = []
for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
    ck = torch.load(OLD / mid / "best.pt", map_location=dev, weights_only=False)
    m = build_model(mid, ck.get("n_classes", 4)).to(dev)
    m.load_state_dict(ck["state"])
    m.eval()
    P = []
    with torch.no_grad():
        for x, y in DataLoader(DS(te, tfm(mid != "small_cnn")), batch_size=32,
                               num_workers=0):
            P.append(torch.softmax(m(x.to(dev)), 1).cpu().numpy())
    probs.append(np.concatenate(P))
ens = np.mean(probs, axis=0).argmax(1)
T = te.label.map(C2I).values
res["models"]["ensemble"] = {"acc": round(float(accuracy_score(T, ens)), 5),
                             "f1_macro": round(float(f1_score(T, ens, average="macro",
                                                              zero_division=0)), 5),
                             "mcc": round(float(matthews_corrcoef(T, ens)), 5)}
print("ensemble", res["models"]["ensemble"], flush=True)
(NEW / "frozen_audit.json").write_text(json.dumps(res, indent=1))
print("saved frozen_audit.json")
