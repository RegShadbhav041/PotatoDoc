# PotatoDoc — Project Map: files, folders, code, and how everything connects

## 0. One-paragraph orientation

`D:\Potato` is a potato leaf-disease image-classification project (Early Blight |
Late Blight | Healthy + Non-Leaf rejection). Data flows one way:
**images → split CSVs → trainers → weight folders → backend → mobile app**,
with a second loop for trust: **eval/audit scripts → JSON evidence → reports →
registry**. Everything below follows that flow.

## 1. Folders

| Folder | What it holds | Key contents |
|---|---|---|
| `IrishPotato37G_full/` | Main training pool: 58,709 field photos | `earlyblt/` 17,772 · `healthy/` 20,438 · `lateblt/` 20,499 |
| `PlantVillage/` | Lab baseline: 2,152 (1000/1000/152) + 1 stray file | 3 disease subfolders |
| `non_leaf/coco_person/` | 600 COCO person negatives (4th class) | 600 jpgs |
| `non_leaf_v2/` | Diverse negatives: 1,179 across 14 buckets (5 filled, 9 listed empty with shoot list) + manifests + `COLLECT_PROTOCOL.md`, `SHOOT_LIST.md` | soil 320, animals 415, leaves 195, phone 149, crops 100 |
| `backend/` | FastAPI server (`app.py` only) | serves weights → phone |
| `mobile/` | Expo app (`assets/`, `src/{components,constants,hooks,screens}/`) | camera → `/predict` → Unknown card |
| `scripts/` | 17 pipeline scripts (see §3) | splits, downloads, evals, audits |
| `outputs_pv/` | PV lab family weights + metrics (M1/M2/M3 × best/last/resume/history/curves) | final lab baseline |
| `outputs_image/` | Deployed Irish random-split family (same layout) | what the app serves |
| `outputs_irish_grouped/` | Track A grouped retrain + `frozen_audit.json`, `calibration.json`, `thresholds.json`, `errors.json`, `gradcam_errors/` (12) | formal grouped result |
| `outputs_irish_full/` | Track B full-58k run | M3 .9949 |
| `outputs_combined/` | PV+Irish family + `corruption_results.json`, dual metrics files | deploy candidate (M3) |
| `outputs_m1b_full/` | M1B fix branch (m1 only) | .9942 + calibration proof |
| `calibration/` | `thresholds.json` (live Unknown gate: normalized entropy 0.85 / prob 0.55) | loaded by backend at startup |
| `_staging/` | Raw downloads: `central_java/` (3,076, 7 labeled dirs), `ethiopia/`, `bari/`, `plantdoc/`, `we3ds_rgb/` (320), `oi/` (annotations), `WE3DS.zip` (md5-ok) | never trained on |

## 2. Data + evidence files (root)

- **Splits (all `filepath,label,source`):** `PlantVillage_{train,val,test}.csv` (lab) ·
  `Irish_balanced_*.csv` (9k random) · `Irish_grouped_*.csv` (+`strict_test`, remapped live,
  34 `_1`→base fallbacks in `tracka_remap.json`) · `Irish_full_grouped_*.csv` (47,590/5,859/
  5,860) · `combined_{train,val}.csv` (PV+Irish 10,058/1,256).
- **Manifests/hashes (W7):** `dataset_manifest_full.csv`, `splits_hash_full.json`,
  `central_java_manifest.csv`, `external_manifests.csv` (3,590), `non_leaf_openset.csv`
  (locked 590, sha `89f9f6…`), `non_leaf_v2_manifest.csv`, `openimages_ids.csv`,
  `dropped_{corrupt,truncated}.json`, `review_pass.json`, `grouped_split_audit.json`,
  `leakage_report.json`, `tracka_remap.json`.
- **Results JSON:** per-run `metrics.json` (+`metrics_*_test.json`), `*_probas.npz`
  (probas+logits), `calibration.json`, `frozen_audit.json`, `cross_domain.json`,
  `uncertainty_supplement.json`, `ensemble_audit.json`, `latency_benchmark.json`,
  `ext_{java,eth_bari,openset}[_combined].json`, `corruption_results.json`.
- **Docs:** `main_report.md` (front door) · `report.md` (frozen pilot + addenda) ·
  `PV/IR/EXT_report.md` (family reports) · `report_2.md` (forward plan) · `answer.md`
  (Q1–Q47 living log) · `analysis.md` (early plan) · `explanation.md` (trainer walkthrough) ·
  `README.md` (rejection design) · `Summary.md` + paper PDF + `Improved_Model_Pipeline.md`
  (superseded weather era) · `experiment_registry.csv` (17 rows, every run).
- `requirements.txt`, `download_irish_full.py` (21-zip resumable Zenodo fetcher).

## 3. Code: what each file does and how it runs

- **`train_image.py`** — THE trainer (Irish/combined/full). `LeafDS` lazy-loads RGB by CSV
  path; `make_tfms` (train-only strong aug); `SmallCNN` custom net; `build_model` (M1/M2/M3);
  `FocalLoss`; `train_one` (AdamW, plateau scheduler, val-F1 `best.pt`, resume-safe,
  `--oversample` sampler, `--full-epochs`); eval → metrics/confusion/curves + val/test
  logit dumps. Flags: `--models/--epochs/--batch/--img/--seed/--train-csv/--val-csv/`
  `--test-csv/--out-dir/--resume/--eval-only/--smoke/--oversample/--loss/--drop/--m1-lr/`
  `--full-epochs`. Run: `python train_image.py --epochs 25 --batch 32 --out-dir <NEW> --resume`.
- **`train_image_pv.py`** — same design for PlantVillage (documented line-by-line in
  `explanation.md`); also lends `SmallCNN` to the backend importer.
- **`backend/app.py`** — loads `best.pt` per model from `POTATO_WEIGHTS_DIR`; `probs_of`
  inference; `green_ratio` (logged, never a hard gate); `norm_entropy` = H/log(n);
  thresholds from `calibration/thresholds.json`; Non-Leaf or uncertain → Unknown card JSON;
  `gradcam_overlay` manual Grad-CAM; `/ping /models /predict /gradcam`. Run:
  `uvicorn backend.app:app --host 0.0.0.0 --port 8000`.
- **`scripts/` (17):** `build_full_splits.py` (grouped splits+hashes) ·
  `clean_splits.py`/`deep_clean.py` (drop unreadable/truncated + rehash) ·
  `fetch_we3ds.py` (resumable 10.8 GB + md5) · `fetch_mendeley.py` (public-API + sha verify) ·
  `fetch_openimages.py` (ID-list subset + manifest, 429-safe) · `plantdoc_pull.py`
  (Windows-legal selective checkout) · `we3ds_stage.py`/`stage_negatives.py`/`review_pass.py`
  (bucket + dedupe + manifests) · `calibrate.py` (val-only T/ECE/Brier) ·
  `fit_threshold.py` (Youden gate lock) · `frozen_audit.py` + `eval_external.py` +
  `corrupt_eval.py` (frozen-weight evals, never overwrite source dirs) ·
  `error_review.py` (error Grad-CAMs) · `monitor_train.py` (safe status).
- **`download_irish_full.py`** — original 21-zip resumable fetcher (provenance).

## 4. Connections (the two loops)

**Build loop:** image folders → `scripts/build_full_splits.py` → split CSVs →
`train_image.py --out-dir <family>` → `outputs_<family>/{best.pt,metrics.json,…}` →
`backend/app.py` (`POTATO_WEIGHTS_DIR`) → `mobile/` (`/predict`, `/gradcam`).
**Trust loop:** split CSVs + frozen weights → `frozen_audit/eval_external/corrupt_eval/
error_review` scripts → `*.json` evidence → `*_report.md` + `experiment_registry.csv`;
negatives/external raw → `stage/review` scripts → manifests → locked open-set;
`val_probas.npz` → `calibrate.py`/`fit_threshold.py` → `thresholds.json` → backend gate.
Rule: eval scripts read weights/CSVs and write only their own outputs — deployed
`outputs_image/` is never overwritten by experiments (each run gets a new out-dir).
