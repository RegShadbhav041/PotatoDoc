"""External-set eval with frozen grouped weights (no tuning on external data).
Usage: python scripts/eval_external.py <manifest.csv> <out.json> [--weights outputs_irish_grouped]
Manifest needs: filepath, native_label. Reports per-native-class prediction
distribution + Unknown rate at heuristic gate (0.85/0.55 normalized entropy).
NO label forcing: native labels preserved verbatim.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
sys.path.insert(0, "D:/Potato")
from train_image import build_model  # noqa: E402

BASE = Path("D:/Potato")
API = ["Early Blight", "Late Blight", "Healthy", "Non-Leaf"]


class DS(Dataset):
    def __init__(self, paths, tfm):
        self.paths = paths
        self.tfm = tfm

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, i):
        return self.tfm(Image.open(self.paths[i]).convert("RGB"))


def tfm(transfer):
    norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]) \
        if transfer else transforms.Normalize([0.5] * 3, [0.5] * 3)
    return transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224),
                               transforms.ToTensor(), norm])


def main():
    man, outp = sys.argv[1], sys.argv[2]
    wdir = BASE / (sys.argv[3] if len(sys.argv) > 3 else "outputs_irish_grouped")
    df = pd.read_csv(man)
    df = df[df.filepath.map(lambda p: Path(p).exists())].reset_index(drop=True)
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"n={len(df)} device={dev}", flush=True)
    probs = {}
    for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
        ck = torch.load(wdir / mid / "best.pt", map_location=dev, weights_only=False)
        m = build_model(mid, ck.get("n_classes", 4)).to(dev)
        m.load_state_dict(ck["state"])
        m.eval()
        P = []
        with torch.no_grad():
            for x in DataLoader(DS(df.filepath.tolist(), tfm(mid != "small_cnn")),
                                batch_size=16, num_workers=0):
                P.append(torch.softmax(m(x.to(dev)), 1).cpu().numpy())
        probs[mid] = np.concatenate(P)
        print(f"{mid} done", flush=True)
    ens = np.mean(list(probs.values()), axis=0)
    pe = np.clip(ens, 1e-9, 1)
    ent = (-(pe * np.log(pe)).sum(1)) / math.log(4)
    mx = ens.max(1)
    pred = ens.argmax(1)
    unk = (ent > 0.85) | (mx < 0.55)
    df["pred"], df["maxprob"], df["entropy"], df["unknown"] = \
        [API[i] for i in pred], mx.round(4), ent.round(4), unk
    rep = {"n": int(len(df)), "overall_unknown_rate": round(float(unk.mean()), 4),
           "overall_maxprob_mean": round(float(mx.mean()), 4),
           "by_native": {}}
    for lab, sub in df.groupby("native_label"):
        rep["by_native"][lab] = {"n": int(len(sub)),
                                 "pred_dist": sub.pred.value_counts().to_dict(),
                                 "unknown_rate": round(float(sub.unknown.mean()), 4),
                                 "maxprob_mean": round(float(sub.maxprob.mean()), 4)}
    Path(outp).write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep, indent=1)[:2000], flush=True)


if __name__ == "__main__":
    main()
