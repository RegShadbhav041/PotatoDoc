# Varied-data evaluation — analysis & failure enlistment

Source: `reports/varied_eval_results.json` (221 images, 884 predictions, seed 42).
Regenerate: `python scripts/varied_eval.py --per-small 5`; aggregates: `python scripts/risk_analysis.py`.

Expected-set semantics: exact class for clean in-distribution leaves; Unknown required for
everything outside the label space (bacteria/fungi/virus/nematode/pest, other crops, non-leaf,
soil, people, corruptions). `bari_fungal_late_blight`, `java_phytophthora`, plantdoc tomato
Early/Late blight accept the matching disease OR Unknown.

## Headline numbers

| model | overall | OOD called a disease (danger) | OOD called Unknown (safe) | real leaf correct | leaf -> wrong diagnosis | leaf -> false Unknown |
|---|---|---|---|---|---|---|
| Small CNN | 60.2% | 61/133 (46%) | 54% | 61/88 (69%) | 16% | 23% |
| MobileNetV2 | 74.7% | 37/133 (28%) | 72% | 69/88 (78%) | 11% | 17% |
| EfficientNetB0 | 76.5% | 38/133 (29%) | 71% | 74/88 (84%) | 3% | 18% |
| Ensemble | 83.3% | 17/133 (13%) | 87% | 68/88 (77%) | 6% | 28% |

- Clean in-distribution (PlantVillage 90–100%, Irish 95% per model) — healthy overall.
- Ensemble is the safest default: lowest dangerous OOD rate (13%), fewest wrong diagnoses.
- Ensemble over-rejects real leaves as Unknown (28%) — mostly external healthy + corruptions.
- EffNetB0 is the most accurate on real leaves (84%) and only 3% wrong-diagnosis.
- Small CNN is clearly behind (60.2%) — worst on other-crop leaves (52%) and blur (wrong disease, not Unknown).

## Failure enlistment (by severity, for later fixing)

### P0 — confident false diagnosis on out-of-scope input (dangerous)

1. **soil/ground photos -> "Healthy" at 0.78–0.91 conf** (all models; ensemble 3/5, others worse).
   We3DS field soil shots. `green_ratio` does not gate them. Example: `we3ds_img_01008.png -> Healthy 0.91`.
2. **Central-Java healthy field leaves -> "Late Blight" at 0.56–0.88** (Small 7, MNV2 5, Ens 4 cases;
   EFB0 0 but rejects 11 as Unknown). External healthy is the model's weakest in-scope class.
3. **Bacterial Soft Rot -> "Late Blight/Healthy" at 0.56–0.90** (all models, e.g. `orig_5 -> Late Blight 0.84`).
4. **Bacterial/fungal/virus/pest/nematode (java) -> disease at 17–33% rate**, mostly Late Blight;
   worst: `virus -> Late Blight 0.89`, `pest -> Late Blight 0.88` (EffNetB0).
5. **Other-crop leaves with spot/rust lesions -> potato disease**: Apple rust -> Late Blight 0.87 (ens),
   Tomato Septoria -> Early Blight 0.74–0.81 (ALL models, 100% of sampled images),
   Tomato mosaic virus -> Early Blight 0.90 (Small CNN).

### P1 — in-scope failures

6. **`irish_test/earlyblt92.jpg -> Healthy ~0.89 by ALL 4 models** — single systematic
   in-distribution miss; inspect the image (possible mislabeled/ambiguous lesion).
7. **bari_healthy (external healthy) -> Unknown, 6/6 for Small/EffNetB0/Ensemble** at conf 0.29–0.52:
   false rejects. Confirms `calibration/thresholds.json` status "heuristic-carryover pending val
   refit" — `prob_min=0.55` / `entropy_max=0.85` are too tight for external healthy.
8. **Heavy blur -> wrong disease by Small CNN** (Late Blight 0.74–0.86) while MNV2/Ensemble correctly
   return Unknown (retake) and EffNetB0 still diagnoses (100%). Overexposed: Small/Eff correct,
   MNV2/Ens return Unknown.
9. **PV `late_blight -> Unknown 0.47` (Small CNN only)** — one clean test leaf rejected.

### P2 — acceptable but worth noting

10. Ensemble leaf->Unknown 28%: safe direction (no wrong disease), but user sees "retake" on valid
    external healthy photos — hurts usability in field conditions.
11. phytophthora (late-blight pathogen) and bari_fungal_late_blight: partially recognized as Late
    Blight, partially Unknown, partially wrong (MNV2 -> Healthy 3/6) — needs external-disease data.

## Suggested fix directions (for the later solving session)

- Re-train/fine-tune with harder negatives: soil/ground, external healthy field photos, bacterial/
  viral leaf images as extra "other disease" negatives (or a proper 5th class `other_disease`).
- Refit temperature + gates on val (`scripts/calibrate.py`, P0-4) to stop false-Unknown on external
  healthy while keeping OOD rejection.
- Add a green-ratio/soil veto tuned on the `non_leaf_v2/soil_ground` set (currently ineffective).
- Study `earlyblt92.jpg` and the Tomato Septoria confusions (visual near-duplicates of spot patterns).
- Consider dropping Small CNN from the ensemble if it stays at 60%, or retrain it with augmentation.
