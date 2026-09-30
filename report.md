# Model Training Report — Potato Leaf Classification (PlantVillage)

**Project:** Bachelor Final-Year (6 credits) — PotatoDoc
**Task:** 3-class image classification — Early Blight | Late Blight | Healthy
**Data:** PlantVillage potato subset — 2152 images (Early 1000 / Late 1000 / Healthy 152)
**Splits (stratified, seed 42, 80/10/10):** train 1721 (800/800/121) · val 215 (100/100/15) · test 216 (100/100/16)
**Code:** `D:\Potato\train_image_pv.py` (line-by-line: `explanation.md`)
**Outputs:** `D:\Potato\outputs_pv\` (best.pt + curves + metrics.json + confusion.png)
**Hardware:** NVIDIA GeForce RTX 3060, CUDA, 224px, mixed precision
**Date:** 2026-09-23

---

## 1. What was trained (M1 / M2 / M3 / Ensemble)

| ID | Name in code | What it is | Params | Init |
|----|--------------|------------|--------|------|
| M1 | `small_cnn` | Custom CNN built from zero in `train_image_pv.py` (4 conv-blocks 32→256 + GAP + FC, BatchNorm, Dropout 0.4) | ~2M | Random — truly "from scratch" |
| M2 | `mobilenetv2` | MobileNetV2, ImageNet-pretrained, last layer replaced with 3 outputs, fine-tuned | ~3.5M | Transfer learning |
| M3 | `efficientnetb0` | EfficientNet-B0, ImageNet-pretrained, last layer replaced with 3 outputs, fine-tuned | ~5M | Transfer learning |
| ENS | `ensemble` | **Soft-vote**: mean of M1+M2+M3 probability vectors per image → argmax. No extra parameters, no extra training. | — | — |

**Is small_CNN "a CNN"? YES — with one precise meaning.** CNN (convolutional neural network) is the *family* (any net using convolution layers). `small_cnn` is *one member* of that family: a small, custom, from-scratch CNN written explicitly in the script (`SmallCNN` class), as opposed to M2/M3 which are *named, published* CNN architectures loaded with pretrained weights. So: every M1/M2/M3 is a CNN; only M1 is *your* CNN built line-by-line for the thesis viva.

**What is soft-vote ensemble?** Each model outputs probabilities, e.g. M1=[0.70 early, 0.25 late, 0.05 healthy], M2=[0.60, 0.35, 0.05], M3=[0.10, 0.85, 0.05]. Soft vote averages them → [0.47, 0.48, 0.05] → predicts Late Blight. It trusts *confidence levels*, not just majority labels (that's "hard vote": 2×early vs 1×late → early). Soft vote wins when one model is weakly wrong but another is strongly right — the common case here (M1 hesitant, M2/M3 confident).

**Why do they differ at all?** Three deliberate diversities: (a) *capacity* — 2M vs 3.5M vs 5M params see different detail; (b) *knowledge* — M1 knows only potato leaves, M2/M3 bring ImageNet edge/texture priors; (c) *structure* — plain conv-blocks vs inverted residuals (MobileNet) vs compound-scaled MBConv (EfficientNet) make *different* mistakes, so averaging cancels errors instead of amplifying them.

---

## 2. Training setup (stability design — fits the tiny healthy class)

- Seed 42 + deterministic cuDNN (reproducible).
- Preprocessing: resize → center crop 224, RGB, normalize (ImageNet stats for M2/M3, 0.5 for M1).
- Augmentation TRAIN-ONLY: RandomResizedCrop 0.8–1.0, flip 0.5, rotation ±20°, color jitter 0.2, blur, RandomErasing 0.25. Val/test deterministic.
- Loss: cross-entropy with **class weights (early 2.15 / late 2.15 / healthy 14.22)** + label smoothing 0.1 (healthy errors cost 6.6×; targets 0.9 stop fanatic confidence).
- Optimizer AdamW (M1 lr 1e-3, M2/M3 lr 3e-4, decay 1e-4) + ReduceLROnPlateau (×0.3 after 3 stagnant epochs) + mixed precision.
- Selection: **best val macro-F1 checkpoint** (`best.pt`), early stop patience 8. Test touched once, from `best.pt` only.

---

## 3. Results (test set n=216 — locked until the end)

| Model | Acc | Bal-acc | F1-macro | MCC | ROC-AUC | Per-class F1 (E / L / H) | Epochs (best) |
|-------|-----|---------|----------|-----|---------|--------------------------|---------------|
| M1 small_cnn | 0.9907 | 0.9933 | 0.9849 | 0.9838 | 0.9999 | 0.9950 / 0.9899 / 0.9697 | 24 (16) |
| M2 mobilenetv2 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 / 1.0 / 1.0 | 11 (3) |
| M3 efficientnetb0 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 / 1.0 / 1.0 | 12 (4) |
| Ensemble (soft vote) | **1.0000** | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 / 1.0 / 1.0 | — |

Confusion (M1): [[100,0,0],[1,98,1],[0,0,16]] — the only 2 errors are late-blight leaves (1→early, 1→healthy), the known hard boundary. M2/M3/ensemble: perfect [[100,0,0],[0,100,0],[0,0,16]].
Curves (`outputs_pv/*/curves.png`): train/val loss fall together, val acc tracks train within 2–3%, F1 peaks then early stop — **no underfit** (train acc 0.96–0.99 by ep 3–5) and **no overfit** (val loss never climbs; M1 0.72→0.53).

---

## 4. Interpretation (read this before quoting 100%)

1. Transfer (M2/M3) converges in 3–4 epochs vs M1's 16 — pretraining is worth ~2 weeks of from-scratch tuning on small data.
2. M1 alone already reaches 99.07% — your custom architecture is sound; the 2 misses are the early↔late spot confusion even pathologists debate.
3. Ensemble adds safety, not points here: with members at 99–100%, its value is *variance reduction on future field photos*, not this leaderboard.
4. **Limitation (must state in thesis):** 100% reflects easy lab data — uniform grey background, 256px, 216 test images with only 16 healthy. The model partly cues on background. Real proof = Irish field run (`train_image.py`, 9201 imgs, soil/hands/light variation) + a train-PV→test-Irish cross-domain table. Expect 0.90–0.96 there; that drop is a result, not a failure.

---

## 5. Files & reproduction

```
D:\Potato\train_image_pv.py
D:\Potato\PlantVillage_train.csv (1721) / _val.csv (215) / _test.csv (216)
D:\Potato\outputs_pv/config.json | labels.json | metrics.json | ensemble_config.json | confusion.png
D:\Potato\outputs_pv/{small_cnn,mobilenetv2,efficientnetb0}/{best.pt,last.pt,history.json,curves.png}
  best.pt sizes: 4.62 / 8.71 / 15.56 MB
```
Reproduce: `python D:\Potato\train_image_pv.py --epochs 30 --batch 32 --img 224` (~35 min RTX 3060; `--batch 16` if OOM; `--smoke` for 1-epoch CPU check).
Serve: point `backend/app.py` `OUT` to `outputs_pv` (currently `outputs_image` for the Irish run) — class strings identical so the mobile app needs no change.

**Next:** run the Irish balanced model, then report the PV→Irish gap as Chapter 4's key discussion.

---

## Addendum 2026-09-26 — project-level conclusions (this pilot stays frozen; details in `EXT_report.md`, `IR_report.md §7`, `answer.md:Q40–Q42`)

1. **External datasets are evaluation-only.** Central Java (3,076), Ethiopia (430), BARI
   originals (84): never trained or threshold-tuned on (`included_in_training=0`). Their
   value is independence — Ethiopia healthy 78% / late blight 81% is generalization
   evidence precisely because those farms were never seen.
2. **Early-blight external recall is unmeasurable with current sets** (no EB ground truth
   abroad; EB predicted on 2.9% of Java, 1/430 Ethiopia, 0/84 BARI). Low EB false-positive
   rate is the valid reading; sensitivity needs expert relabel or new collection.
3. **Scope: two-blight specialist + rejecter, not general pathologist.** The model maps
   pixels to EB/LB/Healthy/Non-Leaf and knows no taxonomy; other fungal/bacterial diseases
   (Fusarium, Ralstonia, scab, viruses, nematodes…) are forced into the 4 or rejected —
measured: Java bacteria 93% Non-Leaf. Report scope exactly so; the Unknown gate carries
everything outside it.

4. **M1 underfitting on the 58k pool is a capacity/regularization finding, not a bug.**
Small_cnn (~1.2M params, dropout 0.4 tuned for the 152-healthy pilot, ~99× non_leaf
weight) plateaus at val-F1 ~0.8 on 47.6k full images vs ~0.97 on the 9k subset. Fix branch
(if ever): wider net, dropout 0.2, oversampled minority, higher LR + warmup — as a NEW
experiment, never by editing a running one. Default: accept, document, let transfer
models + C4 verdict decide M1's ensemble place.
5. **Track B runs the full 25 epochs per model** (`--full-epochs` disables early stop;
`best.pt` still = val-F1 peak). Full curves, no truncated histories.
6. **Final standing (2026-09-27, see `IR_report.md §9`, `EXT_report.md §D`,
`answer.md:Q45`):** deploy single M3-combined (Irish .9906 / PV 1.0 / Ethiopia H 85%+LB
100% / corruption ≥.9833); ensemble dropped (M1 drag); no classic overfit anywhere;
M1-58k = capacity underfit; 99×-weight instability self-settled; soil→Healthy 59% and
ECE limits flagged. Project-submission ready with declared limits; not yet production.
7. **Calibration/M1B fix executed 2026-09-27 (`answer.md:Q46`, `IR_report.md §10`):**
`--oversample` + `--loss focal` + `--drop/--m1-lr` implemented, smoke-verified; M1B branch
(`outputs_m1b_full/`) hit 0.9695 by ep3 vs old 0.83. Fix scope = honest confidences, not
accuracy/domain gaps. ELI5: no-overfit = equal at homework and class tests; M1 underfit =
small kid + blurry glasses + 99× topic; M2/M3 swings = new-school panic settled by the
principal (scheduler).
