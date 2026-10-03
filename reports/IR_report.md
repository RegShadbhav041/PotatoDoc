# IR Report — Irish Family (Field Domain, Deployed)

**Model family:** M1 small_cnn (custom, from scratch) · M2 mobilenetv2 (transfer) · M3 efficientnetb0 (transfer) · Ensemble (soft vote)
**Data:** Irish field photos (`IrishPotato37G/`: early 5276 / healthy 5665 / late 3067) + 600 COCO person negatives
**Splits (stratified, seed 42, 80/10/10):** train 7840 (2454/2453/2453/480) · val 980 (306/307/307/60) · test 981 (307/307/307/60)
**Code:** `D:/Potato/train_image.py` (dynamic N-class + `--resume`) · **Weights:** `D:/Potato/outputs_image/`
**Hardware:** RTX 3060, 224px model input, FULL-resolution source (no downscaling — your requirement), mixed precision
**Run:** `--epochs 25`, detached + foreground chunks, `--resume` throughout (power-cut safe)

## 1. Training (≈ full day wall-clock; full-res decode is the bottleneck, ~15–25 min/epoch)
- Same stability recipe as PV: seed 42, train-only augmentation, weighted CE (potato 3.20 each / non_leaf 16.33) + smoothing 0.1, AdamW, Plateau scheduler, early stop patience 7, `best.pt` + per-epoch `resume.pt` (incl. `n_classes` + stale-guard).
- M1: early stop ep13 · M2: early stop ep11 · M3: full 25/25 (best ep5 F1 .9992; plateau micro-jittered, never beaten — honest non-stop, not forced).

## 2. Testing (locked test, n=981)

| Model | Acc | F1-macro | MCC | ROC-AUC | Per-class F1 (E/L/H/N) |
|-------|-----|----------|-----|---------|------------------------|
| M1 small_cnn | 0.9633 | 0.9604 | 0.9480 | — | 0.957 / 0.970 / 0.965 / 0.949 |
| M2 mobilenetv2 | 0.9990 | 0.9992 | 0.9986 | — | 0.998 / 0.998 / 1.0 / 1.0 |
| M3 efficientnetb0 | 0.9990 | 0.9992 | 0.9986 | — | 0.998 / 0.998 / 1.0 / 1.0 |
| Ensemble | 0.9990 | 0.9992 | 0.9986 | — | same (1 miss in 981: 1 early→late) |

M1 confusion [[290,3,14,0],[8,294,5,0],[0,0,305,2],[1,2,1,56]]: 36 errors, concentrated early↔late/healthy on real field photos (soil, hands, shadows, mixed lighting) — versus 4 errors on lab data. **This gap (PV M1 .9907 → Irish M1 .9633) is the field-difficulty proof.** Transfer models still near-perfect: Non-Leaf 60/60 (M2/M3/ens), 56/60 (M1).

## 3. Validation beyond the test set
- **Foreign-object rejection:** trained Non-Leaf + entropy rule + backend Unknown mapping (same contract as PV; mobile untouched). M1 misses 4 persons (→disease), M2/M3 zero.
- **Cross-domain (PV lab test, n=276):** M1 acc 0.5036 / M2 0.5181 / M3 0.4094 / ens 0.4783 (F1 0.41–0.47). Symmetric collapse with PV→Irish (0.32–0.39): neither domain transfers to the other — deployment must serve the MATCHING family (Irish for phone photos). Full table: `cross_domain.json` → `irish_on_pv`.
- **Stability:** no underfit (train acc high by ep3–5); no overfit (early stops fired on val-F1; best-checkpoints used for test).

## 4. Deployment (this is the served family)
Backend default `OUT = outputs_image/` serves these weights. Mobile needs no change (class strings + endpoints identical; Non-Leaf → Unknown card). Serve:
```powershell
uvicorn backend.app:app --host 0.0.0.0 --port 8000   # from D:\Potato
# phone: EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:8000
```

## 5. Files & reproduction
`Irish_balanced_train/_val/_test.csv` · `outputs_image/{config,labels,metrics,ensemble_config}.json` · `confusion.png` · per-model `{best,last,resume}.pt + history.json + curves.png` · `train.log` (full epoch diary).
```powershell
python D:\Potato\train_image.py --epochs 25 --batch 32 --img 224 --models m1 m2 m3 --resume
python D:\Potato\train_image.py --eval-only --models m1 m2 m3   # metrics/plots only
```
Note: full-res epochs run 15–25 min on RTX 3060 (CPU decode-bound); total ≈ a day. Pre-resizing to 512px would cut ~4× (listed future work — rejected per your no-compromise requirement).

## 6. Conclusion
The Irish 4-class ensemble (99.90% acc / 99.92% F1 / 99.86% MCC on 981 field test images, calibrated rejection of persons/objects) is the deployable PotatoDoc model. Remaining work: joint PV+Irish training, soil/hands field negatives, live farm trial.

## 7. Addendum 2026-09-25 — grouped retrain (Track A, `outputs_irish_grouped/`)
Same architecture, retrained on grouped-train (7,857 imgs, proxy bands) and tested on
grouped-test (n=962, zero group overlap): M1 .9678 / M2 .9854 / **M3 .9896**
(F1 .9914, MCC .9852, Wilson95 [.9810, .9943]) / Ens .9865. Frozen random-split
weights collapse to ~.39–.40 on this test (`frozen_audit.json`) — leakage proof, audit
only. Val-fitted T .30–.35 cuts ECE .15–.18 → .002–.005 (`calibration.json`).
Single M3 beats the ensemble here — deployment decision stays evidence-gated pending
external + corruption tests. Deployed weights unchanged (`outputs_image/`).

## 8. Addendum 2026-09-26 — Track B full-data run (`outputs_irish_full/`)

25 forced epochs on 47,586 grouped-train images; grouped-test n=5,860:
M1 .9713 / M2 .9927 / **M3 .9949** (Wilson95 [.9927, .9964], MCC .9924) / Ens .9855.
Two honest findings the big test exposed: (1) non-leaf precision collapses
(M1 .28, Ens .43 at recall 1.00) — the ~99× class weight biases heads toward Non-Leaf,
and M1 drags the ensemble below M3 alone; (2) val ECE .45–.47, temperature scaling
insufficient (T hits grid floor, ECE stays .27–.34) — full-data probabilities need an
oversampling/focal-loss fix, not just scaling. Deployed weights unchanged.

## 9. Overall retraining verdict 2026-09-27 (all tracks, C4 deploy decision)
Best family = combined-training M3 (`outputs_combined/efficientnetb0/best.pt`):
Irish grouped 0.9906 · PV lab 1.0000 · Ethiopia healthy 85% / late blight 100% ·
Java phytophthora→LB 76% · corruption worst-case 0.9833 (bright) ·
latency 5.2 ms CUDA / 23 ms CPU, 4.01M params, 16.33 MB.
Under/overfit: train−val loss gaps ≤0.07 in all 15 runs (no classic overfit anywhere);
M1's ~0.8 ceiling on 58k = capacity/underfit (documented, Q43); M2/M3 mid-training
val-F1 swings = 99× non-leaf weight instability, settled by scheduler LR cuts.
Ensemble DROPPED: M1's Non-Leaf over-calls drag the vote below M3 alone on every
grouped/full test. Deploy = single M3-combined. Known regressions flagged, not hidden:
soil→Healthy 59% under combined weights; full-data ECE needs oversampling/focal fix;
Java healthy 23–30%; external EB recall unmeasurable. Submission readiness: §10.

## 10. Addendum 2026-09-27 — M1B fix branch + submission checklist

Fix branch (`outputs_m1b_full/`, m1 only: dropout 0.2, lr 2e-3, `--oversample`,
`--loss focal`, mild ~10× weights): ep3 val-F1 0.9695 vs old M1 best 0.83 — recipe works.
Calibration fix scope: honest confidences + working Unknown gate; not accuracy/domain
gaps (those need data). If M1B ECE stays high → per-class temperature, Dirichlet
calibration, or OOD-first two-stage. Submission checklist: serve M3-combined best.pt +
labels.json (keep prior dir as rollback) → demo leaf→diagnosis + person/soil→Unknown →
slides (grouped-vs-random honesty, Ethiopia 85/100%, limitations) → freeze open-set hash
+ registry. Production blockers restated: soil regression, ECE, Java healthy, EB recall,
9 empty buckets.

**M1B result (closed 2026-09-27): acc .9942 / F1 .9956 / MCC .9914 (n=5,860),
non-leaf 1.00/1.00 — the precision collapse is FIXED; ECE .167 → .0037 at T .35 —
the calibration fix is PROVEN, no escalation needed.** Your custom from-scratch CNN now
matches transfer models on full data. M1B stands as the capacity-fix demonstration;
deploy family unchanged (M3-combined) pending C4 re-vote with M1B included.
