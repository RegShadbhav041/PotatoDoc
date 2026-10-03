# Report 2 — Forward Plan: Full-Dataset Irish Training + All Supervisor Mitigations

**Date:** 2026-09-25 · **Status:** preparation complete, training + field collection pending
**Supersedes:** nothing (Report 1 = `report.md` pilot; `PV_report.md` / `IR_report.md` stay as final baselines)

This file is the complete, ordered work plan from now on. Every step names its
command, output files, and acceptance criteria. No results are claimed before they are run.

---

## 0. Verified starting point (done this session)

- Full pool: `IrishPotato37G_full/` = early 17,772 / healthy 20,438 / late 20,499
  (**58,709** leaf images, 50/50/class PIL-readability check passed) + 600 COCO
  person negatives → **59,309** total.
- Grouped splits built by `scripts/build_full_splits.py` (seed 42, proxy bands,
  zero train/test group overlap, 1,188 groups):
  train **47,590** (14172/16500/16438/480) · val **5,859** · test **5,860**
  (1800/2000/2000/60). Files: `Irish_full_grouped_{train,val,test}.csv`.
- Manifest: `dataset_manifest_full.csv` (filepath, label, source, bytes);
  hashes: `splits_hash_full.json` (test CSV `1c5a1d…`, val `4e661e…`, train
  `9af59a…`, manifest `1ae84d…`).
- Trainer upgrade (W7 isolation + W4 dumps): `train_image.py` accepts
  `--train-csv/--val-csv/--test-csv/--out-dir`, records them in `config.json`,
  and every eval dumps `val_probas.npz` (`*_logits` + true) and `test_probas.npz`
  (`*_proba` + `*_logits` + true). `scripts/calibrate.py` consumes the VAL file only.
- Smoke test passed on the new splits (`--out-dir outputs_smoke_full`, CPU, 1 epoch;
  numbers throwaway by design). Deployed weights in `outputs_image/` untouched.

---

## 1. W1 — Grouped evaluation: what grouping we can honestly claim

1. **Zenodo metadata probe — done, negative result.** Record 17553016 publishes one
   zip per class (`EARLYBLT_1..9`, `LATEBLT_1..6`, `HEALTHY_1..6`); filenames inside
   are flat (`earlyblt5873.jpg`, up to `healthy20080.jpg`). No plant / field /
   session / timestamp metadata ships with the release. Therefore filename bands are
   a **source-aware proxy**, never a plant-level split — label all grouped results so.
2. **Measured leakage signals (keep as thesis evidence):**
   - filename-band overlap: 143/204 OLD-random test groups also in train (~70%);
   - pHash≤3 near-duplicate rate: 140/980 OLD-random test images (14.29%) have a
     train neighbor (`leakage_report.json`);
   - transitive pHash∪timestamp closure collapses to one giant component (8,799),
     so closure-merging is **rejected**; EXIF (one phone model, SM-A032F) validates
     bands only (median 2 dates/band).
3. **Mandatory 5-step sequence** (only step 5 is presented as formal grouped performance):
   1. frozen random-split weights → grouped test (leakage audit, §2 Track A eval);
   2. grouped partitions — DONE (`Irish_full_grouped_*.csv`);
   3. retrain on grouped-train only (§2);
   4. fit temperature T + Unknown threshold on grouped-VAL only (§5);
   5. single locked eval on grouped-test (§2 + §5).

## 2. Irish training on the new dataset (two tracks)

**Shared rules:** new `--out-dir` per track (never overwrite `outputs_image/`);
`--resume` for power-cut safety; record exp ID + CSV SHAs + checkpoint SHA-256 +
torch/CUDA + command in `experiment_registry.csv`. Class imbalance is handled by
the existing weighted CE + label smoothing (no downsampling of the 58k).

**Track A — formal grouped result (run first).**
Same 9,201-image balanced grouped pool as before (`Irish_grouped_train/val/test.csv`),
trains M1→M2→M3 + soft-vote ensemble, `--epochs 25`, early stop on val macro-F1:

```powershell
python D:\Potato\train_image.py --epochs 25 --batch 32 --img 224 --models m1 m2 m3 `
  --train-csv Irish_grouped_train.csv --val-csv Irish_grouped_val.csv `
  --test-csv Irish_grouped_test.csv --out-dir outputs_irish_grouped --resume
```

Cost ≈ previous full-res run (~a day wall-clock on RTX 3060; decode-bound).
Deliverables: `outputs_irish_grouped/` (best/last/resume.pt, history, curves,
metrics, confusion, val+test proba/logit dumps) + frozen-audit comparison
(random-split weights vs grouped-trained weights on the same grouped test).

**Track B — full 58,709-image run (run second).**
47,590 train images at full resolution ≈ 95–150 min/epoch → 25 epochs is 40–60 h
and is **not** scheduled as-is. Two cost controls, pick one and record it:
  - (B1, recommended) build a 512px mirror of the pool once, then train identical
    hyperparams (est. ~4× faster, ~25–40 min/epoch);
  - (B2) train full-res with early-stop patience 7 and accept a ~2–4-day window.
Command (example B1 paths; out-dir must be new, e.g. `outputs_irish_full`):

```powershell
python D:\Potato\train_image.py --epochs 25 --batch 32 --img 224 --models m1 m2 m3 `
  --train-csv Irish_full_grouped_train.csv --val-csv Irish_full_grouped_val.csv `
  --test-csv Irish_full_grouped_test.csv --out-dir outputs_irish_full --resume
```

Compare A vs B on the same grouped-test slice: if B only lifts same-domain score
without helping external/corrupted sets, A stays the deployed family.

## 3. W3 — non_leaf_v2 acquisition (approved sources only)

Buckets/targets (total ~1,800): soil 200, hands/gloves 150, tools 150,
other crops+leaves 200, empty outdoor 150, blur 150, low-light 150, overexposed 150,
tubers 150, animals/people 150, phone junk+screenshots 150, multi-leaf/bad framing 150,
other hard 100 — into existing `non_leaf_v2/<bucket>/`.

- **Open Images V7** (people, hands, tools, phones, animals, vehicles, food, pots,
  outdoor objects, plants, scenes): fixed ID list, subset download only; record image
  ID, URL, label, split, license, SHA-256, pHash, manual bucket; drop illustrations /
  product photos / irrelevant indoor shots; check licenses individually (annotations
  CC BY 4.0 ≠ image licenses).
- **WE3DS** (RGB only): soil, crops, weeds, field backgrounds; keep scene/sequence
  grouping, never random-split adjacent frames; challenge set, not disease data.
- **PlantDoc**: foreign-leaf open-set ONLY (other species healthy/diseased); never as
  core non-leaf; single source copy (no Kaggle/GitHub-mirror mixing).
- Own phone photos for farm-realistic buckets (tubers, tools, rows, gloves).

Split into `non_leaf_v2_train` (may train the 4th head) and locked
`non_leaf_openset_test` (never trained or threshold-tuned on). Per-image manifest:

```text
dataset_name, dataset_version, source_url, download_date, native_label, mapped_label,
image_id, original_filename, sha256, perceptual_hash, source_split,
manual_review_status, license, included_in_training, included_in_calibration, included_in_final_test
```

## 4. External field validation (by source, native labels kept)

- **Primary: Central Java smartphone set** (Mendeley `ptz377bwb8`, ~3,076 farm
  images; native: healthy/virus/phytophthora/nematode/fungi/bacteria/pest).
  **Forbidden mapping:** fungi→early blight, phytophthora→late blight without expert
  relabeling. Report as field robustness + open-set disease testing.
- **Secondary: Holeta Ethiopia** (`v4w72bsts5`, 363 healthy + 63 late; no early, no
  non-leaf, imbalanced) and **BARI originals only** (`d5b3fzpw3g`, 804 iPhone-15
  images; never the 2,400 augmented version as independent photos).
- **Excluded as external proof:** Zenodo 8286529 (source of current Irish images) and
  any PlantVillage mirror (already used). Usable for completion/reproduction only.
- Per dataset report: target-class hits, Unknown/rejection rate, confidence
  distributions, per-category scores, failure gallery. Same manifest schema as §3
  plus dataset-manifest hash in the experiment record.

## 5. W4 — Calibration (documented, val-locked)

- Entropy is **normalized** `H/log(n)` (`backend/app.py:norm_entropy`); 4-class
  Hmax = log(4), so 0.85 lives on the 0–1 scale (`calibration/thresholds.json`
  records this). Backend loads the gate from that file (`ENT_MAX/PROB_MIN`).
- After each training track: `python scripts/calibrate.py --probas <OUT>/val_probas.npz`
  → per-model temperature T, ECE before/after, Brier; lock T + threshold from VAL,
  evaluate test once (report ECE, reliability diagram, Brier, MSP/entropy/energy,
  OOD AUROC/FPR@95%TPR on open-set). Never refit on test.
- Add an image-quality pre-gate (dark/blurry/bad framing) only if val data shows
  separable failures; leaf-segmentation stage likewise evidence-gated.

## 6. W6 — Ensemble vs single (evidence table, no pre-crowning)

Measured so far (`latency_benchmark.json`, RTX 3060 + CPU ms/image, ckpt size):
M1 1.21M params / 4.85 MB (1.4 ms CUDA, 16.2 ms CPU);
M2 2.23M / 9.14 MB (3.4 ms CUDA, 18.3 ms CPU);
M3 4.01M / 16.33 MB (5.2 ms CUDA, 23.0 ms CPU).
On the OLD Irish test M2/M3/ensemble are identical (1 shared early→late error).
Final deploy choice needs: accuracy, macro-F1, disease recall, rejection quality,
CPU+GPU latency, memory, size, **external-set + corruption** scores. Retain ensemble
as research comparison until it wins outside the same-domain test.

## 7. W7 — Reproducibility record (per experiment)

`experiment_registry.csv` row per run: exp ID, code file + archive hash
(`certutil -hashfile train_image.py SHA256`; repo is not git — no commit hash
exists), dataset version + split-CSV SHAs (`splits_hash_full.json`), seed, hardware,
`python -c "import torch; print(torch.__version__, torch.version.cuda)"`, full
command, best epoch, checkpoint SHA-256, test metrics, date, final/superseded flag.
Same manifest discipline for every external set (§3 schema).

## 8. Execution order

- **Phase 1:** Track A retrain → frozen-vs-grouped audit → T/threshold lock on
  grouped val → formal grouped-test eval (§1 step 5) → registry.
- **Phase 2:** non_leaf_v2 + open-set build (§3) → external sets A/B/C (§4) →
  calibration + rejection report (§5).
- **Phase 3:** Track B full run → PV-only/Irish-only/combined comparison →
  corruption suite → ensemble-vs-single verdict (§6) → quality/segmentation gates
  only on evidence.
- **Not scheduled:** more epochs for their own sake, a larger backbone, or
  accuracy-only tuning; optimise macro-F1, disease recall, false-positive rate,
  calibration, rejection, external-domain score.

## Appendix — artifacts and cleanup (2026-09-25)

Kept: `Irish_full_grouped_{train,val,test}.csv`, `dataset_manifest_full.csv`,
`splits_hash_full.json`, `Irish_grouped_{train,val,test}.csv` +
`Irish_grouped_strict_test.csv` (**remapped to live `_full` paths, 0 missing;
34 `_1` burst crops fall back to base images — see `tracka_remap.json`**),
`scripts/build_full_splits.py`, trainer CSV/out-dir args + val/test logit dumps,
`grouped_split_audit.json` (v1 finding), `leakage_report.json`,
`latency_benchmark.json`, `tracka_remap.json`.
Removed as superseded/broken/stale: `group_signals*.csv`, `grouped_split_audit_v2.json`
(giant-component run), `Irish_grouped_v2_*.csv`, `pool_resolved.csv`,
`review_clusters.csv`, `review_pairs.csv`, `outputs_smoke_full/` (throwaway proof,
rerunnable), `__pycache__/`, temp scratch scripts.
