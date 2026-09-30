"""
PlantVillage trainer — M1/M2/M3 + Ensemble, tuned for STABILITY on small imbalanced data.
Classes are INFERRED from the train CSV (3-class potato, or 4-class with non_leaf negatives).
Data: D:/Potato/PlantVillage_train.csv / _val.csv / _test.csv (80/10/10, seed 42).

Anti-underfit: pretrained M2/M3, LR 3e-4/1e-3, ReduceLROnPlateau.
Anti-overfit : augmentation TRAIN-ONLY, dropout 0.4, weight_decay 1e-4, label smoothing 0.1,
               early stop on val macro-F1 patience 8, best-checkpoint (never last) for test.
Power-loss safe: every epoch writes <model>/resume.pt (weights+optimizer+scheduler+epoch+best).
               Re-run with --resume to continue instead of starting over (loses at most 1 epoch).

Usage:
  python D:\\Potato\\train_image_pv.py --epochs 16 --batch 32 --img 224
  python D:\\Potato\\train_image_pv.py --epochs 16 --resume      # continue after interruption
  python D:\\Potato\\train_image_pv.py --smoke
Outputs: D:/Potato/outputs_pv/{small_cnn,mobilenetv2,efficientnetb0}/{best.pt,last.pt,resume.pt,history.json,curves.png}
         + metrics.json + confusion.png + config.json + labels.json
"""
import argparse, json, random, time
from pathlib import Path
import numpy as np
import pandas as pd
from PIL import Image

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, f1_score,
    matthews_corrcoef, confusion_matrix, classification_report, roc_auc_score)

BASE = Path("D:/Potato")
OUT = BASE / "outputs_pv"
CSV_ORDER = ["early_blight", "late_blight", "healthy", "non_leaf"]
API_OF = {"early_blight": "Early Blight", "late_blight": "Late Blight",
          "healthy": "Healthy", "non_leaf": "Non-Leaf"}
# set in main() from the train CSV:
CLASSES = ["early_blight", "late_blight", "healthy"]
API = ["Early Blight", "Late Blight", "Healthy"]
CSV2IDX = {c: i for i, c in enumerate(CLASSES)}
MEAN = [0.485, 0.456, 0.406]; STD = [0.229, 0.224, 0.225]

def seed_all(seed=42):
    random.seed(seed); np.random.seed(seed)
    torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

class LeafDS(Dataset):
    def __init__(self, df, tfm):
        self.df = df.reset_index(drop=True); self.tfm = tfm
    def __len__(self): return len(self.df)
    def __getitem__(self, i):
        r = self.df.iloc[i]
        return self.tfm(Image.open(r["filepath"]).convert("RGB")), CSV2IDX[r["label"]]

def make_tfms(img, transfer=True):
    # P0-5 domain-generalization upgrade (W5) — mirrors train_image.py
    norm = transforms.Normalize(MEAN, STD) if transfer else transforms.Normalize([0.5]*3, [0.5]*3)
    train = transforms.Compose([transforms.RandomResizedCrop(img, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(0.5), transforms.RandomRotation(30),
        transforms.ColorJitter(0.4, 0.4, 0.4, 0.1), transforms.GaussianBlur(5, sigma=(0.1, 2.0)),
        transforms.RandomAdjustSharpness(2, p=0.25), transforms.RandomAutocontrast(p=0.2),
        transforms.ToTensor(), norm, transforms.RandomErasing(p=0.35, scale=(0.02, 0.2))])
    eval_ = transforms.Compose([transforms.Resize(int(img*1.14)), transforms.CenterCrop(img),
        transforms.ToTensor(), norm])
    return train, eval_

class SmallCNN(nn.Module):
    def __init__(self, n=3, drop=0.4):
        super().__init__()
        def block(cin, cout):
            return nn.Sequential(nn.Conv2d(cin, cout, 3, padding=1, bias=False),
                nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
                nn.Conv2d(cout, cout, 3, padding=1, bias=False),
                nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
                nn.MaxPool2d(2), nn.Dropout2d(0.1))
        self.f = nn.Sequential(block(3, 32), block(32, 64), block(64, 128),
                               block(128, 256), nn.AdaptiveAvgPool2d(1))
        self.fc = nn.Sequential(nn.Flatten(), nn.Dropout(drop),
            nn.Linear(256, 128), nn.ReLU(inplace=True), nn.Dropout(drop), nn.Linear(128, n))
    def forward(self, x): return self.fc(self.f(x))

def build_model(mid, n):
    if mid == "small_cnn": return SmallCNN(n)
    if mid == "mobilenetv2":
        m = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.last_channel, n); return m
    if mid == "efficientnetb0":
        m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, n); return m
    raise ValueError(mid)

def train_one(mid, tr_df, va_df, args, device, cw, n, do_resume):
    transfer = mid != "small_cnn"
    train_tfm, eval_tfm = make_tfms(args.img, transfer)
    tr = DataLoader(LeafDS(tr_df, train_tfm), batch_size=args.batch, shuffle=True, num_workers=0,
                    pin_memory=device.type == "cuda")
    va = DataLoader(LeafDS(va_df, eval_tfm), batch_size=args.batch*2, shuffle=False, num_workers=0)
    model = build_model(mid, n).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=(3e-4 if transfer else 1e-3), weight_decay=1e-4)
    sch = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, patience=3, factor=0.3)
    crit = nn.CrossEntropyLoss(weight=cw, label_smoothing=0.1)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    best, best_ep, bad, start = -1, 0, 0, 1
    hist = {"train_loss": [], "train_acc": [], "val_loss": [], "val_f1": [], "val_acc": [], "lr": []}
    mdir = OUT / mid; mdir.mkdir(parents=True, exist_ok=True)
    rp = mdir / "resume.pt"
    if do_resume and rp.exists():
        r = torch.load(rp, map_location=device, weights_only=False)
        if r.get("n_classes", n) != n:
            print(f"[{mid}] resume.pt is {r.get('n_classes', '?')}-class, current run is {n}-class — ignoring stale checkpoint, starting fresh", flush=True)
        else:
            model.load_state_dict(r["model"]); opt.load_state_dict(r["opt"])
            sch.load_state_dict(r["sch"]); scaler.load_state_dict(r["scaler"])
            best, best_ep, start, hist = r["best"], r["best_ep"], r["epoch"] + 1, r["hist"]
            bad = 0  # fresh patience window after interruption (RNG stream restarts — noted, not bit-identical)
            print(f"[{mid}] resumed from epoch {r['epoch']} (best ep {best_ep} F1={best:.4f})", flush=True)
    for ep in range(start, args.epochs + 1):
        model.train(); tl, tc, n_ = 0, 0, 0
        for x, y in tr:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
                o = model(x); loss = crit(o, y)
            scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
            tl += loss.item()*len(x); tc += (o.argmax(1) == y).sum().item(); n_ += len(x)
        model.eval(); vl = 0; P, T = [], []
        with torch.no_grad():
            for x, y in va:
                x, y = x.to(device), y.to(device)
                with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
                    o = model(x); loss = crit(o, y)
                vl += loss.item()*len(x); P += o.argmax(1).cpu().tolist(); T += y.cpu().tolist()
        f1 = f1_score(T, P, average="macro", zero_division=0)
        va_acc = accuracy_score(T, P)
        hist["train_loss"].append(tl/n_); hist["train_acc"].append(tc/n_)
        hist["val_loss"].append(vl/len(va_df)); hist["val_f1"].append(f1); hist["val_acc"].append(va_acc)
        hist["lr"].append(opt.param_groups[0]["lr"])
        sch.step(vl/len(va_df))
        print(f"[{mid} {ep}/{args.epochs}] tr_loss {tl/n_:.4f} tr_acc {tc/n_:.4f} | va_loss {vl/len(va_df):.4f} va_acc {va_acc:.4f} vaF1 {f1:.4f} lr {opt.param_groups[0]['lr']:.1e}", flush=True)
        torch.save({"epoch": ep, "n_classes": n, "model": model.state_dict(), "opt": opt.state_dict(),
                    "sch": sch.state_dict(), "scaler": scaler.state_dict(),
                    "best": best if f1 <= best else f1, "best_ep": best_ep if f1 <= best else ep,
                    "hist": hist}, rp)  # power-loss safe: re-run with --resume
        if f1 > best:
            best, best_ep, bad = f1, ep, 0
            torch.save({"model_id": mid, "state": model.state_dict(), "img": args.img,
                        "transfer": transfer, "n_classes": n, "classes": CLASSES}, mdir/"best.pt")
        else:
            bad += 1
            if bad >= 8:
                print(f"[{mid}] early stop at {ep} (best ep {best_ep} F1={best:.4f})"); break
    torch.save({"model_id": mid, "state": model.state_dict()}, mdir/"last.pt")
    (mdir/"history.json").write_text(json.dumps(hist, indent=1))
    return best

@torch.no_grad()
def predict_proba(model, loader, device):
    model.eval(); out = []
    for x, _ in loader:
        x = x.to(device)
        with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
            out.append(torch.softmax(model(x), 1).cpu().numpy())
    return np.concatenate(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--img", type=int, default=224)
    ap.add_argument("--models", nargs="+", default=["m1", "m2", "m3"])
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--resume", action="store_true", help="continue from resume.pt instead of starting over")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    global CLASSES, API, CSV2IDX
    seed_all(args.seed); OUT.mkdir(parents=True, exist_ok=True)
    idmap = {"m1": "small_cnn", "m2": "mobilenetv2", "m3": "efficientnetb0"}
    mids = [idmap[m] for m in args.models]
    tr = pd.read_csv(BASE/"PlantVillage_train.csv"); va = pd.read_csv(BASE/"PlantVillage_val.csv"); te = pd.read_csv(BASE/"PlantVillage_test.csv")
    have = [c for c in CSV_ORDER if c in set(tr["label"].unique())]
    extra = sorted(set(tr["label"].unique()) - set(have))
    CLASSES = have + extra
    API = [API_OF.get(c, c) for c in CLASSES]
    CSV2IDX = {c: i for i, c in enumerate(CLASSES)}
    n = len(CLASSES)
    print("classes:", CLASSES)
    if args.smoke:
        tr = tr.groupby("label").head(40); va = va.groupby("label").head(10); te = te.groupby("label").head(10)
        args.epochs = 1; args.batch = 16
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("device:", device, "| train/val/test:", len(tr), len(va), len(te))
    freq = tr["label"].value_counts()
    cw = torch.tensor([len(tr)/freq[c] for c in CLASSES], dtype=torch.float32).to(device)
    print("class_weights:", {c: round(float(w), 2) for c, w in zip(CLASSES, cw.cpu())})
    (OUT/"config.json").write_text(json.dumps({"mids": mids, "epochs": args.epochs, "batch": args.batch,
        "img": args.img, "seed": args.seed, "classes_csv": CLASSES, "classes_api": API,
        "early_stop": "val macro-F1 patience 8", "resume": args.resume,
        "time": time.strftime("%Y-%m-%d %H:%M")}, indent=1))
    for mid in mids: train_one(mid, tr, va, args, device, cw, n, args.resume)
    metrics, probas = {}, {}
    for mid in mids:
        transfer = mid != "small_cnn"
        _, eval_tfm = make_tfms(args.img, transfer)
        loader = DataLoader(LeafDS(te, eval_tfm), batch_size=args.batch*2, num_workers=0)
        ckpt = torch.load(OUT/mid/"best.pt", map_location=device, weights_only=False)
        model = build_model(mid, ckpt.get("n_classes", n)).to(device); model.load_state_dict(ckpt["state"])
        probas[mid] = predict_proba(model, loader, device)
    probas["ensemble"] = np.mean(list(probas.values()), axis=0)
    for name, P in probas.items():
        pred = P.argmax(1); true = te["label"].map(CSV2IDX).values
        m = {"accuracy": float(accuracy_score(true, pred)),
             "balanced_accuracy": float(balanced_accuracy_score(true, pred)),
             "f1_macro": float(f1_score(true, pred, average="macro", zero_division=0)),
             "f1_weighted": float(f1_score(true, pred, average="weighted", zero_division=0)),
             "mcc": float(matthews_corrcoef(true, pred)),
             "per_class_f1": {a: float(v) for a, v in zip(API, f1_score(true, pred, average=None, zero_division=0))},
             "confusion": confusion_matrix(true, pred, labels=list(range(n))).tolist()}
        try: m["roc_auc_ovr"] = float(roc_auc_score(true, P, multi_class="ovr"))
        except Exception: pass
        metrics[name] = m
        print(f"\n[{name}] acc={m['accuracy']:.4f} F1macro={m['f1_macro']:.4f} MCC={m['mcc']:.4f}")
        print(classification_report(true, pred, target_names=API, zero_division=0))
    (OUT/"ensemble_config.json").write_text(json.dumps({"members": mids, "rule": "soft_vote_mean"}, indent=1))
    (OUT/"metrics.json").write_text(json.dumps(metrics, indent=1))
    (OUT/"labels.json").write_text(json.dumps({"csv": CLASSES, "api": API}, indent=1))
    try:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        for mid in mids:
            h = json.loads((OUT/mid/"history.json").read_text())
            ep = range(1, len(h["train_loss"])+1)
            fig, ax = plt.subplots(1, 3, figsize=(14, 3.5))
            ax[0].plot(ep, h["train_loss"], label="train"); ax[0].plot(ep, h["val_loss"], label="val")
            ax[0].set_title(f"{mid} loss (gap up = overfit)"); ax[0].legend(); ax[0].set_xlabel("epoch")
            ax[1].plot(ep, h["train_acc"], label="train"); ax[1].plot(ep, h["val_acc"], label="val")
            ax[1].set_title(f"{mid} acc (both low = underfit)"); ax[1].legend(); ax[1].set_xlabel("epoch")
            ax[2].plot(ep, h["val_f1"]); ax[2].set_title(f"{mid} val macro-F1 (stop at peak)"); ax[2].set_xlabel("epoch")
            fig.tight_layout(); fig.savefig(OUT/mid/"curves.png", dpi=130); plt.close(fig)
        cm = np.array(metrics["ensemble"]["confusion"])
        fig, ax = plt.subplots(); ax.imshow(cm); ax.set_title("Confusion — PV ensemble (test)")
        ax.set_xlabel("Predicted"); ax.set_ylabel("True")
        ax.set_xticks(range(n), API, rotation=15); ax.set_yticks(range(n), API)
        for i in range(n):
            for j in range(n): ax.text(j, i, cm[i, j], ha="center", va="center")
        fig.tight_layout(); fig.savefig(OUT/"confusion.png", dpi=150); plt.close(fig)
        print("plots saved")
    except Exception as e: print("plot skipped:", e)
    print(f"\nDone -> {OUT.resolve()} | ensemble acc={metrics['ensemble']['accuracy']:.4f}")

if __name__ == "__main__": main()
