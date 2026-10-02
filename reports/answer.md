# Answer Bank — PotatoDoc Project Q&A (living document)

> Every question asked in this workspace + its answer, oldest first. Append new Q&A at the
> bottom under `## Future`. File: `D:\Potato\answer.md`. Code/docs referenced live in `D:\Potato`.

---

## Q1 — "Provide a very elaborated and easy to understand summary of the pdf in this folder onto a Summary.md file"
**A:** Created `Summary.md` (§1–11): paper Radwan et al. 2024/25, weather-tabular (4020 rows) early/late blight
prediction, PCA + K-means + copula + bGGO feature selection, 9 models, best MLP+bGGO 98.3%.
Includes big idea, why potatoes/blights matter, traditional vs AI methods, pipeline as cooking
analogy, per-model plain-English roles, results tables with/without selection, limitations,
glossary, metadata.

## Q2 — "Create and train a model far better than this, entire pipeline, ML used, everything in detail"
**A:** Created `Improved_Model_Pipeline.md` + `train_potato_advanced.py` (later deleted after pivot).
Strategy to beat 98.3%: domain indices (Smith/Blitecast/wet-hours/degree-days), temporal lags,
LightGBM/XGBoost/HGB + tuned MLP + RF stacked with logistic meta-learner, Optuna tuning on
F1-macro, SHAP/permutation selection replacing bGGO, calibration + threshold tuning, nested CV.
Target 99.0–99.6% with honest generalization. (Superseded by image pivot — file kept for background.)

## Q3 — "As a 6-credit final-year project: feasibility, compromises, training time, every factor — add to summary"
**A:** Appended `Summary.md §12`. 6 credits ≈ 150–180h/12–14 wks with hour-by-hour budget.
4020-row tabular trains in seconds–minutes on any i5/8GB (table: LR 2–5s … full stack 40–70min).
KEEP (baselines, domain features, 1 booster + Optuna, stacking, SHAP, Streamlit demo) vs DROP
(9 models→4, bGGO→SHAP/permutation, copula, 9-model Wilcoxon, IoT, image fusion, full grid).
Checklist: data/leakage, compute fallback, reproducibility, demo risk, report map, $0 cost.

## Q4 — "We won't use weather; detect late_blight/early_blight/healthy from PlantVillage + Irish, from scratch. Remove the codes"
**A:** Deleted weather code (`train_potato_advanced.py` + `__pycache__`). Project redefined as
3-class leaf-image classification from PlantVillage + Irish imagery; `Improved_Model_Pipeline.md`
flagged obsolete for methods (background only).

## Q5 — "Write all analyses + new-approach pipeline + everything we need to know into analysis.md, now and future"
**A:** Created `analysis.md` (17 sections): objectives/success criteria; PlantVillage (~2152 lab,
256px, healthy minority) vs Irish (58709 field, 20438/17772/20499, Tanzania, Galaxy A03, Zenodo
DOI) datasets + merged A→B→C strategy; problem formulation; EDA checklist; 7 challenges (domain
shift biggest); 10-stage image pipeline; model zoo (small CNN + MobileNetV2 + EfficientNetB0);
training protocol; eval incl. Grad-CAM; hardware/time/cost; 6-credit MVP vs stretch; folder/stack;
risks; §16 Future Log (inventory/experiment/results/viva bank).

## Q6 — "Are all images in IrishPotato and PlantVillage correct or incomplete?"
**A:** Counted on disk: PlantVillage 1000/152/1000 = 2152 → COMPLETE (matches official standard).
IrishPotato37G 5276/5665/3000 = 13941 → INCOMPLETE vs official 58709 (short ~44k, late weakest).
All `.JPG`, sample-verified readable (PV uniform 256px; Irish varied field resolutions).

## Q7 — "Make sure all images that should be there are there; if not install accordingly"
**A:** Verified (50/class PIL check, 0 fails) + mapped gaps (healthy 1–5665 contiguous, late 1–3000,
early 1–7029 with 1753 in-range gaps). Created `download_irish_full.py` (21 Zenodo zips, resumable,
md5-checked). Downloaded + verified `LATEBLT_6.zip` (138 MB) → merged 67 images (Lateblt5001–5068);
late 3000→3067. Logged in `analysis.md §16.1`. Full 37 GB left as opt-in (hours).

## Q8 — "Make it balanced for now, may download all later"
**A:** Balanced WITHOUT full download: downsampled Irish to minority → 3067/class × 3 = 9201.
Wrote `Irish_balanced_index.csv` + train/val/test splits; originals untouched. PlantVillage kept
separate (152 healthy would re-imbalance). Logged in `analysis.md §16.1`.

## Q9 — "Train 80%, test 10%, validate 10%"
**A:** Re-split balanced Irish to 80/10/10 seed 42: train 7360 (2454/2453/2453), val 920,
test 921 (307/class). Overwrote the three CSVs; `analysis.md` updated.

## Q10 — "Create the PotatoDoc Expo mobile app (full spec)"
**A:** Built `mobile/` (18 files): App.js (Paper+SafeArea→HomeScreen), app.json (PotatoDoc,
portrait, splash #2E7D32, camera/library permissions, EAS 6e279551…), package.json
(expo ~57, RN 0.86.0, paper ^5.12.3, image-picker ~57.0.2, file-system ^57, async-storage 2.2.0),
babel.config.js, `.env.example`, `assets/icon.png` (leaf probe), screens/HomeScreen (warmup
GET /ping ×3 + icon probe, permissions, model menu incl. Ensemble, 72px camera/gallery pickers,
auto-predict 30s native upload, heatmap phase, Next/Save), components
(Header/ModelPicker/ImagePickerSection/LoadingIndicator/PredictionResult/HistoryModal),
hooks (useApi: axios GET + File.upload MULTIPART POST, convnext fallback; useHistory max 20),
constants (colors, diseaseInfo). Backend contract pinned (class strings exact).

## Q11 — "Create the M1/M2/M3 (EfficientNetB0) + Ensemble model, stable, trustworthy"
**A:** Wrote `train_image.py` (Irish 80/10/10: seed 42, class-weighted CE + label smoothing 0.1,
AdamW, ReduceLROnPlateau, early stop val-F1 patience 7, train-only augmentation, best+last
checkpoints, metrics/confusion/curves) + `backend/app.py` (GET /ping→alive, /models→ensemble+3,
POST /predict success/unknown via entropy rule, POST /gradcam single/ensemble overlays, 10MB
limit, `convnext_plantvillage` alias) + `requirements.txt`. Smoke test passed (90-img: ens .9667);
fixed Grad-CAM hook; mobile fallback extended to the 4 IDs.

## Q12 — "Is the model ready to be trained?"
**A:** Yes — files + splits + RTX 3060 CUDA verified. Smoke weights are throwaway; full run:
`pip install -r requirements.txt` then `python train_image.py --epochs 25 --batch 32` (~40–90 min),
serve via `uvicorn backend.app:app --host 0.0.0.0 --port 8000`. OOM → `--batch 16`.

## Q13 — "Are all models trained in a single program or separate?"
**A:** Single program: `train_image.py` trains M1→M2→M3 sequentially then evaluates the (untrained)
soft-vote ensemble; one command does all. Subsets possible: `--models m1` / `m2 m3`.

## Q14 — "Train on PlantVillage stably (no under/overfit); explain every line in explanation.md"
**A:** Built PV 80/10/10 splits (1721/215/216; healthy 121/15/16) + `train_image_pv.py` (patience 8,
train/val acc logging, 3-panel curves) and ran FULL training on RTX 3060: M1 24ep best-16
F1 .9758 → test .9907; M2 11ep best-3 → 1.0; M3 12ep best-4 → 1.0; ensemble 1.0.
Wrote `explanation.md` (15 steps, each block: what lines do + observed values).

## Q15 — "What are train_image_pv.py vs train_image.py? Difference?"
**A:** Same 4-model design; different DATA + tuning: PV reads PlantVillage CSVs → `outputs_pv/`,
healthy weight 14.22, 30ep/patience 8, acc logging; Irish reads balanced CSVs → `outputs_image/`,
weights ~3.0, 25ep/patience 7. PV = lab baseline; Irish = field robustness. Backend `OUT`
selects which is served.

## Q16 — "Create the training report. Is small_CNN supposed to be CNN — difference? What is soft-vote ensemble, why differ?"
**A:** Wrote `report.md` (setup, results table, confusion, stability, limitations, reproduction).
small_CNN IS a CNN: CNN = family; M1/M2/M3 are all CNNs; M1 is your custom from-scratch member,
M2/M3 are published pretrained members. Soft vote = mean of probability vectors → argmax (uses
confidence strengths, not just majority labels). They differ in capacity (2M/3.5M/5M), knowledge
(potato-only vs ImageNet priors), structure (plain blocks vs inverted residuals vs MBConv) so
errors cancel when averaged.

## Q17 — "CNN is mine — why only small_cnn, why not full CNN?"
**A:** `small_cnn` IS your full CNN — "small" = body size (~2M params, 4 blocks), not completeness:
trained end-to-end on all 1721 images, nothing frozen. Small was deliberate anti-overfit medicine
for 152 healthy images; a 50M-param custom net would memorize them (train 100%, val collapse).
Offered: rename to `my_cnn` (cosmetic) or scale up to demo the overfit for thesis evidence.

## Q18 — "What result did training gain? What does code learn/implement? How does it detect? Factors?"
**A:** Result = tuned weight files + test proof (M1 99.07%, M2/M3/ens 100% on 216 lab test).
Learns hierarchical detectors (edges→textures→spot shapes→verdict), never hand rules; M2/M3 reuse
ImageNet low-level priors. Inference = resize/normalize → forward → softmax → ensemble mean →
argmax + entropy Unknown gate + Grad-CAM evidence. Factors: visual (ring shape, halo, gloss rot,
uniform green) + training (augmentation, 14.22× healthy weight, smoothing, dropout, early stop).

## Q19 — "On what basis does the model detect late/early/healthy — what does it see specifically?"
**A:** Early = concentric target rings + yellow halo + dry papery texture + older-leaf pattern
(typical `[0.97, 0.02, 0.01]`). Late = water-soaked irregular blotches, no rings, glossy rot,
occasional white mold, large fast lesions (`[0.02, 0.95, 0.03]`). Healthy = uniform green, intact
veins, absence of ring/blotch firing (`[0.01, 0.01, 0.98]`). Flat outputs (max<55%/entropy>0.85)
→ Unknown. Caveat: lab background is a hidden cue — Irish field validation still required.

## Q20 — "Train it onto 16 epochs, no compromise (PlantVillage)"
**A:** Ran `train_image_pv.py --epochs 16 --models m1 m2 m3` to completion (RTX 3060).
M1 ran all 16/16, best = ep16 (val F1 0.9758, va_acc 0.9907) — final weights ARE the 16-epoch
weights. M2 stopped ep14 (best 6, F1 1.0); M3 stopped ep12 (best 4, F1 1.0). Test (216):
M1 acc 0.9907/F1 .9849/MCC .9838; M2/M3/ensemble 1.0000. Plots + metrics.json regenerated.

## Q21 — "How long for Irish training? How many epochs compulsory/best?"
**A:** No compulsory epoch count — best = val-macro-F1 peak via early stopping (PV: M1 ep16,
M2 ep6, M3 ep4). For Irish use `--epochs 25`, expect M1 best ~12–20, M2/M3 ~4–10 (minimum
sensible: 15 for M1, 10 for transfer). TIME WARNING (measured): 1 Irish epoch with
num_workers=0 did NOT finish in 15 min — bottleneck is CPU decode/resize of 4000px field photos
(PV 256px imgs train ~40s/epoch; Irish needs pre-resize). Fix before full run: build 512px mirror
of the 9201 balanced set once (~20–40 min w/ threads), then ~2–4 min/epoch → full run ≈1.5–2.5h
on RTX 3060. Proposed next step, not yet executed.

## Q22 — "Power cut mid-training: restart or resume?"
**A:** Old behavior: full restart (nothing reloadable). New: per-epoch `resume.pt`
(weights + optimizer + scheduler + epoch + best + `n_classes` + history) in each model folder;
re-run the SAME command with `--resume` to continue, losing at most the in-progress epoch.
Caveats: RNG stream restarts (equivalent, not bit-identical), patience window resets, and a
class-count guard ignores stale checkpoints from a different head size (a real 3-vs-4-class
crash caused this guard). `best.pt` always survives as fallback. Detached runs: check
`outputs_image/train.log` before launching (never two copies); a live process needs no action.

## Q23 — "Model must discard foreign objects/persons; 4th head on Irish too; does the app hold both models?"
**A:** Done: 600 COCO person (no-plant) negatives → 4th `non_leaf` class in BOTH PV splits
(2201/275/276) and Irish splits (7840/980/981); both trainers generalized to N classes;
PV 4-class retrained 16 epochs (M1 .9855 + non-leaf 59/60; M2/M3/ens 1.0, 60/60); backend maps
Non-Leaf → mobile Unknown card (app untouched) + entropy rule kept; `green_ratio` logged but not
a hard reject (necrotic leaves score 0.000 = persons, measured). No — the app holds one backend /
one weights folder at a time (`POTATO_WEIGHTS_DIR` switches PV lab vs Irish field); Irish 4-class
is the deployed model, PV the thesis baseline. Full detail: `README.md`; step log:
`explanation.md §16`. Irish 25-epoch full-res run launched detached with `--resume`.

## Q24 — "Show training in a visible window so I know when to shut the device"
**A:** Background run stopped at M3 ep9 checkpoint; relaunched visibly (`--models m3 --resume`),
then moved into-session per preference (cancels cost ≤1 epoch by design). Added `--eval-only`
for the final metrics step. Safe shutdown = only after eval-only prints `Done`.

## Q25 — "After full training: test + validate both models on both datasets; PV_report + IR_report"
**A:** M3 ran all 25/25 (best ep5 F1 .9992); `--eval-only` trio: Irish M1 .9633/.9604/.9480
(36 errs, early↔late/healthy), M2/M3/ens .9990/.9992/.9986 (1 miss in 981). Cross-domain
(`cross_domain.json`): PV→Irish ens 0.3721, Irish→PV ens 0.4783 — symmetric collapse proving
lab⇄field gap; deploy the matching (Irish) family. Wrote `PV_report.md` (lab: M1 .9855,
M2/M3/ens 1.0 on 276) and `IR_report.md` (above + deploy/repro) with training, testing,
validation, stability, files.

## Q26 — "Any underfitting or overfitting scenarios in these models?"
**A:** Classic neither, proven by numbers. OVERFIT check (train−val loss gap at end): Irish M1
+0.006 (0.6162/0.6098), M2 +0.003, M3 +0.0007; PV M1 val acc (0.971) EXCEEDS train (0.928) —
strong augmentation signature, opposite of memorization. Val-loss drift from min ≤0.02 everywhere;
early stops + best.pt + dropout + decay + augmentation did their job. UNDERFIT check: all train
accs high by ep3–5 (0.93–1.0) — nothing stuck low. The ONE overfit-like phenomenon is
domain-level, not train/val: background shortcut learning — PV→Irish ens 0.37, Irish→PV ens 0.48.
Same-domain val never caught it because val shares the background; only cross-domain testing
exposed it. M1 shows it most (PV .9855→.3904). Thesis framing: report as shortcut-learning
limitation + deploy matching-domain family; it is not classic overfitting and more epochs would
not fix it — only diverse training data does.

## Q27 — "Explain the output images (plots): what are the numbers, how obtained and plotted?"
**A:** Two image types are generated per family (`outputs_pv/` + `outputs_image/`).

**1. `confusion.png` (one per family — the ENSEMBLE's test report card).**
What it is: a 4×4 grid. Rows = TRUE label, columns = MODEL's prediction, order Early Blight /
Late Blight / Healthy / Non-Leaf. Cell (row, col) = number of test photos with that truth/prediction
pair. Diagonal = correct; anything off-diagonal = a named mistake.
How the numbers are obtained: after training, each test photo (Irish 981, PV 276 — never seen in
training) goes once through M1+M2+M3; the 3 probability vectors are averaged (soft vote); argmax =
final label; sklearn `confusion_matrix` tallies truth vs prediction. Example — Irish M1
`[[290,3,14,0],[8,294,5,0],[0,0,305,2],[1,2,1,56]]`: row 1 = 307 true-early leaves → 290 right,
3 called late, 14 called healthy (dew-covered early spots mimic healthy green); row 4 = 60 persons
→ 56 rejected, 4 leaked (1→early, 2→late, 1→healthy). Irish ensemble is nearly clean
`[[306,1,0,0],[0,307,0,0],[0,0,307,0],[0,0,0,60]]` — a single early→late error in 981.
How plotted: matplotlib `imshow` (color intensity = count) + the count written into each cell +
axis ticks relabeled with class names (rotated 15°) + title "Confusion — ensemble (test)".
Reading rule: tall bright diagonal + dark off-diagonal = good; a bright off-diagonal cell names
your model's confused pair (here: early↔late blight — the known hard boundary).

**2. `curves.png` (one per model: `small_cnn/`, `mobilenetv2/`, `efficientnetb0/`).**
Source numbers: `history.json`, appended once per epoch during training — train loss/acc measured
INSIDE the epoch over augmented batches, val loss/F1/acc measured AFTER it on clean val data.
PV version has 3 panels, Irish 2 (no train-acc logged): (a) LOSS train-vs-val — mean weighted
cross-entropy (weights: healthy 18.19 PV / non_leaf 16.33 Irish; targets smoothed 0.9). Falling
together = learning; val climbing while train falls = overfitting (never happened: end gaps
≤0.02; PV val acc even exceeds train acc — augmentation signature). (b) ACC (PV only) train-vs-val
fraction correct — both low and flat = underfitting (never happened; all ≥0.93 by ep3–5).
(c) VAL macro-F1 (equal weight per class, so tiny healthy counts) — the early-stopping signal;
`best.pt` = its peak epoch (Irish M3 ep5, PV M1 ep14, M2 ep4/6). X-axis is always epochs 1..N;
how plotted: plain matplotlib line plots with legends + diagnostic titles.
In short: confusion.png = FINAL exam scoreboard (counts of tests passed/failed per class);
curves.png = TERM diary (how learning progressed and exactly where stopping was decided).

## Future — append new Q&A below (newest last)

## Q28 — "Supervisor listed 7 weaknesses (random split inflation, small test, narrow non-leaf, uncalibrated Unknown, background shortcuts, useless ensemble, reproducibility). How do we mitigate each? What future upgrades will we do?"

**A:** Supervisor is right on all 7. Short version: training code is good, same-dataset
99.90% is real but NOT field-guaranteed; the fix is evaluation + data diversity, not more
epochs or a bigger CNN. Full mitigation plan below, then the enlisted Future Work list,
then the thesis-safe wording to use.

**Agreed thesis wording (use this everywhere instead of bare "99.9% accurate"):**

> The proposed Irish-domain transfer-learning models achieved 99.90% accuracy and 99.92%
> macro-F1 on a stratified held-out test subset (n=981) from the same dataset. Wilson 95%
> CI is 99.43–99.98% (one error = 0.10pp), so the point estimate has wide upper-tail
> uncertainty. Cross-domain evaluation revealed substantial degradation: Irish-trained
> ensemble 47.83% on PlantVillage (n=276) and PlantVillage-trained ensemble 37.21% on
> Irish (n=981) — see `cross_domain.json`. Within-dataset accuracy alone therefore does
> not establish field generalization; the main remaining challenge is domain shift from
> background, lighting, camera and acquisition differences.

### W1 — Random split may inflate the Irish score (BIGGEST issue — agreed)

**Concern:** `Irish_balanced_train/_val/_test.csv` are stratified random splits (seed 42,
80/10/10). Filenames prove the risk: `Lateblt2362_1.jpg`, sequential `healthy2691.jpg` /
`Earlyblt2099.JPG` / `Earlyblt2090.JPG` numbering strongly suggests bursts from the same
plant / session / sequence. Near-duplicates can land on both sides of the split, so the
model may recognise a capture session, not disease.
**Mitigation:**
1. Build a GROUPED split: derive a group key per image, then `GroupShuffleSplit` /
   `StratifiedGroupKFold` so a whole group lives in exactly one of train/val/test.
   Practical keys in order of preference: (a) plant/field/session metadata if the
   Zenodo release (`download_irish_full.py` source) has it; else (b) filename-prefix
   group (`Lateblt2362` + `Lateblt2362_1` = one group; `Earlyblt2xxx` numeric bands as
   proxy sessions); else (c) perceptual-hash / embedding near-duplicate clusters
   (pHash Hamming ≤ threshold = same group). Keep current random CSVs as
   `split_random_v1` for comparison and add `split_grouped_v1` alongside.
2. Report BOTH: random-split score (upper bound, comparability) and grouped-split score
   (trustworthy lower bound). Expect the grouped number to drop — that drop IS the result.
3. If group labels are recoverable, do grouped K-fold cross-validation (3–5 folds), not a
   single split.
**Future upgrade (P0-1):** `scripts/make_grouped_split.py` + re-eval `--eval-only` of
frozen `outputs_image/*/best.pt` on the grouped test WITHOUT retraining (pure leakage
audit), then one retrain-from-scratch on grouped-train only. File under
`Irish_grouped_train/_val/_test.csv`.

### W2 — Test set too small for a strong claim (agreed)

**Concern:** n=981 total (307/307/307/60). One error = 0.1019pp, Wilson 95% CI for
980/981 = [99.43%, 99.98%]. Non-leaf n=60 cannot characterise rejection. Quoting
"Accuracy = 99.90%" with no uncertainty overclaims.
**Mitigation:** never quote the point estimate alone again. For the CURRENT frozen test,
report: accuracy 99.90% (95% Wilson CI 99.43–99.98%), macro-F1 99.92%, MCC 99.86%,
per-class precision/recall/F1 + sensitivity/specificity, full confusion matrix
(`[[306,1,0,0],[0,307,0,0],[0,0,307,0],[0,0,0,60]]` — single early→late error, manually
inspected), bootstrap 95% CI (10k resamples), ECE + Brier + reliability diagram,
results over 3–5 seeds as mean±std. State explicitly "within-dataset, same-source".
**Future upgrade (P0-2):** external field test set (see W5) that is never trained on,
never threshold-tuned on; plus a held-out open-set rejection set (see W3).

### W3 — Non-leaf class too narrow (agreed)

**Concern:** 600 COCO person images teach "reject people", not "reject field junk".
At risk: soil, sky, crop rows, tools, plastic, gloves/hands, tubers, blur, empty
background, other leaves/crops, multi-leaf, screenshots, indoor objects, over/underexposed.
`IR_report.md` M1 already leaks 4/60 persons → disease; M2/M3 60/60 on persons proves
nothing about soil.
**Mitigation:** build a diverse negative set, minimum buckets: soil/ground, hands+gloves,
farm tools, other crops, other leaves, empty background, motion-blur, low-light,
overexposed, tubers, animals+people, random phone-camera indoor/outdoor. Keep a
SEPARATE open-set eval split never seen in training or threshold selection. Two-stage
option for thesis discussion: leaf-detector/segmenter first (rejects non-leaf by
localisation), disease classifier second — cleaner than one 4-way head.
**Future upgrade (P0-3):** `non_leaf_v2/` (≥1500–2000 imgs, bucket-balanced) + `*_openset.csv`;
retrain 4-class head; report closed-set non-leaf recall AND open-set rejection rate at
the frozen validation threshold.

### W4 — Confidence / Unknown gate uncalibrated (agreed)

**Concern:** backend entropy rule (`entropy > 0.85` or `max < 0.55` → Unknown,
`backend/app.py`) is a sensible heuristic, not a calibrated uncertainty estimator.
Models can be confidently wrong; low-entropy on OOD; correct-but-overconfident.
`README.md` already proved a hard green gate is invalid (necrotic leaves green≈0.000 =
persons) — same scepticism must apply to raw entropy.
**Mitigation:** freeze threshold on VAL only, lock, then evaluate once on test.
Report ECE + reliability diagram + Brier + max-softmax + entropy + energy-score
distributions (in- vs out-of-distribution), AUROC/FPR@95%TPR for OOD detection.
Compare temperature scaling (val-fitted single T per model), label smoothing already
0.1 (keep), energy-based rejection, and an image-quality gate (dark/blurry/framing)
before the classifier. Manually review every test error with Grad-CAM
(`POST /gradcam` already serves single + ensemble overlays).
**Future upgrade (P0-4):** `calibration.json` per model (T, ECE-before/after, threshold,
val-source) + reliability plots; no test-set threshold peeking.

### W5 — Background shortcut learning (agreed — correct diagnosis)

**Concern:** PV lab (uniform grey, 256px) vs Irish field (soil/hands/shadows/mixed
light, full-res) differ in environment, not just leaves. Symmetric collapse
(`cross_domain.json`: PV→Irish ens 37.21%, Irish→PV ens 47.83%; M1 PV .9855→.3904)
is dataset shortcut / domain overfitting, NOT classic train/val overfit (Q26 already
showed train−val gaps ≤0.02 — clean). Same-domain val can never catch it.
**Mitigation:** domain-generalisation training: randomised/background-replaced crops,
stronger RandomResizedCrop + CutMix/MixUp + RandomErasing (already partial in
`train_image.py`/`train_image_pv.py`), colour/illumination/white-balance/exposure
jitter, blur + JPEG-compression augmentation, object-centred crop/segmentation.
Then the decisive 3-way experiment: train Irish-only vs PV-only vs combined
PV+Irish (domain-balanced sampling so the bigger domain does not dominate),
leave-one-source-out eval, and test ALL THREE on a truly external field set
(different field + different phone + different lighting/severity/growth-stage/background).
**Future upgrade (P0-5):** collect external field set (target ≥500–1000 leaf imgs +
≥200 negatives, protocol-recorded); combined-training run; robustness suite
(blur/brightness/rotation/compression/occlusion) with per-corruption accuracy curves.

### W6 — Ensemble shows no measurable benefit on Irish test (agreed)

**Concern:** M2 99.90% / M3 99.90% / Ens 99.90%, identical single early→late error —
zero gain for 2–3× storage/latency/memory/complexity (`outputs_image`: M2 ~8.7MB,
M3 ~15.6MB scale + M1 4.6MB). Retaining it as default-serve is unjustified on current
evidence.
**Mitigation:** quantify before deploying: error overlap / disagreement rate /
per-image prediction dump across M1/M2/M3/Ens on Irish test, PV test, cross-domain
sets and (later) external + corrupted sets; measure phone/backend latency + peak RAM
per model. Decision rule: deploy best single (likely MobileNetV2 — smallest transfer
model at this accuracy) and keep ensemble as research comparison unless it wins on
external/corrupted data or shows uncorrelated errors.
**Future upgrade (P1):** `ensemble_audit.json` (agreements, overlaps, latency, sizes)
+ deploy-flag recommendation in `IR_report.md §4`.

### W7 — Reproducibility inconsistency (agreed — multiple runs mixed)

**Concern:** `report.md` (M1 best ep16 / M2 ep3 / M3 ep4, 30-ep regime), `answer.md`
Q14/Q20 (M1 best-16, M2 best-3/6, M3 best-4 variants) vs `PV_report.md` (M1 ep14,
M2 ep12-stop/best-ep4, M3 ep10-stop/best-ep2, 16-epoch locked run) describe DIFFERENT
runs without IDs — a viva examiner will spot this.
**Mitigation:** single registry from now on. Every final experiment gets: experiment ID,
git/code hash, dataset version, exact CSV split files + hashes, seed, hardware,
PyTorch/CUDA versions, hyperparams, best epoch, checkpoint SHA256, test metrics,
training date, final-vs-superseded flag.
**Future upgrade (P1, immediate):** commit `experiment_registry.csv` (or .json) and
annotate `report.md` as superseded-3-class-pilot vs `PV_report.md`/`IR_report.md` as
final-4-class; log `train.log` + `history.json` + `config.json` hashes per run.

### Enlisted Future Work (what we WILL do, in order)

**P0 — thesis-blocking (do before claiming field performance):**
1. P0-1 Grouped/source-aware split + leakage audit (W1).
2. P0-2 External field test set, protocol-recorded, never trained/tuned on (W2+W5).
3. P0-3 Diverse `non_leaf_v2/` + open-set eval (W3).
4. P0-4 Calibration package: ECE/Brier/reliability + temperature scaling + val-frozen
   threshold (W4).
5. P0-5 Combined PV+Irish balanced training + leave-one-source-out + corruption
   robustness + Grad-CAM error review (W5).
**P1 — expected in final thesis:**
6. Multi-seed runs (3–5) with mean±std + bootstrap CIs everywhere (W2).
7. Ensemble audit + latency/memory + single-model deploy decision (W6).
8. `experiment_registry.csv` + reconcile all epoch/report inconsistencies (W7).
9. Leaf segmentation/detection pre-stage prototype + image-quality gate (W3/W4).
**Explicitly NOT doing yet (supervisor-agreed):** more epochs, a much larger backbone,
or accuracy-only optimisation — false diagnosis is worse than "Uncertain — please
retake the image", so optimise macro-F1, disease recall, false-positive rate,
calibration, rejection quality and external-domain accuracy instead.

## Q29 — "Proceed the mitigating points (execute, not just plan)"
**A:** All 7 mitigations started; code + data artifacts committed (no retraining yet —
frozen weights untouched). Verified with `py_compile` (exit 0).
1. **W1 grouped split — DONE (audit + files):** proxy-session key = filename prefix +
   number//100 band (coco: one group/file). OLD random split: 143/204 test groups
   (70%) also in train → leakage confirmed. NEW `Irish_grouped_train/val/test.csv`
   (7858/981/962, 749 groups, seed 42, zero train/test group overlap) + audit in
   `grouped_split_audit.json`. NEXT: `--eval-only` frozen `best.pt` on grouped test
   (pure audit), then one grouped-train retrain.
2. **W2 uncertainty — DONE:** `uncertainty_supplement.json` — M2/M3/Ens acc 0.99898,
   Wilson95 [0.99425, 0.99982], bootstrap95 [0.99694, 1.0], one error = 0.1019pp;
   M1 acc 0.9633 Wilson95 [0.94961, 0.97338]; per-class precision/recall + Wilson CIs
   included. ECE/Brier/reliability pending proba dumps (see 4).
3. **W3 negatives — SCAFFOLDED:** `non_leaf_v2/` with 14 buckets (soil, hands/gloves,
   tools, other crops/leaves, empty, blur, low-light, overexposed, tubers,
   animals/people, phone random, multi-leaf, screenshots) + `COLLECT_PROTOCOL.md` +
   `manifest.csv` + locked `non_leaf_openset.csv` template (never train/tune on it).
   NEXT: collect ≥1500–2000 phone photos, then retrain 4th head.
4. **W4 calibration — SCAFFOLDED + WIRED:** `calibration/thresholds.json`
   (entropy 0.85 / prob 0.55, val-frozen contract) now LOADED by `backend/app.py`
   (`ENT_MAX/PROB_MIN`, no more hardcode); `scripts/calibrate.py` fits temperature T
   + ECE/Brier on VAL logits only; both trainers now dump `test_probas.npz` on every
   future eval. NEXT: run val-proba dump → fit T → lock new thresholds.
5. **W5 background shortcuts — TRAINER UPGRADE DONE:** `make_tfms` in
   `train_image.py` + `train_image_pv.py` strengthened: crop scale 0.8→0.7, rotation
   ±20→±30°, jitter 0.2→0.4+0.1 hue, blur σ≤1.0→2.0, +RandomAdjustSharpness/+
   RandomAutocontrast, erasing 0.25→0.35. MixUp/CutMix + background replacement
   flagged as next batch-level upgrade. NEXT: combined PV+Irish balanced run +
   external field set + corruption suite.
6. **W6 ensemble — AUDITED:** `ensemble_audit.json` — M2/M3/Ens confusions byte-identical
   (disagreement 0, 1 shared early→late error; M1 36 errors) → no measurable Irish-test
   gain. Recommendation locked: deploy MobileNetV2 single, ensemble research-only.
   NEXT: latency/RAM measure + external/corrupted disagreement test.
 7. **W7 reproducibility — DONE:** `experiment_registry.csv` (6 rows: PV pilot
   SUPERSEDED vs PV-4cls FINAL vs IR-4cls FINAL vs xdomain vs grouped-audit vs
   uncertainty) reconciling the `report.md`/`PV_report.md` epoch mismatch.
   NEXT: log checkpoint SHAs + torch/CUDA versions per future run.

## Q30 — "Were the supervisor's corrections/refinements applied?"
**A:** Honestly: only partially. Status per refinement (verified against files):
1. **Don't rely on filename grouping alone — PARTIAL.** Only the filename proxy exists
   (`grouped_split_audit.json`: prefix + number//100 bands; coco = one group/file).
   NOT done: Zenodo metadata / archive structure / session / timestamps / folder
   hierarchy / dimension-compression signals, pHash + embedding near-duplicate
   detection, manual cluster review. Relabeled just now as "source-aware PROXY
   grouping — NOT a guaranteed plant-level split". Real plant-level grouping is pending.
2. **Frozen-audit sequence — PARTIAL, but worded correctly.** Done: grouped partitions
   (step 2) + old-split overlap audit 143/204 (leakage signal). NOT run: frozen-weights
   eval on grouped test (step 1), grouped-only retrain (step 3), grouped-val threshold
   tuning (step 4), formal grouped-test eval (step 5). Q29 never calls the frozen audit
   final — it lists it as NEXT pure audit. Only step 5 may be presented as the formal
   grouped result.
3. **Entropy form — CODE correct, DOC fixed just now.** `backend/app.py:norm_entropy`
   is normalized (H / log(n)); 4-class Hmax = log(4), so 0.85 is on the 0–1 scale.
   This was previously unrecorded; `calibration/thresholds.json` now states
   `entropy_type` + Hmax note explicitly.
4. **External set by source, not count — NOT APPLIED.** Only the 500–1000 count target
   exists; no multi-farm/phone/lighting/cultivar/stage/severity/distance/background
   matrix and no images collected. `non_leaf_v2/COLLECT_PROTOCOL.md` covers negatives
   only. A smaller genuinely multi-source set beats 1000 single-farm images — pending.
5. **Ensemble: don't pre-crown MobileNetV2 — CORRECTED just now.** Audit (identical
   M2/M3/Ens confusions, disagreement 0) stands, but the "deploy MobileNetV2" line in
   `ensemble_audit.json` was size-based, not evidence-based. Now TBD on measured
   accuracy / macro-F1 / disease recall / rejection / CPU+GPU latency / memory / size /
   external-set score.
**Execution order:** Phase 1 part-done (registry + proxy splits + overlap audit; metadata
probe, frozen eval, grouped retrain pending). Phase 2 scaffold-only (buckets + openset
template; no images, no val-refit threshold, no calibration eval). Phase 3 part-done
(augmentation upgrade in both trainers; combined-domain runs, corruption suite,
external ensemble-vs-single, segmentation gate pending).

## Q31 — "Full dataset ready: continue, train Irish on new data, follow dataset plan, write report_2.md"
**A:** Preparation done, documented in `report_2.md` (forward plan, commands, acceptance
criteria). Verified: 58,709 leaf images readable (17772/20438/20499) + 600 coco.
Built: `Irish_full_grouped_train/val/test.csv` (47590/5859/5860, 1,188 proxy groups,
zero overlap) + `dataset_manifest_full.csv` + `splits_hash_full.json`.
Trainer now takes `--train-csv/--val-csv/--test-csv/--out-dir` (W7 isolation) and dumps
VAL logits + TEST probas/logits (W4; `scripts/calibrate.py` fixed to match).
Smoke test on new splits passed (`outputs_smoke_full`, throwaway).
Training itself (Track A grouped ~a day, Track B full 40–60 h full-res or ~4× less via
512px mirror) is NOT launched in-session — exact commands in `report_2.md §2`; launch
when the machine can be dedicated, with `--resume`. External/non-leaf acquisition
(Open Images subset, WE3DS RGB, PlantDoc foreign-leaf only, Central Java primary,
Ethiopia/BARI-secondary originals, Zenodo-8286529 excluded) is specified step-by-step
in `report_2.md §3–§4` with manifest schema; nothing downloaded yet.

## Q32 — "Remove unwanted files; enlist ALL remaining work"
**A:** Cleanup done: deleted `group_signals*.csv`, `grouped_split_audit_v2.json`
(giant-component run), `Irish_grouped_v2_*.csv`, `pool_resolved.csv`,
`review_clusters.csv`, `review_pairs.csv`, `outputs_smoke_full/`, `__pycache__/`,
temp scratch. Remapped Track-A splits (+ strict test) to live `_full` paths:
0 missing, 34 `_1` crops fall back to base images (`tracka_remap.json`).
Full remaining todo (Phase order, cf. `report_2.md §8`):
Phase 1 — A1 launch Track A retrain (`outputs_irish_grouped`, ~day, `--resume`);
A2 frozen-vs-grouped audit on grouped test; A3 fit T + Unknown threshold on grouped
val only; A4 formal grouped-test eval + Wilson/bootstrap/ECE/Brier/reliability +
Grad-CAM error review; A5 registry + IR_report update with real numbers.
Phase 2 — B1 acquire non_leaf_v2 per source (Open Images ID-list + license check,
WE3DS RGB scene-grouped, PlantDoc foreign-leaf only, own phone photos) with manifests
+ manual review; B2 lock open-set test; B3 download + manifest external sets
(Central Java primary native labels, Ethiopia + BARI-originals secondary; 8286529 and
PV mirrors excluded); B4 calibration + rejection report with OOD metrics + failure
gallery.
Phase 3 — C1 Track B full run (512px-mirror decision first); C2 combined PV+Irish
balanced training + leave-one-source-out; C3 corruption robustness suite; C4
evidence-based ensemble-vs-single verdict + deploy + latency/RAM on target;
C5 quality/segmentation gates only on evidence. Ongoing W7: hashes, checkpoint SHAs,
env records per run; thesis wording uses grouped + external numbers, never bare 99.9%.

## Q33 — "Train the Irish model on the new dataset + follow all remaining phases"
**A:** Track A launched 2026-09-25 ~20:05 (PID 18740, detached, `--resume` safe,
`outputs_irish_grouped/`). First attempt crashed on corrupt `earlyblt838.jpg`;
`scripts/clean_splits.py` dropped 3 unreadable files from 69k, refreshed
`splits_hash_full.json`, second launch healthy: M1 done, M2 ep16 valF1 ~0.993,
M3 queued, then ensemble eval + val/test logit dumps. Registry row RUNNING.
Scaffolded without touching GPU work: `scripts/monitor_train.py` (safe status
checks), `scripts/fetch_openimages.py` + `openimages_ids_TEMPLATE.csv` (fixed-ID
subset downloads with manifest fields), `external_manifest_TEMPLATE.csv`.
Monitor: `python scripts/monitor_train.py` or tail `outputs_irish_grouped/train.log`.
After power cut: re-run the identical launch command with `--resume` (loses ≤1 epoch).
When M3 + eval finish: A2 frozen-vs-grouped audit → A3 val-locked T/threshold →
A4 formal grouped-test eval → A5 registry/IR_report. Phase 2 downloads + manual
review and Track B (40–60 h full-res or 512px mirror) remain user-scheduled.

## Q34 — "Live window 2 + remaining Phase 1 tasks"
**A:** Window 2 (23:12–23:42) caught M3 ep14→ep23 + early stop (best ep16 F1 .9966)
and the full eval. **Track A grouped-test (n=962): M1 .9678 / M2 .9854 / M3 .9896 /
Ens .9865** (M3 Wilson95 [.9810, .9943], F1 .9914, MCC .9852). M3 alone beats the
ensemble — first real W6 evidence for single-model deploy (external tests pending).
A2: frozen random-split weights → .39–.40 on grouped test (all models) vs .9896
grouped-trained — leakage proof beyond the 14% pHash rate. A3: T .30–.35,
ECE .15–.18 → .002–.005, Brier .009–.017 (val-locked). A4: Wilson CIs + test ECE
diagnostic recorded. A5: registry COMPLETED rows + `IR_report.md §7` addendum.
Phase 1 remaining: Grad-CAM review of the ~10–13 grouped-test errors (eval images
live, can run on demand) and the val-fitted Unknown-threshold lock into
`calibration/thresholds.json` (currently heuristic 0.85/0.55). Then Phase 2
(non_leaf_v2 + external acquisition) and Track B.

## Q35 — "Finish the still-open tasks"
**A:** Both done. (1) Error review: 12/962 ensemble errors, ALL early-blight boundary
(8 early→late, 2 late→early, 2 early→healthy); overlays in
`outputs_irish_grouped/gradcam_errors/` + `errors.json`. Attention is lesion-localized
— no background shortcut on errors; modes: ring-less early lesions read as late (most),
dew droplets mimicking water-soaked late blight (err04), sub-visible early signs called
healthy (err09/err11); 9/12 high-entropy so the gate catches most, err06/err09 stay
confident errors. (2) Threshold lock: `outputs_irish_grouped/thresholds.json` —
entropy 0.17 on T-scaled probs (Youden J, val-only; catches 50% of val errors, loses
2.4% correct, coverage 97.3%, selective acc 99.9%). Family-specific file; deployed
`calibration/thresholds.json` (0.85/0.55) untouched until this family ships.
Phase 1 is now fully closed; registry row EXP-CLOSEOUT-001.

## Q36 — "Is Phase 2 all clear? hands_gloves/low_light/blurred buckets are empty — what are the photos for, and what are central_java/BARI used for?"
**A:** No — Phase 2 data is ~60% done. Filled: animals_people 415, soil_ground 320
(WE3DS, md5-verified), other_leaves 195 (PlantDoc), phone_random 149, other_crops 100
(OI v7 subset, 664/800 after Flickr rot) = 1,179 + 600 COCO persons. Empty: hands_gloves,
farm_tools, low_light, blurred, overexposed, tubers, multi_leaf, screenshots_indoor,
empty_background — these need own phone photos (no matching public source; OI Tool class
had zero usable labels). Use of photos: (1) train slice retrains the 4th non_leaf head
→ app Unknown-retake card instead of forced misdiagnosis; (2) locked open-set slice
(590, sha `89f9f6…`) is the unstudied final exam — per-bucket scores show where rejection
breaks (people ~100%, soil 91%, foreign leaves 72%). central_java (3,076 Indonesian farm
photos, 7 native classes, counts matched to paper Table 1) = primary external
generalization test, native labels kept, no fungi→EB forcing (phyto→LB 55% affinity,
bacteria 93% rejected, Java healthy 23% stated weak). BARI (84 originals in this mirror,
not 804; augmented 2,267 excluded) = secondary late-blight/healthy + viral/bacterial
open-set check. Ethiopia (430) = closest-to-target external evidence (H 78%, LB 81%).
All in `EXT_report.md` + registry (EXP-EXT-001, EXP-OPENSET-001).

## Q37 — "I don't have the exact shoot list — what shall I do?"
**A:** Follow `non_leaf_v2/SHOOT_LIST.md` (9 buckets, subject/framing/lighting/counts,
50–100 keepers each, ~15–30 min per bucket, same phone as field use, log device +
lighting in `manifest.csv`). After shooting: copy into bucket folders →
`python scripts/review_pass.py` → skim-delete potato lookalikes → tell me and I re-lock
the open set, re-run rejection eval, update `EXT_report.md`. Alternatives if shooting is
impossible: (a) ship with 5 buckets + COCO and record the 9 gaps as explicit thesis
limitations; (b) web-fill only screenshots_indoor + farm_tools (user-taken still better).
Do not: bulk-scrape farm images (license/provenance risk) or count augmented copies as
field photos.

## Q38 — "This isn't a thesis, it's a project — will it be acceptable?"
**A:** Yes — project grading rewards a working system + honest evaluation, not exhaustive
data. Shippable now: mobile app + backend serving a real model, Unknown-retake handling,
grouped in-domain result (M3 .9896, Wilson95 [.9810, .9943]), frozen-audit leakage proof,
val-locked calibration (ECE → .002–.005), 3,590 external images evaluated with native
labels (Ethiopia H 78% / LB 81%), 1,179 negatives + 590 locked open-set with per-bucket
rejection, full manifests/hashes/registry. That exceeds typical 6-credit project evidence.
The 9 empty buckets and Track B are correctly framed as scoped-out future work, not
failures — examiners penalize hidden gaps, not declared ones. Demo-day priorities:
(1) deployed `outputs_image/` family serves + Unknown card triggers on a person/soil
photo; (2) one slide showing grouped .9896 vs random-split .9990 (leakage honesty);
(3) one slide of external results (Ethiopia 78/81%). Shoot-list photos improve the grade
marginally; a live demo that recovers gracefully with "please retake" improves it more.

## Q39 — "Will Phase 2 be finished with these conclusions?"
**A:** Yes. Phase 2 is now formally closed with declared limitations (`EXT_report.md`
closure section): B1 (1,179 negatives, 5 buckets, manifests), B2 (590 locked open-set,
sha `89f9f6…`), B3 (Java 3,076 + Ethiopia 430 + BARI 84, native labels, evals run),
B4 (this report). The 9 empty buckets + full human review are user-scheduled future work
via `SHOOT_LIST.md`, explicitly out of scope — valid for a project. Remaining active work
is Phase 3 only: Track B (running), combined training, corruption suite, deploy verdict,
evidence-gated quality gates.

## Q40 — "Are all external potato-disease datasets for validation/testing only?"
**A:** Yes — Central Java (3,076), Ethiopia (430), BARI originals (84): evaluation ONLY,
never training, never threshold tuning (manifests record `included_in_training=0`,
`included_in_calibration=0`). That independence is the entire point: a model that never
saw Indonesian/Ethiopian/Bangladeshi farms yet recognizes healthy (Ethiopia 78%) and
late blight (81%) there has demonstrated generalization, not memorization. Training on
them would convert the strongest evidence into just more training data — forbidden. The
only permitted future use is a clearly re-registered experiment (new exp ID, new locked
test slice), never silent mixing.

## Q41 — "Can't the model find early blight on the external sets? It wasn't enlisted."
**A:** It can predict it — but none of the three sets has an early-blight ground-truth
label, so early-blight recall is unmeasurable externally (honest gap, not hidden).
Measured Early Blight *prediction* counts (from `ext_*_results.json` pred_dist):
Java — fungi 46, pest 17, nematode 20, virus 3, bacteria 1, phytophthora 1, healthy 0
(88/3076 = 2.9%); Ethiopia — 1/430; BARI — 0/84. Java fungi likely contains true
Alternaria early-blight cases, but counting them correct without expert relabeling would
violate the no-forcing rule. Two valid readings: (1) the model rarely cries early blight
abroad (2.9% — low EB false-positive rate); (2) external EB sensitivity remains unknown.
Fix options: expert relabel of Java fungi for Alternaria EB (re-registered experiment),
or a future EB-positive field collection. `EXT_report.md` should carry this paragraph.

## Q47 — "M1B branch result"
**A:** Closed 2026-09-27: M1B acc .9942 / F1 .9956 / MCC .9914 on full grouped test
(n=5,860) — custom from-scratch CNN matches transfer models. Non-leaf 1.00 precision /
1.00 recall (was .28 precision): precision collapse FIXED by oversampling + mild weights.
Calibration: ECE .167 → .0037 at normal T .35 (was .45 unfixable): fix PROVEN, no
escalation to Dirichlet/two-stage needed. Stable curve throughout (no swings — the
instability source is gone too). Registry EXP-M1B-DONE; `IR_report.md §10` result.
Deploy family unchanged for now (M3-combined); M1B joins the C4 re-vote as evidence that
the recipe generalizes.

## Q46 — "Calibration future-work explained; M1 underfit explained simply (ELI5)"
**A:** (1) Calibration fix = make confidence scores honest. Softmax says "90% sure" but
is right ~55% of the time on full data (ECE .45). Temperature scaling failed (T stuck at
floor 0.2) because the cause is structural: the 99× non_leaf weight bends every
probability. Fix implemented in `train_image.py`: `--oversample` (show each class
equally instead of 99× weighting) + `--loss focal` (learn hard examples, ignore easy
majority). Will it solve everything? It fixes TRUST (honest confidences, working Unknown
gate) — not accuracy, domain shift, or missing buckets. If ECE stays high after M1B,
next steps are per-class temperature, Dirichlet calibration, or an OOD-first two-stage
system. M1B branch launched 2026-09-27 (m1, full data, drop 0.2, lr 2e-3, focal,
`outputs_m1b_full/`): ep3 already 0.9695 vs old M1 best 0.83 — fix confirmed working.
(2) ELI5: "No classic overfit (gaps ≤0.07)" = the model is NOT memorizing; train and val
errors stay close, like a student equally good at homework and class tests. "M1 capacity
underfit" = the student is a small kid given a university library (47k photos) while
wearing blurry glasses (dropout 0.4 switches off half its brain each round) and being
told one rare topic counts 99× — it copes (~0.8) but can't excel. Fix = bigger kid
(wider net), cleaner glasses (dropout 0.2), fair topic balance (oversample), louder
teacher (lr 2e-3). "M2/M3 swings self-settled" = transfer students panicked at the huge
new school (val scores jumping 0.26↔0.89) until the scheduler (principal) lowered demands
(LR cuts) and they calmed to ~0.91+; best.pt kept only their best day. Proper M1 use:
keep original as from-scratch baseline proof; deploy transfer models; use M1B to show the
fix recipe works.

## Q45 — "Phase 3 complete: overall results, fit causes+fixes, readiness, external/non-leaf roles"
**A:** (1) Overall retraining: Track A (grouped 9k) M3 .9896/Ens .9865; Track B (full 58k)
M3 .9949/Ens .9855; Combined (PV+Irish) M3 .9906 Irish + 1.0000 PV + Ethiopia H 85%/LB
100% + Java phyto→LB 76% + corruption ≥.9833. One family now covers both domains —
cross-domain collapse cured by data, not architecture. (2) Fit: NO classic overfit in any
of 15 runs (train−val gaps ≤0.07; early stops + best.pt + augmentation held). M1 ~0.8 on
58k = capacity underfit (1.2M params, dropout 0.4 over-regularizes, 99× weight) — accept
as baseline result; branch-fix recipe in Q43. M2/M3 val-F1 swings = 99×-weight head
instability, self-settled via scheduler LR cuts; best.pt kept peaks only. (3) Submission
readiness: YES for project — working app + Unknown path, grouped + external + corruption
+ calibration + rejection evidence, manifests/hashes/registry, all limits declared. NOT
yet production: soil→Healthy 59% regression, ECE .27–.34 unfixable by scaling, Java
healthy ~30%, EB recall unknown, 9 negative buckets empty. Submission-ready checklist:
serve M3-combined (copy best.pt + labels.json, point POTATO_WEIGHTS_DIR, keep old dir as
rollback), demo script (leaf→diagnosis, person/soil→Unknown card), slides (grouped vs
random-split honesty, Ethiopia 85/100%, limitations), freeze open-set hash + registry.
(4) External roles: Java (primary field-robustness + open-set disease, native labels,
no forcing) · Ethiopia (closest-to-target proof) · BARI (tiny secondary + viral/bacterial
rejection). All eval-only, independence = the evidence. (5) Non-leaf: COCO persons (600,
~100% rejected everywhere) + v2 1,179 (soil/animals/crops/leaves/phone) with locked 590
open-set — rejection animals/phone ~100%, crops 94–96%, soil 91%→59% under combined
(regression flagged), foreign leaves 64–72% (hardest, 27 leak to disease). Train slice
feeds future 4th-head retrain; locked slice never trains. Full detail: `IR_report.md §9`,
`EXT_report.md`, registry EXP-COMBINED/CORRUPT/EXT-COMBINED/VERDICT-001.

## Q44 — "Track B full-data result"
**A:** Completed 2026-09-26 ~03:04 (25 forced epochs, `outputs_irish_full/`).
Grouped-test n=5,860: M1 .9713 (F1 .8462 — non-leaf precision .28 drags macro) /
M2 .9927 / **M3 .9949** (Wilson95 [.9927, .9964], MCC .9924) / Ens .9855 (F1 .8948 —
M1's Non-Leaf over-calls drag the vote below M3 alone). M2/M3 showed epoch-to-epoch
val-F1 swings early (99× non-leaf weight) that settled after scheduler LR cuts — same
signature as diagnosed live. Calibration warning: val ECE .45–.47, temperature scaling
insufficient (T=0.2 floor, ECE still .27–.34) → probabilities are distorted by the
extreme class weight; fix = oversample minority or focal loss, not more scaling.
Registry EXP-TRACKB-DONE + EXP-CALIB-FULL-001; `IR_report.md §8`. Remaining Phase 3:
C2 combined training, C3 corruption suite, C4 deploy verdict, C5 evidence-gated gates.

## Q43 — "How to manage M1 underfitting on the full set (val-F1 ~0.8)?"
**A:** First, do NOT restart Track B — M1's role is from-scratch baseline, not deployment;
its run continues untouched and any fix is a new branched experiment. Causes: 1.2M params
vs 47.6k diverse full-res images (capacity), dropout 0.4 tuned for the 152-healthy pilot
now over-regularizing, and non_leaf weight ~99× destabilizing (480 vs ~16k/class —
oversampling would beat extreme weighting). Fixes if M1 must compete: (a) widen
channels / +1 block with param count recorded; (b) dropout 0.4→0.2; (c) oversample
non-leaf instead of 99× weight; (d) M1 lr 1e-3→2–3e-3 + warmup; (e) MixUp/CutMix.
Default recommendation: accept + document — small-custom-CNN saturates while transfer
models scale is itself a result; judge after M2/M3 (if they hit ~0.98+, M1 stays
baseline; if they also stall, suspect data/labels, not capacity). Ensemble can drop M1
if it drags the vote — verdict in C4 with numbers.

## Q42 — "Will the model presume all fungal/bacterial diseases are early/late blight?"
**A:** No — and your disease notes are correct (EB: Alternaria solani, warm 24–30°C,
target-board rings, slow; LB: Phytophthora infestans oomycete, cool 10–20°C wet,
water-soaked lesions + white mold, aggressive). But the model knows no taxonomy: it maps
pixels to 4 outputs (EB/LB/Healthy/Non-Leaf). Anything else — and potato has many others,
e.g. fungal: Fusarium dry rot/wilt, Verticillium wilt, Rhizoctonia black scurf, silver
scurf, wart; bacterial: blackleg/soft rot (Pectobacterium/Dickeya), brown rot
(Ralstonia), ring rot (Clavibacter), common scab (Streptomyces) — gets forced into one of
the 4 or rejected. Measured proof it does NOT blanket-presume: Java bacteria → 93%
Non-Leaf (correctly "not my diseases"); Java fungi → LB 44% / EB 6% / Non-Leaf 47%
(Alternaria-like patterns partially match, unscorable without expert labels). So the
deployed model is a two-blight specialist + rejecter, not a general potato pathologist —
report its scope exactly so, and let the Unknown gate + open-set eval carry the rest.