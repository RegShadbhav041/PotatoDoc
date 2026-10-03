# PotatoDoc — Main Project Report (consolidated, 2026-09-27)

This file consolidates every project document (`analysis.md`, `Summary.md`,
`explanation.md`, `Improved_Model_Pipeline.md`, `README.md`, `report.md`,
`PV_report.md`, `IR_report.md`, `report_2.md`, `EXT_report.md`, `answer.md` Q1–Q47,
`experiment_registry.csv`, `non_leaf_v2/COLLECT_PROTOCOL.md` + `SHOOT_LIST.md`)
into one record: origin, pipeline, every training run per model before/after,
supervisor weaknesses with mitigations, calibration, external/open-set evidence,
fit analysis, deploy verdict, and submission readiness.

---

## 1. Origin and pivot

The project began from Radwan et al. 2024/25 (Potato Research 68:897–921): weather-tabular
early/late-blight prediction on 4,020 rows (temperature, humidity, wind, visibility,
pressure), PCA + K-means + copula + bGGO selection, 9 classifiers, best MLP+bGGO 98.3%
(`Summary.md`, `Improved_Model_Pipeline.md` with a 99.0–99.5% stacking plan to beat it).
**Pivot (Q4):** weather modeling dropped; the project became 3-class leaf-image
classification (Early Blight | Late Blight | Healthy) from PlantVillage + Irish field
photos, built from scratch. The weather docs remain background only.

## 2. Datasets (all verified on disk)

| Dataset | Contents | Source |
|---|---|---|
| PlantVillage potato | 2,152 (1000 EB / 1000 LB / 152 H, 256px lab) | complete, standard |
| Irish full (`IrishPotato37G_full/`) | 58,709 (17,772 E / 20,438 H / 20,499 L, field, Galaxy A03-class phones, Zenodo 17553016) | 50/class readability-checked |
| COCO persons | 600 person-not-plant negatives → 4th `non_leaf` class | seed 42 |
| non_leaf_v2 (new) | 1,179: soil 320 (WE3DS, md5-verified) + foreign leaves 195 (PlantDoc) + OI v7 subset 664/800 (Flickr rot logged) + buckets animals/phone/crops | 9 buckets empty → `SHOOT_LIST.md` |
| Central Java (external) | 3,076 smartphone farm photos, 7 native classes (counts matched to paper Table 1 exactly) | Mendeley `ptz377bwb8`, CC BY 4.0, sha-verified |
| Ethiopia (external) | 430 (363 H / 67 LB, real farm) | Mendeley `v4w72bsts5`, tar-extracted |
| BARI (external) | 84 originals in this mirror (2,267 augmented EXCLUDED) | Mendeley `d5b3fzpw3g` |

Zenodo 8286529 and PlantVillage mirrors are explicitly excluded as external proof (data
leak by origin). Full grouped splits: train 47,586 / val 5,859 / test 5,860 (1,188 proxy
bands, zero overlap, SHA-256 in `splits_hash_full.json`); balanced grouped: 7,857 / 981 /
962 (+738 strict unlinkable subset).

## 3. Pipeline (identical for every run unless noted)

`train_image.py` / `train_image_pv.py`: M1 small_cnn (custom 4-block 32→256 + GAP + FC,
~1.2M params) · M2 MobileNetV2 (~2.2M, ImageNet) · M3 EfficientNetB0 (~4M, ImageNet) ·
soft-vote ensemble (mean probs → argmax). Seed 42, deterministic cuDNN, 80/10/10 splits,
weighted CE + label smoothing 0.1, AdamW (M1 1e-3, transfer 3e-4), ReduceLROnPlateau,
best-val-macro-F1 `best.pt` + per-epoch `resume.pt` (stale-head guard, `--resume`),
train-only augmentation (later strengthened: crop 0.7, rot ±30°, jitter 0.4+0.1hue,
blur σ≤2, sharpness/autocontrast, erasing 0.35). Eval: locked test, acc/bal-acc/macro-F1/
MCC/per-class/ROC-ovr/confusion/curves + (later) val/test logit dumps. Serving:
`backend/app.py` — Non-Leaf → Unknown card, normalized-entropy gate (`H/log(n)`,
`calibration/thresholds.json`), `/gradcam` overlays, `POTATO_WEIGHTS_DIR` switching.

## 4. Every run, per model (before → after)

| Run | Test | M1 | M2 | M3 | Ens |
|---|---|---|---|---|---|
| PV 3-class pilot (`report.md`, SUPERSEDED) | 216 lab | .9907 | 1.0000 | 1.0000 | 1.0000 |
| PV 4-class (`PV_report.md`, lab baseline) | 276 | .9855 (NL 59/60) | 1.0000 | 1.0000 | 1.0000 |
| Irish random (`IR_report.md §1–6`, deployed) | 981 field | .9633 | .9990 | .9990 | .9990 (1 err) |
| Cross-domain collapse | 981↔276 | — | — | — | PV→Irish .3721, Irish→PV .4783 |
| Track A grouped (`IR §7`) | 962 grouped | .9678 | .9854 | **.9896** | .9865 |
| Frozen audit (old weights → grouped) | 962 | .3898 | .3919 | .4023 | .3929 |
| Track B full 58k (`IR §8`) | 5,860 | .9713 (F1 .8462) | .9927 | **.9949** | .9855 |
| Combined PV+Irish | 962 + 276 | .9740 / .9783 | .9823 / 1.0 | **.9906** / 1.0 | .9875 / 1.0 |
| M1B fixed (`IR §10`) | 5,860 | **.9942** (F1 .9956, NL 1.00/1.00) | — | — | — |

Cross-run reading: random-split 99.9% → grouped 98.7–99.0% (leakage cost ~1pp, proven by
the frozen collapse to ~39%); full data lifts M3 to 99.49% but exposes non-leaf precision
collapse (M1 .28, Ens .43 at recall 1.00 — 99× weight artifact) and unscalable ECE;
combined training cures cross-domain collapse (PV 100% + Irish 99.06% in one family);
M1B (dropout 0.2, lr 2e-3, oversample, focal) takes the custom CNN 0.83 → 0.9942 with
perfect non-leaf and ECE .167 → .0037.

## 5. Supervisor weaknesses → mitigations (all 7 + 5 refinements)

W1 random-split inflation → proxy-band grouped splits + pHash/EXIF audit (band overlap
70%, pHash leak rate 14.29%, transitive-closure rejected after giant-component finding,
strict 738 subset) + frozen audit + grouped retrains. W2 small test → Wilson/bootstrap
CIs everywhere (e.g. M3 grouped [.9810, .9943]), 5,860-image test. W3 narrow non-leaf →
v2 buckets + locked 590 open-set (sha `89f9f6…`) + shoot list for 9 gaps. W4 uncalibrated
gate → normalized entropy documented, T fits (Track A .30–.35, ECE → .002–.005),
Youden-locked ent 0.17 (family file), oversample+focal code + M1B proof. W5 background
shortcuts → stronger augmentation, combined training, corruption suite (M3/Ens ≥.9833,
M1 bright .8833). W6 ensemble → audits + latency (1.4/3.4/5.2 ms CUDA, 4.85/9.14/16.33 MB):
M3 alone wins every grouped/full test → ensemble DROPPED, M1 vote dropped. W7
reproducibility → `experiment_registry.csv` (17 rows), split/manifest SHA-256,
checkpoint + env logging per run. Refinements honored: proxy-not-plant labeling, 5-step
audit sequence (frozen never called final), entropy normalization recorded, source-first
external design, evidence-based (not size-based) deploy choice.

## 6. External + open-set roles and outcomes

Eval-only, independence = evidence (`included_in_training=0`). Java: phyto→LB 55→76%,
bacteria→Non-Leaf 89–93%, healthy→H 23–30% (weak, stated), fungi split (no forcing).
Ethiopia: H 78→85%, LB 81→100% (combined) — best generalization proof. BARI: uncertainty
dominates (honest limit). EB external recall unmeasurable (no EB ground truth; EB
predicted 2.9% Java — low false-positive rate is the valid reading). Open-set: animals/
phone ~100%, crops 94–96%, soil 91%→59% under combined (REGRESSION flagged), foreign
leaves 64–72% (hardest). Uses: train slice → future 4th-head retrain; locked slice →
final exam. (`EXT_report.md`, `ext_*_results.json`, `central_java_manifest.csv`.)

## 7. Fit analysis (15 runs, histories measured)

No classic overfit anywhere (train−val gaps ≤0.07). M1-58k = capacity underfit (fix
recipe Q43, proven by M1B). M2/M3 val-F1 swings = 99×-weight instability, scheduler-settled,
peaks kept. ELI5 (`answer.md:Q46`): no-overfit = equal at homework and class tests; M1 =
small kid + blurry glasses + 99× topic; swings = new-school panic calmed by the principal.

## 8. Deploy verdict + submission readiness

Deploy single M3-combined (99.06 Irish / 100 PV / Ethiopia 85+100 / corruption ≥98.3%).
Project-submission READY: working app + Unknown path, grouped + 3-country external +
corruption + calibration + locked open-set, manifests/hashes/registry, all limits
declared. NOT production: soil regression, ECE fix scope, Java healthy, EB recall,
9 empty buckets. Checklist (`IR §10`): serve best.pt + labels.json (rollback kept) →
demo (leaf→diagnosis, person/soil→Unknown) → 3 slides (honesty, Ethiopia, limits) →
frozen hashes + registry.

## 9. File index (where everything lives)

Runs: `outputs_{pv,image,irish_grouped,irish_full,combined,m1b_full}/` (+`outputs_smoke*`
removed). Splits/manifests/hashes: `Irish_*grouped*.csv`, `combined_*.csv`,
`dataset_manifest_full.csv`, `splits_hash_full.json`, `tracka_remap.json`,
`dropped_{corrupt,truncated}.json`. Calibration: `calibration/thresholds.json`,
`scripts/calibrate.py`, `fit_threshold.py`, per-run `calibration.json` + `thresholds.json`.
Audit/eval: `cross_domain.json`, `uncertainty_supplement.json`, `ensemble_audit.json`,
`latency_benchmark.json`, `grouped_split_audit.json`, `leakage_report.json`,
`frozen_audit.json`, `errors.json` + `gradcam_errors/`, `corruption_results.json`.
Acquisition: `scripts/{build_full_splits,clean_splits,deep_clean,fetch_we3ds,fetch_mendeley,
fetch_openimages,plantdoc_pull,we3ds_stage,stage_negatives,review_pass,monitor_train,
frozen_audit,eval_external,error_review,fit_threshold,corrupt_eval}.py`,
`openimages_ids.csv`, `central_java_manifest.csv`, `external_manifests.csv`,
`non_leaf_{openset.csv,v2_manifest.csv,manifest_*.csv}`, `_staging/` (WE3DS zip md5-ok,
PlantDoc, OI annotations). Docs: this file plus the section-1 list; living log \nswer.md\ Q1-Q47.
