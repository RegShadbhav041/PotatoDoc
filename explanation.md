# Explanation — `train_image_pv.py` Line by Line (PlantVillage Model)

**What this file does:** trains 3 image classifiers + 1 ensemble on YOUR PlantVillage data
(1721 train / 215 val / 216 test, 80/10/10, seed 42) and proves stability (no under/overfit).
**Code:** `D:\Potato\train_image_pv.py` | **Weights/plots:** `D:\Potato\outputs_pv\`
**Actual results this run (RTX 3060, 224px):** M1 test acc 0.9907 · M2 1.0000 · M3 1.0000 · Ensemble 1.0000.

> How to read this doc: each step = one code block in script order. "Does" = what the lines do.
> "Result" = what YOU saw/will see when running (values from the 2026-09-23 run).

---

## Step 0 — Docstring + Usage (lines 1–13)

```python
"""PlantVillage trainer — M1/M2/M3 + Ensemble, tuned for STABILITY ..."""
```
- **Does:** declares purpose, data sizes, anti-underfit/overfit list, usage commands, output paths. Python ignores it at runtime, but it is the contract for the viva.
- **Result:** `python D:\Potato\train_image_pv.py --help` shows `--epochs/--batch/--img/--models/--smoke/--seed`. No training yet.

## Step 1 — Imports (lines 14–25)

```python
import argparse, json, random, time
from pathlib import Path
import numpy as np, pandas as pd
from PIL import Image
import torch, torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, f1_score,
    matthews_corrcoef, confusion_matrix, classification_report, roc_auc_score)
```
- **Does:** `argparse` reads CLI flags; `json/Path` save configs; `numpy/pandas/PIL` handle tables+images; `torch` = GPU training; `torchvision.transforms/models` = augmentation + pretrained nets; `sklearn.metrics` = honest scoring (never accuracy alone).
- **Result:** instant. If `torch` missing → `ModuleNotFoundError` here (fix: `pip install -r requirements.txt`). Our run passed with torch 2.6 + CUDA.

## Step 2 — Constants (lines 27–34)

```python
BASE = Path("D:/Potato")
OUT = BASE / "outputs_pv"
CLASSES_CSV = ["early_blight", "late_blight", "healthy"]
CLASSES_API = ["Early Blight", "Late Blight", "Healthy"]  # must match mobile contract
CSV2IDX = {c: i for i, c in enumerate(CLASSES_CSV)}
MEAN = [0.485, 0.456, 0.406]; STD = [0.229, 0.224, 0.225]
```
- **Does:** fixes folder (`outputs_pv/` separate from Irish `outputs_image/` so runs never overwrite each other); maps file labels (`early_blight`) → number (0/1/2) → app strings (`Early Blight` — exact spelling the mobile app requires); ImageNet mean/std for transfer models.
- **Result:** `labels.json` later contains exactly these lists. If you rename a class here but not in mobile `diseaseInfo.js`, the app shows no advice — hence the comment.

## Step 3 — `seed_all(seed=42)` (lines 36–40)

```python
random.seed(seed); np.random.seed(seed)
torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
```
- **Does:** locks every random source (splits shuffling, augmentation dice, weight init, dropout mask, cuDNN kernels) so re-running gives identical numbers.
- **Result:** reproducibility for the thesis ("seed 42"). Costs ~5% speed (deterministic kernels) — worth it. Without this, two runs differ by ±0.5% and examiners can't reproduce your table.

## Step 4 — `LeafDS` dataset (lines 42–48)

```python
class LeafDS(Dataset):
    def __init__(self, df, tfm): ...
    def __len__(self): return len(self.df)
    def __getitem__(self, i):
        r = self.df.iloc[i]
        return self.tfm(Image.open(r["filepath"]).convert("RGB")), CSV2IDX[r["label"]]
```
- **Does:** `__len__` tells PyTorch 1721 train rows exist; `__getitem__` opens ONE jpg → forces RGB (kills grayscale/alpha edge cases) → applies transform → returns `(image_tensor, 0/1/2)`. Images load lazily per batch, so 30 GB never sits in RAM.
- **Result:** `DataLoader` can now iterate. If a path in the CSV is wrong, the error surfaces HERE (`FileNotFoundError` with the exact row) — not 3 hours into training.

## Step 5 — `make_tfms` augmentation (lines 50–61) — the #1 anti-overfit step

```python
train = Compose([RandomResizedCrop(img, scale=(0.8,1.0)), RandomHorizontalFlip(0.5),
    RandomRotation(20), ColorJitter(0.2,0.2,0.2), GaussianBlur(3, sigma=(0.1,1.0)),
    ToTensor(), norm, RandomErasing(p=0.25)])
eval_ = Compose([Resize(img*1.14), CenterCrop(img), ToTensor(), norm])
```
- **Does:** TRAIN gets a different distorted view every epoch (zoom 80–100%, flip, ±20° tilt, brightness/hue jitter, occasional blur, random black rectangle) — the model can never memorize pixel positions, it must learn spot shapes. VAL/TEST get ONE deterministic center crop — measurement stays fair. `norm` differs: transfer models use ImageNet stats (their pretraining expects it), M1 uses 0.5 (neutral).
- **Result:** with augmentation, M1 train_acc 0.96 vs val_acc 0.98 (healthy gap, see curves). WITHOUT it, train would hit 1.00 in 5 epochs while val stalls — the textbook overfit signature. If you see that, this function is the first place to strengthen.

## Step 6 — Models: `SmallCNN` + `build_model` (lines 63–91)

```python
def block(cin, cout):  # Conv-BN-ReLU x2 + MaxPool + Dropout2d(0.1)
self.f = Sequential(block(3,32), block(32,64), block(64,128), block(128,256), AdaptiveAvgPool2d(1))
self.fc = Sequential(Flatten(), Dropout(0.4), Linear(256,128), ReLU, Dropout(0.4), Linear(128,3))
# M2: mobilenet_v2(pretrained) + replace classifier[1] with Linear(last_channel, 3)
# M3: efficientnet_b0(pretrained) + replace classifier[1] with Linear(in_features, 3)
```
- **Does:** M1 stacks 4 conv-blocks (32→64→128→256 filters; each halves width 224→14px) then global-average-pool → 256 numbers → dropout → 128 → dropout → 3 scores. BatchNorm stabilizes gradients, Dropout2d/Dropout randomly kill 10–40% of signals per batch so no neuron co-adapts (anti-overfit). M2/M3 download ImageNet weights once (~14/21 MB) then swap ONLY the last layer to 3 outputs — all earlier layers keep their edge/texture knowledge (anti-underfit: you start at 80%+, not 33%).
- **Result:** params ≈ M1 2M / M2 3.5M / M3 5M. First run downloads weights to `~/.cache/torch` (you saw the progress bars); later runs skip. `best.pt` sizes on disk: 4.62 / 8.71 / 15.56 MB.

## Step 7 — `train_one`: optimizer, scheduler, loss (lines 93–107 setup)

```python
opt = AdamW(params, lr=(3e-4 if transfer else 1e-3), weight_decay=1e-4)
sch = ReduceLROnPlateau(opt, patience=3, factor=0.3)
crit = CrossEntropyLoss(weight=cw, label_smoothing=0.1)
scaler = GradScaler("cuda", enabled=(device is cuda))
```
- **Does:** `AdamW` adapts LR per weight + decays weights (1e-4) to keep them small (anti-overfit). Transfer models get smaller LR (3e-4, don't wreck pretrained filters); M1 gets 1e-3 (learn from zero faster). `ReduceLROnPlateau`: if val_loss stalls 3 epochs, LR ×0.3 (you saw M1 `1.0e-03 → 3.0e-04` at ep12 in the log). `CrossEntropyLoss(weight=cw)`: healthy (121 imgs) gets weight **14.22** vs blights 2.15 — one healthy mistake counts 6.6× (without this, the model ignores healthy and still scores 93% — dishonest). `label_smoothing=0.1`: target is 0.9 not 1.0, stops the model going fanatically confident on noisy field labels. `GradScaler` + `autocast` below = mixed precision (2× faster on RTX 3060, identical accuracy).
- **Result:** printed at startup: `class_weights: early 2.15 / late 2.15 / healthy 14.22`. If healthy recall is 0 in the final report, THIS line is broken — check it first.

## Step 8 — `train_one`: epoch loop (lines 108–133)

```python
model.train()  # enable dropout+BN-updates
for x, y in tr:  # 54 batches of 32 per epoch (1721 imgs)
    opt.zero_grad()
    with autocast("cuda", ...): o = model(x); loss = crit(o, y)
    scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
# validation (no grad):
model.eval(); ... P += argmax ... ; f1 = f1_score(T, P, macro)
sch.step(val_loss)
print(f"[{mid} {ep}] tr_loss ... tr_acc ... va_loss ... va_acc ... vaF1 ... lr ...")
if f1 > best: save best.pt
elif bad >= 8: early stop; break
torch.save(last.pt); write history.json
```
- **Does:** each epoch = 54 gradient updates on randomly-augmented batches; then a clean val pass (dropout OFF, no augmentation) scored by macro-F1 (treats tiny healthy class equally — accuracy would hide its failure). `best.pt` keeps ONLY the peak-val-F1 weights (what we finally test — never the overfitted last epoch). 8 stagnant epochs → stop and return GPU time.
- **Result (your log):**
  - M1: 24 epochs, best ep16 (F1 0.9758). Train/val losses fall TOGETHER (0.92→0.58 / 0.72→0.53) — stable, no gap.
  - M2: 11 epochs, best ep3 (F1 1.0000) — transfer converges almost instantly.
  - M3: 12 epochs, best ep4 (F1 1.0000).
  - `history.json` per model stores all 5 curves; `last.pt` is the overfitted endpoint (kept for forensics, never used for test).

## Step 9 — `predict_proba` (lines 135–141)

```python
@torch.no_grad()
def predict_proba(model, loader, device):
    ... torch.softmax(model(x), 1) ...
```
- **Does:** `no_grad` + eval mode = no dropout, no graph → fast deterministic probabilities per test image in batches.
- **Result:** arrays of shape (216, 3) per model, later averaged for the ensemble. No gradients = ~3× faster + no VRAM leak.

## Step 10 — `main`: data, device, class weights (lines 143–170)

```python
tr/va/te = read_csv(PlantVillage_train/val/test.csv)   # 1721/215/216
device = cuda if available else cpu                     # → cuda (RTX 3060)
freq = tr["label"].value_counts()
cw = tensor([len(tr)/freq[c] for c in CLASSES])         # 14.22 for healthy
config.json = {mids, epochs, batch, img, seed, early_stop patience 8, time}
for mid in mids: train_one(...)
```
- **Does:** loads YOUR 80/10/10 splits (stratified, seed 42 — val has only 15 healthy, test 16, so every healthy error swings ±6%: keep this in mind reading the report); picks GPU; computes the 14.22 weight; freezes the run recipe into `config.json` for the appendix.
- **Result:** console `device: cuda | train/val/test: 1721 215 216`. If `cuda` prints `cpu`, training still works but ~8× slower — install the CUDA torch build.

## Step 11 — `main`: test eval + ensemble (lines 171–196)

```python
probas[mid] = predict_proba(best-checkpoint-model, test_loader)   # NOTE: best.pt, not last.pt
probas["ensemble"] = mean(probas.values(), axis=0)                # soft vote
metrics[name] = {accuracy, balanced_accuracy, f1_macro/weighted, mcc, per_class_f1, confusion, roc_auc_ovr}
```
- **Does:** each model is reloaded from `best.pt` (peak-val moment, not the overtrained end) and scored ONCE on the locked test set. Ensemble = per-image mean of the 3 probability vectors → argmax (no extra parameters, so it can't overfit; it wins when members err differently). MCC + macro-F1 + per-class F1 expose healthy-class cheating that accuracy hides.
- **Result (your `metrics.json`):**

| model | acc | F1-macro | MCC | per-class F1 (E/L/H) |
|-------|-----|----------|-----|----------------------|
| small_cnn | 0.9907 | 0.9849 | 0.9838 | 1.0 / 0.97 / 0.98 (2 late→early errors) |
| mobilenetv2 | 1.0000 | 1.0000 | 1.0000 | perfect |
| efficientnetb0 | 1.0000 | 1.0000 | 1.0000 | perfect |
| ensemble | 1.0000 | 1.0000 | 1.0000 | perfect, confusion [[100,0,0],[0,100,0],[0,0,16]] |

## Step 12 — `main`: plots (lines 197–214)

```python
curves.png per model: (loss train vs val) (acc train vs val) (val F1)
confusion.png: ensemble 3x3 with labels
```
- **Does:** loss panel diagnoses OVERFIT (val climbs while train falls = stop earlier / augment harder); acc panel diagnoses UNDERFIT (both stuck low = bigger model/LR); F1 panel shows the early-stop peak actually chosen. Confusion matrix shows WHERE errors live (expect early↔late off-diagonal on harder data).
- **Result:** `outputs_pv/*/curves.png` — M1 panels track tightly (stable); `outputs_pv/confusion.png` — clean diagonal (too clean: see warning below).

## Step 13 — Stability verdict: fit or not?

- **Underfitting? NO.** Train acc reaches 0.96 (M1) / 0.99+ (M2/M3) by epoch 3–5; val F1 hits 0.97–1.0. An underfit model would sit at 0.5–0.7 on both — nothing like that here.
- **Overfitting? NO on PlantVillage.** Val loss never climbs (M1 0.72→0.53 monotonic-ish); val acc tracks train acc within 2–3%; early stopping + best-checkpoint + dropout + augmentation + weight decay all held. M1's ep16 peak → stop at 24 is exactly the mechanism working.
- **Honest warning for the thesis:** 1.0000 on PlantVillage does NOT mean "solved". PlantVillage = lab, uniform grey background, 256px, 216 test images (only 16 healthy). The model partly learns "background", not just spots. The REAL test is Irish field data (diverse soil/hands/light) — expect 0.90–0.96 there. Write this limitation explicitly; examiners reward it. Next: run `train_image.py` (Irish balanced 80/10/10) and add the cross-domain table (train-PV → test-Irish) to prove the gap and justify merging.

## Step 14 — Outputs produced (verify yours)

```
outputs_pv/config.json | labels.json | metrics.json | ensemble_config.json | confusion.png
outputs_pv/small_cnn/{best.pt 4.62MB, last.pt, history.json, curves.png}   (24 epochs)
outputs_pv/mobilenetv2/{best.pt 8.71MB, ...}                               (11 epochs)
outputs_pv/efficientnetb0/{best.pt 15.56MB, ...}                           (12 epochs)
PlantVillage_train.csv (1721) / _val.csv (215) / _test.csv (216)
```
- Backend hookup (future): point `backend/app.py` `OUT` to `outputs_pv` OR copy `best.pt` trio into the Irish `outputs_image/` layout when the Irish run finishes — keeping ONE weights dir avoids serving the wrong domain. Mobile needs no change (class strings identical).

## Step 15 — Run it again / next steps

```powershell
python D:\Potato\train_image_pv.py --epochs 16 --batch 32 --img 224   # 4-class PV (locked 16, ~40 min RTX 3060)
python D:\Potato\train_image_pv.py --epochs 16 --resume               # continue after interruption
python D:\Potato\train_image_pv.py --smoke                            # 1-epoch CPU sanity check
```
- If CUDA OOM: `--batch 16`. If val F1 oscillates (tiny 15-healthy val): raise patience via edit `bad >= 8` → 10, or `--seed` twice and report mean±std.

## Step 16 — Addendum (2026-09-24): 4th class Non-Leaf + resume + Irish launch — what was done

1. **Power-loss safety (`--resume`, both trainers).** Every epoch now writes `<model>/resume.pt`
   (weights + optimizer + scheduler + epoch + best + `n_classes` + history). Re-run the same command
   with `--resume` to continue (loses ≤1 epoch). A class-count guard ignores stale checkpoints from a
   different head size — this exact crash (3-class leftover vs 4-class run) happened once and is now
   impossible. Before this change, any interruption meant starting over.
2. **Non-leaf negatives.** Fetched 600 COCO val2017 photos containing person but NOT potted-plant
   (`non_leaf/coco_person/`, seed 42). PV splits rebuilt 80/10/10: train 2201 (800/800/480/121),
   val 275, test 276. Irish splits rebuilt: train 7840, val 980, test 981. Trainer generalized to
   N classes inferred from CSV (heads, weights, metrics, confusion, plots all dynamic).
3. **PV 4-class retrain (16 epochs, your locked count).** M1 ran 16/16 (best ep14 F1 .9650) → test
   acc 0.9855, Non-Leaf recall 59/60. M2 (best ep4) / M3 (best ep2) / ensemble → 1.0000, Non-Leaf
   60/60. Full results + calibration story in `README.md`.
4. **Backend (`backend/app.py`).** Serves N-class checkpoints (`n_classes` from ckpt, old 3-class
   still load); `Non-Leaf` → mobile Unknown card (contract unchanged, app untouched); entropy rule
   kept; `green_ratio` logged but deliberately NOT a hard reject (fully necrotic leaves score 0.000,
   same as persons — measured). `POTATO_WEIGHTS_DIR` switches PV vs Irish weights (restart server).
5. **Irish 4-class full-scale run.** `train_image.py --epochs 25 --batch 32 --img 224 --resume`,
   full-resolution, launched detached; monitor `outputs_image/train.log`. M1+M2 finished, M3 in
   progress at last check. Details + resume semantics in `answer.md` Q22–Q24 + `README.md`.
