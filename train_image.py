"""
M1/M2/M3 + Ensemble trainer — stable & trustworthy potato leaf classifier.
Classes (backend strings): Early Blight | Late Blight | Healthy
CSV labels in files: early_blight | late_blight | healthy  (mapped internally)

  M1 small_cnn      : custom CNN from random init (~2M params) — proves "from start"
  M2 mobilenetv2    : ImageNet pretrained, fine-tune last blocks
  M3 efficientnetb0 : ImageNet pretrained, fine-tune last blocks
  ensemble          : soft-vote mean of M1+M2+M3 probabilities (no extra training)

Stability features: seed 42 + deterministic cudnn, stratified 80/10/10 CSVs,
class-weighted CE with label smoothing, AdamW, ReduceLROnPlateau, early stop on
val macro-F1 (patience 7), augmentation TRAIN-ONLY, best+last checkpoints,
config.json + metrics.json + confusion.png + curves.png per model.

Usage:
  python D:\\Potato\\train_image.py --epochs 25 --batch 32 --img 224
  python D:\\Potato\\train_image.py --smoke            # 1 epoch, 120 imgs/class, CPU — pipeline check
  python D:\\Potato\\train_image.py --models m1        # train subset
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
OUT = BASE / "outputs_image"
CSV_ORDER = ["early_blight", "late_blight", "healthy", "non_leaf"]
API_OF = {"early_blight": "Early Blight", "late_blight": "Late Blight",
          "healthy": "Healthy", "non_leaf": "Non-Leaf"}
# set in main() from the train CSV (3-class Irish, or 4-class with non_leaf):
CLASSES_CSV = ["early_blight", "late_blight", "healthy"]
CLASSES_API = ["Early Blight", "Late Blight", "Healthy"]  # must match mobile contract
CSV2IDX = {c: i for i, c in enumerate(CLASSES_CSV)}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def seed_all(seed=42):
    random.seed(seed); np.random.seed(seed)
    torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

# ---------------- dataset ----------------
class LeafDS(Dataset):
    def __init__(self, df, tfm):
        self.df = df.reset_index(drop=True); self.tfm = tfm
    def __len__(self): return len(self.df)
    def __getitem__(self, i):
        r = self.df.iloc[i]
        img = Image.open(r["filepath"]).convert("RGB")
        return self.tfm(img), CSV2IDX[r["label"]]

def make_tfms(img, transfer=True):
    # P0-5 domain-generalization upgrade (W5): stronger crop/scale + illumination/
    # sharpness/contrast variation so background/lighting/compression cues don't dominate.
    # NOTE: MixUp/CutMix + background replacement are batch-level steps -> next trainer upgrade.
    norm = transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD) if transfer else transforms.Normalize([0.5]*3, [0.5]*3)
    train = transforms.Compose([
        transforms.RandomResizedCrop(img, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(0.5),
        transforms.RandomRotation(30),
        transforms.ColorJitter(0.4, 0.4, 0.4, 0.1),
        transforms.GaussianBlur(5, sigma=(0.1, 2.0)),
        transforms.RandomAdjustSharpness(2, p=0.25),
        transforms.RandomAutocontrast(p=0.2),
        transforms.ToTensor(), norm,
        transforms.RandomErasing(p=0.35, scale=(0.02, 0.2)),
    ])
    eval_ = transforms.Compose([
        transforms.Resize(int(img*1.14)), transforms.CenterCrop(img),
        transforms.ToTensor(), norm,
    ])
    return train, eval_

# ---------------- M1: small CNN ----------------
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
                                nn.Linear(256, 128), nn.ReLU(inplace=True),
                                nn.Dropout(drop), nn.Linear(128, n))
    def forward(self, x): return self.fc(self.f(x))

def build_model(mid, n=3, drop=0.4):
    if mid == "small_cnn":
        return SmallCNN(n, drop)
    if mid == "mobilenetv2":
        m = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.last_channel, n)
        return m
    if mid == "efficientnetb0":
        m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, n)
        return m
    raise ValueError(mid)


class FocalLoss(nn.Module):
    """Focal loss (W4 future fix): down-weights easy majority examples so the tiny
    non_leaf class need not rely on an extreme 99x class weight that distorts probs."""

    def __init__(self, alpha=None, gamma=2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, logits, target):
        ce = nn.functional.cross_entropy(logits, target, weight=self.alpha,
                                         reduction="none", label_smoothing=0.1)
        pt = torch.exp(-ce)
        return ((1 - pt) ** self.gamma * ce).mean()

# ---------------- train one model ----------------
def train_one(mid, tr_df, va_df, args, device, cw, n, do_resume=False):
    transfer = mid != "small_cnn"
    train_tfm, eval_tfm = make_tfms(args.img, transfer)
    if args.oversample:
        # sample each class ~equally (replacement) instead of weighting non_leaf 99x
        freq = tr_df["label"].value_counts()
        w = tr_df["label"].map(lambda c: float(1 / freq[c]))
        sampler = torch.utils.data.WeightedRandomSampler(
            torch.tensor((w / w.sum() * len(w)).values, dtype=torch.double),
            num_samples=len(tr_df), replacement=True)
        tr = DataLoader(LeafDS(tr_df, train_tfm), batch_size=args.batch, sampler=sampler,
                        num_workers=0, pin_memory=device.type == "cuda")
    else:
        tr = DataLoader(LeafDS(tr_df, train_tfm), batch_size=args.batch, shuffle=True,
                        num_workers=0, pin_memory=device.type == "cuda")
    va = DataLoader(LeafDS(va_df, eval_tfm), batch_size=args.batch*2, shuffle=False, num_workers=0)
    model = build_model(mid, n, args.drop).to(device)
    lr = 3e-4 if transfer else args.m1_lr
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sch = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, patience=3, factor=0.3)
    if args.loss == "focal":
        crit = FocalLoss(alpha=cw, gamma=2.0)
    else:
        crit = nn.CrossEntropyLoss(weight=cw, label_smoothing=0.1)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    best, best_ep, bad, start, hist = -1, 0, 0, 1, {"train_loss": [], "val_loss": [], "val_f1": []}
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
            print(f"[{mid}] resumed from epoch {r['epoch']} (best ep {best_ep} F1={best:.4f})", flush=True)

    for ep in range(start, args.epochs + 1):
        model.train(); tl = 0
        for x, y in tr:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
                loss = crit(model(x), y)
            scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
            tl += loss.item() * len(x)
        # val
        model.eval(); vl = 0; P, T = [], []
        with torch.no_grad():
            for x, y in va:
                x, y = x.to(device), y.to(device)
                with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
                    o = model(x); loss = crit(o, y)
                vl += loss.item() * len(x)
                P += o.argmax(1).cpu().tolist(); T += y.cpu().tolist()
        f1 = f1_score(T, P, average="macro", zero_division=0)
        hist["train_loss"].append(tl / len(tr_df)); hist["val_loss"].append(vl / len(va_df)); hist["val_f1"].append(f1)
        sch.step(vl / len(va_df))
        print(f"[{mid} {ep}/{args.epochs}] loss {tl/len(tr_df):.4f}/{vl/len(va_df):.4f} valF1 {f1:.4f} lr {opt.param_groups[0]['lr']:.2e}", flush=True)
        torch.save({"epoch": ep, "n_classes": n, "model": model.state_dict(), "opt": opt.state_dict(),
                    "sch": sch.state_dict(), "scaler": scaler.state_dict(),
                    "best": best if f1 <= best else f1, "best_ep": best_ep if f1 <= best else ep,
                    "hist": hist}, rp)  # power-loss safe: re-run with --resume
        if f1 > best:
            best, best_ep, bad = f1, ep, 0
            torch.save({"model_id": mid, "state": model.state_dict(), "img": args.img, "transfer": transfer, "n_classes": n, "classes": CLASSES_CSV}, mdir / "best.pt")
        else:
            bad += 1
            if bad >= 7 and not args.full_epochs:
                print(f"[{mid}] early stop at {ep} (best {best_ep} F1={best:.4f})"); break
    torch.save({"model_id": mid, "state": model.state_dict()}, mdir / "last.pt")
    (mdir / "history.json").write_text(json.dumps(hist, indent=1))
    return best

@torch.no_grad()
def predict_proba(model, loader, device):
    model.eval(); out = []
    for x, _ in loader:
        x = x.to(device)
        with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
            out.append(torch.softmax(model(x), 1).cpu().numpy())
    return np.concatenate(out)

@torch.no_grad()
def predict_logits(model, loader, device):
    # W4: raw logits for temperature scaling (scripts/calibrate.py expects *_logits keys)
    model.eval(); out = []
    for x, _ in loader:
        x = x.to(device)
        with torch.amp.autocast("cuda", enabled=device.type == "cuda"):
            out.append(model(x).cpu().numpy())
    return np.concatenate(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=25)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--img", type=int, default=224)
    ap.add_argument("--models", nargs="+", default=["m1", "m2", "m3"],
                    help="subset: m1 m2 m3 (small_cnn, mobilenetv2, efficientnetb0)")
    ap.add_argument("--smoke", action="store_true", help="1 epoch, 120/class, CPU check")
    ap.add_argument("--resume", action="store_true", help="continue from resume.pt instead of starting over")
    ap.add_argument("--eval-only", action="store_true", help="skip training, only evaluate best.pt + ensemble on test")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--full-epochs", action="store_true",
                    help="run all --epochs (disable early stop); best.pt still = val-F1 peak")
    ap.add_argument("--oversample", action="store_true",
                    help="W4/M1B fix: sample classes equally (replacement) + mild weights, instead of 99x class weight")
    ap.add_argument("--loss", default="ce", choices=["ce", "focal"],
                    help="W4 fix candidate: focal loss down-weights easy majority examples")
    ap.add_argument("--drop", type=float, default=0.4,
                    help="M1B fix: SmallCNN dropout (0.4 over-regularizes 58k; try 0.2)")
    ap.add_argument("--m1-lr", type=float, default=1e-3, help="M1B fix candidate: M1 learning rate")
    ap.add_argument("--train-csv", default="Irish_balanced_train.csv", help="train split CSV (basename under BASE)")
    ap.add_argument("--val-csv", default="Irish_balanced_val.csv", help="val split CSV (basename under BASE)")
    ap.add_argument("--test-csv", default="Irish_balanced_test.csv", help="test split CSV (basename under BASE)")
    ap.add_argument("--out-dir", default="outputs_image", help="weights/metrics dir (basename under BASE); use a NEW dir per experiment (W7)")
    args = ap.parse_args()
    global CLASSES_CSV, CLASSES_API, CSV2IDX, OUT
    OUT = BASE / args.out_dir
    seed_all(args.seed)
    OUT.mkdir(parents=True, exist_ok=True)
    idmap = {"m1": "small_cnn", "m2": "mobilenetv2", "m3": "efficientnetb0"}
    mids = [idmap[m] for m in args.models]

    tr = pd.read_csv(BASE / args.train_csv)
    va = pd.read_csv(BASE / args.val_csv)
    te = pd.read_csv(BASE / args.test_csv)
    have = [c for c in CSV_ORDER if c in set(tr["label"].unique())]
    extra = sorted(set(tr["label"].unique()) - set(have))
    CLASSES_CSV = have + extra
    CLASSES_API = [API_OF.get(c, c) for c in CLASSES_CSV]
    CSV2IDX = {c: i for i, c in enumerate(CLASSES_CSV)}
    n = len(CLASSES_CSV)
    print("classes:", CLASSES_CSV)
    if args.smoke:
        tr = tr.groupby("label").head(120); va = va.groupby("label").head(30); te = te.groupby("label").head(30)
        args.epochs = 1; args.batch = 16
        print(f"SMOKE: train={len(tr)} val={len(va)} test={len(te)}")
    device = torch.device("cuda" if torch.cuda.is_available() and not args.smoke else "cpu")
    if args.smoke: device = torch.device("cpu")
    print("device:", device)
    freq = tr["label"].value_counts()
    if args.oversample:
        # sampler already balances classes: keep only mild weights to avoid double pay
        cw = torch.tensor([max(1.0, (len(tr) / freq[c]) ** 0.5) for c in CLASSES_CSV],
                          dtype=torch.float32).to(device)
    else:
        cw = torch.tensor([len(tr) / freq[c] for c in CLASSES_CSV], dtype=torch.float32).to(device)
    print("class_weights:", {c: round(float(w), 3) for c, w in zip(CLASSES_CSV, cw.cpu())})

    (OUT / "config.json").write_text(json.dumps(
        {"mids": mids, "epochs": args.epochs, "batch": args.batch, "img": args.img,
         "seed": args.seed, "classes_csv": CLASSES_CSV, "classes_api": CLASSES_API,
         "train_csv": args.train_csv, "val_csv": args.val_csv, "test_csv": args.test_csv,
         "out_dir": args.out_dir, "oversample": args.oversample, "loss": args.loss,
         "drop": args.drop, "m1_lr": args.m1_lr, "full_epochs": args.full_epochs,
         "time": time.strftime("%Y-%m-%d %H:%M")}, indent=1))

    for mid in mids:
        if not args.eval_only:
            train_one(mid, tr, va, args, device, cw, n, args.resume)

    # ---- evaluate each + ensemble (soft vote) on TEST ----
    metrics, probas, logits = {}, {}, {}
    for mid in mids:
        transfer = mid != "small_cnn"
        _, eval_tfm = make_tfms(args.img, transfer)
        te_loader = DataLoader(LeafDS(te, eval_tfm), batch_size=args.batch * 2, num_workers=0)
        ckpt = torch.load(OUT / mid / "best.pt", map_location=device, weights_only=False)
        model = build_model(mid, ckpt.get("n_classes", n)).to(device); model.load_state_dict(ckpt["state"])
        probas[mid] = predict_proba(model, te_loader, device)
        te_loader2 = DataLoader(LeafDS(te, eval_tfm), batch_size=args.batch * 2, num_workers=0)
        logits[mid] = predict_logits(model, te_loader2, device)
    ens = np.mean(list(probas.values()), axis=0)
    probas["ensemble"] = ens

    for name, P in probas.items():
        pred = P.argmax(1); true = te["label"].map(CSV2IDX).values
        m = {"accuracy": float(accuracy_score(true, pred)),
             "balanced_accuracy": float(balanced_accuracy_score(true, pred)),
             "f1_macro": float(f1_score(true, pred, average="macro", zero_division=0)),
             "f1_weighted": float(f1_score(true, pred, average="weighted", zero_division=0)),
             "mcc": float(matthews_corrcoef(true, pred)),
             "per_class_f1": {a: float(v) for a, v in zip(CLASSES_API, f1_score(true, pred, average=None, labels=list(range(n)), zero_division=0))},
             "confusion": confusion_matrix(true, pred, labels=list(range(n))).tolist()}
        try: m["roc_auc_ovr"] = float(roc_auc_score(true, P, multi_class="ovr"))
        except Exception: pass
        metrics[name] = m
        print(f"\n[{name}] acc={m['accuracy']:.4f} F1macro={m['f1_macro']:.4f} MCC={m['mcc']:.4f}")
        print(classification_report(true, pred, labels=list(range(n)), target_names=CLASSES_API, zero_division=0))
    (OUT / "ensemble_config.json").write_text(json.dumps({"members": mids, "rule": "soft_vote_mean"}, indent=1))
    (OUT / "metrics.json").write_text(json.dumps(metrics, indent=1))
    # W4: VAL logits dump — temperature + threshold are fitted on VAL only, never test
    try:
        v_logits = {}
        for mid in mids:
            transfer = mid != "small_cnn"
            _, eval_tfm = make_tfms(args.img, transfer)
            va_loader = DataLoader(LeafDS(va, eval_tfm), batch_size=args.batch * 2, num_workers=0)
            ckpt = torch.load(OUT / mid / "best.pt", map_location=device, weights_only=False)
            model = build_model(mid, ckpt.get("n_classes", n)).to(device); model.load_state_dict(ckpt["state"])
            v_logits[mid] = predict_logits(model, va_loader, device)
        np.savez(OUT / "val_probas.npz",
            **{f"{k}_logits": v for k, v in v_logits.items()},
            true=va["label"].map(CSV2IDX).values)
    except Exception as e: print("val dump skipped:", e)
    try: np.savez(OUT / "test_probas.npz",
        **{f"{k}_proba": v for k, v in probas.items() if k != "ensemble"},
        **{f"{k}_logits": v for k, v in logits.items()},
        true=te["label"].map(CSV2IDX).values)
    except Exception as e: print("proba dump skipped:", e)
    (OUT / "labels.json").write_text(json.dumps({"csv": CLASSES_CSV, "api": CLASSES_API}, indent=1))

    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        for mid in mids:
            h = json.loads((OUT / mid / "history.json").read_text())
            fig, ax = plt.subplots(1, 2, figsize=(10, 3.5))
            ax[0].plot(h["train_loss"], label="train"); ax[0].plot(h["val_loss"], label="val"); ax[0].set_title(f"{mid} loss"); ax[0].legend()
            ax[1].plot(h["val_f1"]); ax[1].set_title(f"{mid} val macro-F1")
            fig.tight_layout(); fig.savefig(OUT / mid / "curves.png", dpi=130); plt.close(fig)
        cm = np.array(metrics["ensemble"]["confusion"])
        fig, ax = plt.subplots(); ax.imshow(cm); ax.set_title("Confusion — ensemble (test)")
        ax.set_xlabel("Predicted"); ax.set_ylabel("True")
        ax.set_xticks(range(n), CLASSES_API, rotation=15); ax.set_yticks(range(n), CLASSES_API)
        for i in range(n):
            for j in range(n): ax.text(j, i, cm[i, j], ha="center", va="center")
        fig.tight_layout(); fig.savefig(OUT / "confusion.png", dpi=150); plt.close(fig)
        print("plots saved")
    except Exception as e:
        print("plot skipped:", e)
    print(f"\nDone -> {OUT.resolve()} | test ensemble acc={metrics['ensemble']['accuracy']:.4f}")

if __name__ == "__main__":
    main()
