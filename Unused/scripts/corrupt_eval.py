"""C3 corruption robustness: frozen weights, corrupted grouped-test subset (300 imgs).
Corruptions: blur, dark, bright, jpeg, rotate15, occlude. Models: M3 + ensemble.
Writes corruption_results.json. Usage: python scripts/corrupt_eval.py [--n 300]
"""
import io
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image, ImageEnhance, ImageFilter
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
sys.path.insert(0, "D:/Potato")
from train_image import build_model  # noqa: E402

BASE = Path("D:/Potato")
WDIR = BASE / "outputs_combined"
CLASSES = ["early_blight", "late_blight", "healthy", "non_leaf"]
C2I = {c: i for i, c in enumerate(CLASSES)}
MN = [0.485, 0.456, 0.406]
SD = [0.229, 0.224, 0.225]


def corrupt(img, kind, rng):
    if kind == "clean":
        return img
    if kind == "blur":
        return img.filter(ImageFilter.GaussianBlur(3))
    if kind == "dark":
        return ImageEnhance.Brightness(img).enhance(0.5)
    if kind == "bright":
        return ImageEnhance.Brightness(img).enhance(1.6)
    if kind == "jpeg":
        b = io.BytesIO()
        img.save(b, "JPEG", quality=15)
        b.seek(0)
        return Image.open(b).convert("RGB")
    if kind == "rotate15":
        return img.rotate(15, resample=Image.BILINEAR, expand=False)
    if kind == "occlude":
        a = np.array(img).copy()
        h, w, _ = a.shape
        x, y = rng.integers(0, w - w // 3), rng.integers(0, h - h // 3)
        a[y:y + h // 3, x:x + w // 3] = 0
        return Image.fromarray(a)
    raise ValueError(kind)


class DS(Dataset):
    def __init__(self, df, tfm, kind, seed):
        self.df = df.reset_index(drop=True)
        self.tfm = tfm
        self.kind = kind
        self.rng = np.random.default_rng(seed)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        r = self.df.iloc[i]
        img = corrupt(Image.open(r["filepath"]).convert("RGB"), self.kind, self.rng)
        return self.tfm(img), C2I[r["label"]]


def tfm():
    return transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224),
                               transforms.ToTensor(), transforms.Normalize(MN, SD)])


def main():
    n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 300
    te = pd.read_csv(BASE / "Irish_grouped_test.csv").sample(n=n, random_state=7)
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    models = {}
    for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
        ck = torch.load(WDIR / mid / "best.pt", map_location=dev, weights_only=False)
        m = build_model(mid, ck.get("n_classes", 4)).to(dev)
        m.load_state_dict(ck["state"])
        m.eval()
        models[mid] = m
    out = {}
    for kind in ("clean", "blur", "dark", "bright", "jpeg", "rotate15", "occlude"):
        ps = {}
        for mid, m in models.items():
            P = []
            with torch.no_grad():
                for x, _ in DataLoader(DS(te, tfm(), kind, 7), batch_size=32, num_workers=0):
                    P.append(torch.softmax(m(x.to(dev)), 1).cpu().numpy())
            ps[mid] = np.concatenate(P)
        ens = np.mean(list(ps.values()), axis=0)
        true = te.label.map(C2I).values
        r = {}
        for name, P in list(ps.items()) + [("ensemble", ens)]:
            r[name] = round(float((P.argmax(1) == true).mean()), 4)
        out[kind] = r
        print(kind, r, flush=True)
    (WDIR / "corruption_results.json").write_text(json.dumps(out, indent=1))
    print("saved corruption_results.json")


if __name__ == "__main__":
    main()
