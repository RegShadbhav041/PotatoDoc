# Analysis — Potato Leaf Image Classification (Early Blight vs Late Blight vs Healthy)

**Project:** Bachelor Final-Year Project (6 Credit Hours)
**New approach (NOT weather-tabular):** Image classification from leaf photos
**Classes (3):** `early_blight` | `late_blight` | `healthy`
**Datasets:** PlantVillage potato subset + Irish Potato Imagery Dataset (Zenodo)
**Training:** From the very start (own preprocessing + own CNN training, with transfer-learning option)
**Status:** Living document — Section 1-15 for NOW (planning), Section 16+ for FUTURE (fill as you run experiments)
**Folder:** `D:\Potato` | Old weather code already removed.

> Related files: `Summary.md` (old weather paper summary, Sections 1-11 still useful for background, Section 12 needs updating for images), `Potato_Leaf_Disease_Classification_Using_Optimized.pdf` (background only — methods no longer apply).

---

## 1. What Changed and Why (Old vs New)

| Aspect | OLD (paper, removed) | NEW (this project) |
|--------|----------------------|--------------------|
| Input | Weather numbers: temp, humidity, wind (4020 rows CSV) | Leaf photos (JPG, ~60k images if merged) |
| Output | Predict disease risk from weather | Detect disease from leaf appearance (3 classes) |
| Models | LR, RF, SVM, KNN, MLP + bGGO feature selection | CNNs: small custom CNN + MobileNetV2 / EfficientNetB0 / ResNet18 |
| Data size | <5 MB | ~7–40 GB (Irish alone ~7.2 GB zipped, ~37.5 GB expanded v2) |
| Hardware | Any CPU laptop, seconds-minutes | Needs GPU (Colab Free T4) for practical training, hours |
| Demo | Enter weather numbers -> risk % | Upload leaf photo -> predicted class + confidence + heatmap |
| Code | `train_potato_advanced.py` (DELETED) | New image pipeline (to be built — see §8) |

**Why the switch is good for a bachelor project:** image classification is visual, demo-friendly, more datasets available, more viva-friendly (you can show Grad-CAM "where model looks"), and directly answers farmer need ("is this leaf sick?"). It is also harder computationally — so scope control in §12 is critical.

---

## 2. Objectives and Success Criteria

**Main objective:** Build, train, and evaluate an image classifier that distinguishes healthy vs early blight vs late blight potato leaves, using merged PlantVillage + Irish data, with honest validation and a live demo.

**Measurable success criteria (agree with supervisor NOW):**

1. Baseline custom CNN achieves ≥85% test accuracy on PlantVillage-only split.
2. Transfer-learning model (e.g., MobileNetV2 or EfficientNetB0 fine-tuned) achieves ≥92-96% on merged data with stratified test set.
3. Report includes: confusion matrix, per-class precision/recall/F1, comparison table baseline vs improved, 2-3 Grad-CAM examples, training curves.
4. Live demo: upload image -> prediction in <3 sec on laptop CPU.
5. Honest limitation discussion: lab vs field domain gap, lighting/background sensitivity.

You do NOT need 99%+ or SOTA publication to get distinction. A clean 93% with proper methodology beats a shady 99% with leakage.

---

## 3. Datasets In Detail (Everything You Need To Know)

### 3.1 PlantVillage potato subset (controlled/lab domain)

- **Source:** Mohanty et al. 2016 PlantVillage (54,306 images, 14 crops, 38 classes). Potato subset used widely on Kaggle.
- **Kaggle potato versions:** most common `PlantVillage Potato` = **~2,152 images, 3 classes** (variants report 2,052–2,175 due to versioning). Typical split cited: Early Blight ~1,000, Late Blight ~1,000, Healthy ~152 (imbalanced — healthy minority!). Another 7-class potato variant has 3,500 images (500/class) — do NOT confuse with 3-class version. Verify after download with script in §6.
- **Image properties:** 256×256 RGB, single leaf centered, uniform grey/light background, controlled lighting. Easy to learn, but **unrealistic for field use**.
- **License:** CC BY-SA 3.0 / Kaggle mirrors vary — cite Mohanty et al. + Kaggle link in report.
- **Size:** ~200–300 MB. Downloads in minutes. Ideal for week 1-4 prototyping.
- **Strength:** Clean labels (expert validated), fast training, good for debugging pipeline.
- **Weakness:** Model trained ONLY here collapses in real field (background shift). Must mix with Irish data.

### 3.2 Irish Potato Imagery Dataset (field/real domain)

- **Source:** Mduma, Laizer et al., NM-AIST Tanzania. Papers: Data in Brief / Elsevier 2023-2025. Zenodo DOI: `10.5281/zenodo.8286529` (v01, 2023) and expanded v1 2025 (`records/17553016`).
- **Scale:** **58,709 annotated images after preprocessing** (before: ~59,771). Breakdown after cleaning:
  - Healthy: **20,438**
  - Early blight: **17,772**
  - Late blight: **20,499**
  - Fairly balanced (30-35% each) — excellent.
- **Collection:** 6 months (22 Nov 2022 – 08 Apr 2023, plus Aug 2023 for v2), smallholder farms in Southern Highlands Tanzania (Mbeya, Iringa, Njombe, Songwe). Samsung Galaxy A03 / A03 Core 8MP via ODK tool. Shangi (Obama) variety dominant.
- **Growth stages captured:** mid-late vegetative + early tuber bulking (early blight), flowering + tuber initiation/bulking (late blight) — most susceptible windows, so symptoms are representative.
- **Image properties:** High-res JPEG (phone native, varied resolutions), diverse lighting/angles/backgrounds (soil, hands, multiple leaves, shadows). Filenames like `earlyblt12077.jpg`. GPS metadata + folder labels (`healthy.zip`, `earlyblt.zip`, `lateblt.zip`).
- **Annotation:** Field collection by trained farmers/extension officers + validation by plant pathologists + algorithmic dedup/filtering. More trustworthy than random web scrape.
- **Size warning:** zipped ~7.2 GB (3 zips), expanded much larger; 2025 version lists **37.5 GB across 21 zips** (includes augmented/duplicates?). **Do NOT download full 37 GB on first day.** Start with sample (see §12 compromise).
- **License:** Open on Zenodo (CC-BY variant) for research — cite DOI + funder (IDRC/SIDA AI4AFS). Check Zenodo license tab before publishing thesis PDF.
- **Strength:** Real-world robustness, large enough for deep learning, balanced.
- **Weakness:** Large download/storage, needs cleaning (duplicates, blurry, non-leaf images already partly filtered but re-check), variety bias (Shangi dominant — note as limitation).

### 3.3 Merged dataset strategy (recommended)

| Option | Images | Pros | Cons | Verdict for 6 credits |
|--------|--------|------|------|-----------------------|
| A. PlantVillage only (~2.1k) | 2,152 | Tiny, fast, easy A-B testing | Fails in field, healthy class tiny | Phase 1 only (weeks 1-4) |
| B. Irish subset (6-9k balanced) | 6,000-9,000 (2-3k/class sampled) | Realistic + trainable on Colab Free | Sampling must be stratified + documented | **MVP (weeks 5-10)** |
| C. Full merge (~60k) | ~60,861 | Best generalization, impressive | 40 GB storage, 5-10h training, Colab timeouts | Stretch goal only if time remains |
| D. Irish full (58k) | 58,709 | Best single-source | Same heavy cost as C | Only if supervisor demands full scale |

**Recommended:** A -> B -> (C if time). Always keep `source` column (`plantvillage` vs `irish`) to measure domain gap: test on Irish-only after training on PlantVillage-only = powerful viva figure showing why merging matters.

**Storage plan:** External SSD or `D:\Potato\data\` with `plantvillage\`, `irish_sample\`, `merged\`. Never commit images to Git. Use `.gitignore` for `data/`.

---

## 4. Problem Formulation (Simple Terms)

- **Input:** RGB leaf image `X` (e.g., 224×224×3 tensor, values 0-1 normalized).
- **Output:** Probability over 3 classes `y ∈ {early_blight, late_blight, healthy}`, pick argmax.
- **Type:** Supervised multi-class single-label image classification.
- **"From the very start" means:** you do your own train/val/test splits, preprocessing, augmentation, model definition, training loop, evaluation — not calling a ready-made API. It does NOT mean you must invent a new CNN architecture. Using standard architectures (ResNet/MobileNet) with your own training still counts as "from start" and is expected at bachelor level. Training a truly novel architecture from random weights on 60k images with no pretraining is possible but 2-4% worse and slower — see compromise in §12.

**Visual symptoms to learn (for report + viva):**
- Early blight (*Alternaria solani*): dark brown concentric rings / target spots, yellow halos, starts on older lower leaves, dry papery texture.
- Late blight (*Phytophthora infestans*): water-soaked pale-green → brown-black irregular lesions, white mold underside in humid, fast spread, can kill field in days.
- Healthy: uniform green, no spots, intact veins. Confusers: nutrient deficiency, sunburn, dirt — note as error cases.

---

## 5. Analysis Checklist (Run This When Data Arrives — Fill Tables in Future)

For each dataset (PlantVillage, Irish sample, merged), compute and paste into thesis Chapter 3:

- [ ] `n_images per class` + bar chart (detect imbalance; PlantVillage healthy likely minority)
- [ ] Image size distribution (min/median/max W×H), mode (RGB vs grayscale strays)
- [ ] Corrupt/unreadable count (`PIL verify`), duplicates (perceptual hash or file hash)
- [ ] Background audit: 50 random thumbnails per class (lab grey vs field soil/hands)
- [ ] Lighting audit: brightness histogram per class (field has long tail)
- [ ] Label sanity: 30 random images per class viewed by YOU + supervisor/second reader, note disagreements (early vs late is hardest)
- [ ] Source column check: no filename leakage (e.g., `earlyblt` in filename must NOT be used as feature — only folder label)
- [ ] Train/val/test overlap check: same leaf photographed twice must not split across sets (use file hash + group by plant/session if metadata available; else stratified random + augmentation ONLY on train)

**Future log template (copy-paste as you go):**

```
Date: ____ | Dataset: PV-2152 / IRISH-9k / MERGED-__k | Split seed: 42
Counts train/val/test per class: ...
Corrupt removed: ... Duplicates removed: ...
Notes / surprises: ...
```

---

## 6. Key Challenges (Must Discuss in Report)

1. **Domain shift (biggest):** PlantVillage = lab, Irish = field. Model trained on lab learns background, not disease. Solution: train on merged + test cross-domain (train PV, test Irish) to quantify drop (expect 15-30% drop — good viva story).
2. **Early vs late confusion:** Both brown spots; early = concentric rings, late = water-soaked irregular. Even pathologists disagree on borderline. Expect most errors here — show confusion matrix.
3. **Imbalance (PlantVillage):** Healthy ~152 vs ~1000 each blight. Without class weights, model ignores healthy. Fix: class weights + balanced sampling + F1-macro objective.
4. **Background bias:** Field soil/hands correlate with class if collection sessions differ. Fix: augmentation + background-robust architectures + Grad-CAM check (if heatmap highlights soil, not leaf → problem).
5. **Scale:** 60k high-res images = RAM/disk/time explosion. Fix: resize to 224×224 on load, progressive loading (`ImageFolder` + `DataLoader`), subset MVP first.
6. **Label noise:** Phone photos in sun/rain, motion blur, multiple leaves per image. Fix: cleaning pass + label smoothing (ε=0.1) + robust validation.
7. **Overfitting:** Small custom CNN memorizes 2k PlantVillage quickly. Fix: augmentation, dropout, early stopping, transfer learning.

---

## 7. Full Pipeline (New Image Approach — End to End)

```
data/ (plantvillage/ + irish_sample/)
  |
  V
[1] Ingest + Verify -> unzip, file-hash dedup, PIL verify, build index.csv (filepath, label, source, split)
  |
  V
[2] EDA + Cleaning -> counts, size stats, view samples, remove corrupt/duplicate, quarantine ambiguous
  |
  V
[3] Split (STRATIFIED, seed=42) -> 70% train / 15% val / 15% test, stratify by (label, source)
      + cross-domain test: hold out one source entirely for domain-gap experiment
  |
  V
[4] Preprocess -> resize 224x224, RGB, scale [0,1], normalize (ImageNet mean/std if transfer, else 0.5)
  |
  V
[5] Augment (TRAIN ONLY) -> RandomResizedCrop, HorizontalFlip, Rotation ±20°, ColorJitter, GaussianBlur(p=0.2), Cutout/RandomErasing(p=0.25)
      + val/test: deterministic Resize + CenterCrop only (NO augmentation)
  |
  V
[6] Model Zoo (pick 2-3, NOT 9):
      M1 baseline: Small-CNN-from-scratch (4-5 conv blocks, ~1-3M params) — proves "from start"
      M2: MobileNetV2 (pretrained ImageNet, fine-tune last 30 layers) — best accuracy/speed for demo
      M3 (optional): EfficientNetB0 or ResNet18 — comparison point
  |
  V
[7] Training -> CrossEntropy (label_smoothing=0.1, class_weights), AdamW (lr=3e-4, weight_decay=1e-4),
      Cosine or ReduceLROnPlateau, early stopping (patience=7), mixed precision on GPU
  |
  V
[8] Evaluation -> accuracy, balanced-acc, per-class P/R/F1, macro-F1, MCC, confusion matrix,
      ROC-AUC (ovr), reliability check, Grad-CAM for 6-9 examples (2 correct + 1 error per class)
  |
  V
[9] Export -> best_model.pt/.onnx + labels.json + test_metrics.json + demo app (Streamlit/Gradio)
  |
  V
[10] Report -> curves (loss/acc vs epoch), tables (M1 vs M2 vs M3), domain-gap table, limitations, future work
```

Detailed stage instructions + PyTorch skeleton to be added in FUTURE file `train_image.py` (not yet created — confirm before I generate it).

---

## 8. Models To Use (Bachelor-Friendly, Defensible)

| Model | Params | Why include | When to compromise |
|-------|--------|-------------|--------------------|
| **Small Custom CNN** (Conv-BN-ReLU ×4-5 + GAP + FC, dropout 0.3-0.5) | ~1-3M | Proves you can build/train from random init; fast on CPU for tiny subset; great viva ("explain each layer") | Keep, but train on 224px PlantVillage only for baseline; don't expect >88% on field data |
| **MobileNetV2 (transfer)** | ~3.5M | Best for 6 credits: light, fast on CPU demo (<200ms), 92-96% achievable, well-documented | **Main model.** Fine-tune, don't freeze entirely. |
| **EfficientNetB0 or ResNet18 (transfer)** | ~5M / 11M | One comparison point to show systematic evaluation | Optional third model; drop if time short — two models (CNN + MobileNetV2) already enough |
| ❌ Avoid for MVP | — | ViT, ConvNeXt-L, YOLO-seg, custom novel arch, full 60k from-scratch 50-epoch | Too heavy, too slow, too hard to defend. List as future work. |

**"From scratch" clarification for viva:** If examiner asks "did you train from scratch?", answer: *"Baseline CNN yes — random initialization, own training loop. Improved models use ImageNet pretraining as initialization then fine-tune all/partial layers on potato data — standard practice, still trained by me; from-scratch on 60k field images underperforms by 3-5% and needs 3× epochs, so transfer is the engineering-correct choice."* Have both results to prove it.

**Input sizes:** 224×224 for all (standard, fits Colab batch 32-64). 256×256 only if GPU memory allows and time remains — gain is marginal (+0.3%).

---

## 9. Training Protocol (Exact Settings To Start With)

- **Splits:** `train 70 / val 15 / test 15`, `stratify=(label, source)`, `random_state=42`. Test set locked until final run. Augmentation train-only.
- **Loss:** `CrossEntropyLoss(label_smoothing=0.1, weight=1/class_freq)` to handle PlantVillage healthy minority + label noise.
- **Optimizer:** `AdamW(lr=3e-4, weight_decay=1e-4)` for transfer; `Adam(lr=1e-3)` for small CNN. `batch_size=32` (Colab T4) or 16 if OOM.
- **Schedule:** `CosineAnnealingLR(T_max=epochs)` or `ReduceLROnPlateau(patience=3, factor=0.3)`. Epochs: small CNN 30-50, MobileNetV2 15-25 with early stopping patience 7 (monitor `val macro-F1`, not loss).
- **Augmentation (Albumentations or torchvision):** train: `RandomResizedCrop(224, scale 0.8-1.0), HorizontalFlip p=0.5, Rotation ±20, ColorJitter(0.2,0.2,0.2), GaussianBlur p=0.2, CoarseDropout/RandomErasing p=0.25`; val/test: `Resize(256) + CenterCrop(224)` only.
- **Normalization:** transfer: `mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]`; from-scratch: `mean=std=0.5`.
- **Reproducibility:** `seed_everything(42)`, save `config.json` per run (lr, batch, epochs, aug list, commit hash), log to CSV (`epoch, train_loss, val_loss, val_F1`).
- **Checkpointing:** save `best_val_F1.pt` + `last.pt`. Never pick epoch by test score.

---

## 10. Evaluation (Prove It Works — Beyond Accuracy)

Report ALL (thesis Table 4.x):

- Accuracy, balanced accuracy, macro-F1 (primary), weighted-F1, MCC, per-class precision/recall/F1.
- Confusion matrix (3×3) — expect early↔late off-diagonal mass; discuss with example images.
- ROC-AUC ovr + PR curves (optional but impressive, 1 plot).
- Training curves: loss/acc vs epoch for train/val (shows overfitting point + early stop).
- Grad-CAM: 2 correct + 1 misclassified per class (9 images). If heatmap on background → flag as limitation, not hide it.
- Cross-domain table: train-PV/test-Irish vs train-merged/test-Irish (quantifies domain gap fix).
- Inference speed: ms/image on CPU (for demo claim) + model size MB.

---

## 11. Hardware, Time, and Cost (Real Numbers for Planning)

**Storage / download (do this FIRST week):**

| Item | Size | Download time (20 Mbps) | Note |
|------|------|-------------------------|------|
| PlantVillage potato (~2.1k) | ~0.3 GB | ~2-5 min | Start here |
| Irish sample 9k (subset) | ~1-2 GB | ~10-20 min | MVP — ask supervisor how to sample or use script |
| Irish full 58k / 37 GB version | 7-37 GB | 1-5 hours + unzip 30-60 min | Avoid until MVP done; needs external drive |

**Training time (batch 32, 224px):**

| Setup | PlantVillage 2.1k (20 epochs) | Irish 9k subset (20 epochs) | Full 60k (20 epochs) |
|-------|-------------------------------|-----------------------------|----------------------|
| Laptop CPU i5/8GB (small CNN only) | 30-60 min | 3-6 hours (painful) | Infeasible (>24h) |
| Colab Free T4 GPU (small CNN) | 8-15 min | 25-45 min | 3-5 hours (may timeout — use checkpointing) |
| Colab T4 (MobileNetV2 fine-tune) | 10-20 min | 30-60 min | 4-7 hours (split into 2 sessions) |
| Kaggle GPU (30h free/week, better) | Similar to Colab, longer sessions | — | Preferred for full run |

**Rule:** MVP (PV + 9k Irish, MobileNetV2, 20 epochs) = **~1 hour GPU**. Full 60k + 3 models + tuning = **10-20 GPU-hours + storage pain** — NOT for 6 credits without compromise.

**Cost:** $0 using Colab Free / Kaggle GPUs + Zenodo/Kaggle data + PyTorch (open). Mention in proposal.

---

## 12. Feasibility for 6 Credits (~160h) — MVP vs Stretch

**Verdict: Feasible IF you start with subset MVP and add scale only if time remains.**

| Phase | MVP (do this) | Stretch (only if early finish) | Hours |
|-------|---------------|-------------------------------|-------|
| Data | PV 2.1k + Irish 6-9k stratified sample | Full 58k + dedup audit | 20h |
| Models | Small CNN + MobileNetV2 | + EfficientNetB0 / ResNet18 / ensemble | 35h |
| Tuning | 1-2 LR/batch tries + early stopping | Grid over aug/optimizers | 10h (MVP) vs +15h |
| Eval | Confusion + F1 + curves + 6 Grad-CAMs | + ROC/PR + cross-domain full table + error taxonomy | 15h |
| Demo | Streamlit/Gradio upload -> label + confidence | + mobile / ONNX / field test with real leaves | 15h |
| Report+viva | 60-80pp + poster + backup video | + paper submission | 30h |
| Buffer | 15h | — | 15h |
| **Total MVP** | **~140-160h** | +30-40h | Fits semester |

**Explicit compromises to write in proposal (examiners reward honesty):**

1. Train on balanced 6-9k Irish subset, not full 58k/37 GB (justify: Colab limits, time; full as future work).
2. Two models (custom CNN + MobileNetV2), third only if time (not 5+ architectures).
3. Single 224px input, no multi-scale / segmentation (detection boxes out of scope — classification only).
4. No IoT / mobile deployment; laptop Streamlit demo + timing benchmark.
5. No novel architecture invention; novelty = domain-mix strategy + systematic evaluation + explainability.
6. Limited field validation (test on held-out Irish sample, not live farm trip — note as limitation).

---

## 13. Factors To Consider (Proposal & Viva Checklist)

- [ ] **Data legality:** Cite PlantVillage (Mohanty 2016, CC BY-SA) + Irish Zenodo DOI + Kaggle mirror. No human subjects → simplified ethics, but state phytosanitary disclaimer (model is advisory, not replacement for agronomist).
- [ ] **Compute plan:** Week 1 test Colab T4 + Kaggle GPU access; fallback to CPU small-subset if GPU quota exhausted. Save checkpoints to Drive every epoch (Colab timeouts).
- [ ] **Reproducibility:** `requirements.txt` (torch, torchvision, albumentations, sklearn, matplotlib, grad-cam, streamlit), `seed=42`, `config.json` per run, Git for code only (never images), DVC or index.csv for data manifest.
- [ ] **Leakage:** Augmentation train-only; test locked; dedup by hash; group same-session leaves if metadata; filename must not encode label into model input.
- [ ] **Imbalance:** Class weights + macro-F1 primary; never report accuracy alone.
- [ ] **Overfitting signals:** val loss rises while train falls → stop; show curves in report.
- [ ] **Explainability:** Grad-CAM ready before viva — examiners WILL ask "how do you know it looks at disease, not background?"
- [ ] **Demo risk:** Offline-capable Streamlit (`streamlit run app.py`), 3 preloaded test images (1 per class), 2-min backup video if WiFi/GPU fails.
- [ ] **Report mapping:** Ch2 lit (use Summary.md §2-4 + Mohanty 2016 + Mduma 2023/25), Ch3 data+pipeline (§3-9 here), Ch4 results (§10 tables), Ch5 discussion (domain gap + errors + ethics), Ch6 conclusion.
- [ ] **Supervisor gates:** Week 3 lock scope/sample size, Week 6 show PV baseline curves, Week 10 show merged MobileNetV2 + confusion, Week 12 demo dry-run.

---

## 14. Folder Structure & Tooling (Create As You Go)

```
D:\Potato\
  analysis.md            <- this file (living doc)
  Summary.md             <- background (weather paper, keep §1-11)
  data\
    plantvillage\  (Potato___Early_blight/ Potato___Late_blight/ Potato___healthy/)
    irish_sample\  (earlyblt/ lateblt/ healthy/ + index.csv)
    merged\        (generated, never commit)
  outputs\               (checkpoints, metrics.json, confusion.png, gradcam/)
  train_image.py         (FUTURE — to be generated on request)
  app.py                 (FUTURE — Streamlit demo)
  requirements.txt       (FUTURE)
```

**Stack:** Python 3.10+, PyTorch + torchvision, Albumentations, scikit-learn, matplotlib/seaborn, pytorch-grad-cam, Streamlit/Gradio, Jupyter for EDA only (final code = .py scripts).

---

## 15. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 37 GB download fills disk / timeouts | High | High | Start with PV + 9k sample; external SSD; Kaggle API with `--sample` |
| Colab GPU quota exhausted before final run | Medium | High | Use Kaggle GPUs (30h/wk) as backup; save Drive checkpoints; reduce batch to 16 |
| Model learns background, fails cross-domain test | High | Medium | Expected — turn into result (domain-gap table) + augmentation + merged training |
| Early vs late confusion ~15% | High | Medium | Label smoothing + class weights + error gallery in report; not a fail |
| Scope creep (segmentation, app, drone) | Medium | High | Lock §12 MVP with supervisor signature week 3 |
| Label noise / blurry field images | Medium | Low | Cleaning pass + quarantine folder + report as limitation |

---

## 16. FUTURE LOG — Fill As You Execute (Do Not Delete)

### 16.1 Dataset inventory (verified 2026-09-23 — see verification scripts in Temp\opencode\check_images.py)

```
PlantVillage potato: total=2152 | early=1000 | late=1000 | healthy=152 | corrupt=0/150 sampled | dups=not yet checked
  -> COMPLETE (matches Mohanty/Kaggle 2152 standard). All 256x256 JPG, healthy minority as expected.
  -> Action: NONE needed.

Irish IrishPotato37G (before fix): total=13941 | early=5276 | late=3000 | healthy=5665 | corrupt=0/150 sampled
  -> INCOMPLETE vs official full 58709 (healthy 20438 / early 17772 / late 20499).
  -> healthy 1..5665 contiguous OK; late 1..3000 contiguous OK; early 1..7029 with 1753 gaps in-range.
  -> All sampled images readable; sizes vary (field phones, e.g. 4000x3000, 776x838 …), all .JPG.
  -> 30.41 GB on disk. Free disk D: 350 GB — full download feasible.

Fix applied: downloaded Zenodo 17553016 LATEBLT_6.zip (138 MB, md5 OK) -> extracted 67 new images
  Lateblt5001..5068 range into IrishPotato37G/lateblt/. lateblt now 3067 (was 3000).
  Downloader: D:\Potato\download_irish_full.py (21 zips, resumable, md5-checked, _zips/ folder).
  Remaining: 20 zips (~37.4 GB download, ~100 GB+ extracted). Run:
    python D:\Potato\download_irish_full.py           # all remaining (hours)
    python D:\Potato\download_irish_full.py HEALTHY_6.zip LATEBLT_1.zip   # selective
  Then extract each zip into matching earlyblt/healthy/lateblt/ (skip existing filenames).

Merged (current usable): total=16219+67=16286? compute: 2152 + 5276 + 5665 + 3067 = 16160
  -> MORE than enough for 6-credit MVP (needs 6-9k). Full 60k only as stretch goal.

BALANCED (2026-09-23, no full download — downsample to minority):
  Irish balanced: 3067/class x 3 = 9201 total (early 3067 / healthy 3067 / late 3067)
  Files: D:\Potato\Irish_balanced_index.csv (full) + Irish_balanced_train.csv (7360 = 80%) + Irish_balanced_val.csv (920 = 10%) + Irish_balanced_test.csv (921 = 10%)
  Split: 80/10/10 stratified, seed 42 (train 2454/2453/2453, val 306/307/307, test 307 each). Originals untouched in IrishPotato37G/ (no duplication).
  PlantVillage kept SEPARATE (2152, healthy only 152 — do not merge into balanced set or it re-imbalances).
  Use Irish balanced as MAIN training set; PlantVillage for pipeline debug + domain-gap test (train PV -> test Irish).
  If late_blight needs topping up later: run python D:\Potato\download_irish_full.py LATEBLT_1.zip (2.1 GB) etc., then re-run balance script.
Merged: total=___ | train/val/test per class: ___ | seed=42 | date=___
```

### 16.2 Experiment log (one row per run)

| Date | Exp ID | Data | Model | Epochs | Batch | LR | Aug | Val macro-F1 | Test acc | ckpt | Notes |
|------|--------|------|-------|--------|-------|----|-----|--------------|----------|------|-------|
| YYYY-MM-DD | E00-smoke | irish-balanced 360/90/90 | m1/m2/m3+ens 1ep CPU | 16 | 1e-3/3e-4 | train-only aug | m1 .679 / m2 .933 / m3 .967 / ens .967 | ens .9667 (90-img) | outputs_image/ | Weights are SMOKE ONLY — overwrite with full run below |
| YYYY-MM-DD | E02 | PV-only | MobileNetV2-ft | | | | | | | | |
| YYYY-MM-DD | E03 | merged-9k | MobileNetV2-ft | | | | | | | | |
| | | | | | | | | | | | |

### 16.3 Results (paste final numbers + figure paths)

```
Best model: ___ | Test acc=___ | macro-F1=___ | MCC=___ | per-class F1(E/L/H)=___/___/___
Confusion matrix: outputs/confusion.png
Curves: outputs/curves.png
Grad-CAM: outputs/gradcam/
Cross-domain (train-PV test-Irish): acc=___ (documents gap)
Inference: ___ ms/image CPU, model size ___ MB
Demo link/video: ___
```

### 16.4 Viva Q&A bank (add as supervisor asks)

- Q: Why merge lab + field instead of field only? A: ...
- Q: Why MobileNetV2 over larger model? A: ...
- Q: How do you know model doesn't cheat on background? A: Grad-CAM + cross-domain test ...
- Q: What would you do with 6 more months? A: full 60k + segmentation + field trial ...

---

## 17. References (Starter — Expand in Thesis)

- Mohanty et al. 2016. Using Deep Learning for Image-Based Plant Disease Detection. (PlantVillage, 54,306 images).
- Mduma/Laizer et al. 2023-2025. Irish Potato Imagery Dataset for Detection of Early and Late Blight (58,709 images, Zenodo 10.5281/zenodo.8286529 + 2025 v1).
- Radwan et al. 2024/2025. Potato Leaf Disease Classification Using Optimized ML (weather-tabular background — methods not reused, context only).
- Hughes & Salathé 2015 (PlantVillage original release); Barbedo 2018 (field vs lab gap — cite for domain-shift discussion).

> Next action: download PlantVillage potato (~2k) this week, run §5 checklist on it, fill §16.1, then request `train_image.py` + `requirements.txt` generation. Do NOT download full 37 GB Irish dump until MVP scope (6-9k sample) is supervisor-approved.
