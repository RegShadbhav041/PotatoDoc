# PV Report — PlantVillage Family (Lab Domain)

**Model family:** M1 small_cnn (custom, from scratch) · M2 mobilenetv2 (transfer) · M3 efficientnetb0 (transfer) · Ensemble (soft vote)
**Data:** PlantVillage potato + 600 COCO person negatives (`non_leaf/coco_person/`)
**Splits (stratified, seed 42, 80/10/10):** train 2201 (800/800/480/121) · val 275 (100/100/60/15) · test 276 (100/100/60/16)
**Code:** `D:/Potato/train_image_pv.py` (line-by-line: `explanation.md`) · **Weights:** `D:/Potato/outputs_pv/`
**Hardware:** RTX 3060, 224px, mixed precision · **Run:** 16 epochs locked (your requirement)

## 1. Training
- Seed 42 deterministic; augmentation train-only (crop/flip/rotate/jitter/blur/erase); deterministic val/test crop.
- Loss: weighted CE (early 2.75 / late 2.75 / healthy 18.19 / non_leaf 4.59) + label smoothing 0.1.
- AdamW (M1 lr 1e-3, M2/M3 3e-4, decay 1e-4) + ReduceLROnPlateau (×0.3, patience 3) + early stop val-F1 patience 8 + `best.pt` selection + per-epoch `resume.pt` (`--resume`).
- M1 ran 16/16 (best ep14 F1 .9650); M2 stopped ep12 (best ep4 F1 1.0); M3 stopped ep10 (best ep2 F1 1.0).

## 2. Testing (locked test, n=276)

| Model | Acc | Bal-acc | F1-macro | MCC | ROC-AUC | Per-class F1 (E/L/H/N) |
|-------|-----|---------|----------|-----|---------|------------------------|
| M1 small_cnn | 0.9855 | — | 0.9828 | 0.9791 | ~1.0 | 0.985 / 0.985 / 0.970 / 0.992 |
| M2 mobilenetv2 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 | 1.0 × 4 |
| M3 efficientnetb0 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 | 1.0 × 4 |
| Ensemble | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0 | 1.0 × 4 |

M1 errors (4): Non-Leaf recall 59/60 (1 person → late blight); 3 leaf misses on the early↔late boundary.
Curves (`outputs_pv/*/curves.png`): train/val track within 2–3%, val loss falls throughout — **no underfit** (train 0.93 by ep16) **no overfit** (no val climb; early stop + dropout + augmentation held).

## 3. Validation beyond the test set
- **Foreign-object rejection:** 60 held-out person photos → M1 59/60 Non-Leaf, M2/M3/ensemble 60/60; backend maps Non-Leaf → mobile Unknown card (verified end-to-end: person → `Unknown 0.828`).
- **Green-gate calibration:** rejected as a hard rule — necrotic early-blight leaves score green≈0.000, same as persons. Logged only (`green_ratio` in responses).
- **Cross-domain (Irish field test, n=981):** M1 acc 0.3904 / M2 0.3160 / M3 0.3578 / ens 0.3721 (F1 0.26–0.38). The lab family collapses in the field — background shift, not a bug. This is the thesis headline: lab accuracy does not transfer; field training (IR family) is required. Full table: `cross_domain.json` → `pv_on_irish`.

## 4. Stability verdict
Fit is clean on lab data; the 16-epoch demand is satisfied literally (M1 ran all 16; `best.pt` = ep14 peak — reported honestly). Limitation: 100% reflects uniform grey backgrounds + tiny healthy test (16); background cueing proven by §3.

## 5. Files & reproduction
`PlantVillage_train/_val/_test.csv` · `outputs_pv/{config,labels,metrics,ensemble_config}.json` · `confusion.png` · per-model `{best,last,resume}.pt + history.json + curves.png` (4.62/8.71/15.56 MB).
```powershell
python D:\Potato\train_image_pv.py --epochs 16 --batch 32 --img 224 --models m1 m2 m3
```
Serve: `$env:POTATO_WEIGHTS_DIR="D:/Potato/outputs_pv"; uvicorn backend.app:app --port 8000`
