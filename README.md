# PotatoDoc 🥔 — Potato Leaf Disease Classification

**End-to-end AI system that diagnoses potato leaf diseases from a phone photo** — Early Blight,
Late Blight, or Healthy — with Grad-CAM heatmaps explaining *why*, and a built-in guard that
answers **Unknown** instead of guessing when the photo isn't a potato leaf at all.

PyTorch ensemble (SmallCNN + MobileNetV2 + EfficientNet-B0) · FastAPI inference backend ·
React Native (Expo) Android app · fully automated emulator UI test suite.

---

## Highlights

- **Three trained models + soft-vote ensemble**, served interchangeably from one API.
- **Explainable**: per-model Grad-CAM heatmaps rendered on the phone.
- **Honest about uncertainty**: 3-layer foreign-object rejection (green-pixel gate, trained
  Non-Leaf class, entropy rule) so people/walls/dogs return `Unknown`, never a fake disease.
- **Offline-first mobile app**: scans, history (50 entries, crash-safe), model selection,
  disease reference, Grad-CAM viewer.
- **Production-shaped QA**: 59-row automated emulator test campaign (UI ↔ API cross-check,
  history persistence, save flow) with 58/59 pass and 0 UI/API mismatches.

## Results

4-class held-out test (Irish field set, 980 images) — the weights served by default:

| Model | Accuracy | F1-macro | ROC-AUC (OVR) |
|-------|----------|----------|----------------|
| small_cnn (from scratch) | 96.33% | 96.04% | 0.9965 |
| mobilenetv2 (transfer) | 99.90% | 99.92% | 1.0000 |
| efficientnetb0 (transfer) | 99.90% | 99.92% | 1.0000 |
| **ensemble (soft vote)** | **99.90%** | **99.92%** | **1.0000** |

PlantVillage 4-class lab benchmark (16 epochs, RTX 3060): M1 98.55% · M2 100% · M3 100% ·
ensemble 100%, Non-Leaf recall 60/60 on the ensemble. See
[Non-Leaf rejection](#3-layer-foreign-object-rejection) for how negatives are handled.

## Quick start

```bash
# Backend — run the standalone repo (has /auth/* + /history)
#   https://github.com/RegShadbhav041/PotatoDoc-Backend
git clone https://github.com/RegShadbhav041/PotatoDoc-Backend.git
cd PotatoDoc-Backend && pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
# Windows + free Cloudflare tunnel in one step:
#   powershell -ExecutionPolicy Bypass -File start_backend.ps1

# Smoke test
curl http://127.0.0.1:8000/ping
curl -X POST "http://127.0.0.1:8000/predict?model_id=ensemble" -F "file=@leaf.jpg"

# Mobile app (Metro on :8081)
cd mobile && npm install && npx expo start --port 8081
```

Phone/emulator reach the PC via `adb reverse tcp:8081 tcp:8081` + `adb reverse tcp:8000 tcp:8000`
(or set `EXPO_PUBLIC_API_URL` in `mobile/.env`).

> `backend/app.py` in this repo is **superseded** — kept only for the historical
> `D:\Potato` setup. It has no `/auth/*`, so sign-in will 404 against it. Use
> `PotatoDoc-Backend`.

---

## Architecture

```
┌────────────────────┐   multipart    ┌──────────────────────┐    .pt checkpoints
│  React Native app  │ ─────────────► │  FastAPI backend      │ ◄── outputs_image/
│  (Expo, Android)   │ ◄───────────── │  backend/app.py       │     small_cnn|mobilenetv2
│  Home│Diagnose│    │  JSON + base64 │  /predict /gradcam    │     efficientnetb0
│  History│Loc│About │                │  green-ratio + entropy│    (best.pt each)
└────────────────────┘                └──────────────────────┘
        │  AsyncStorage (≤50 entries, oversized-row repair)
        └── history, saved scans, settings
```

### Backend contract (stable — mobile depends on it)

| Endpoint | Method | Behavior |
|----------|--------|----------|
| `/ping` | GET | `Hello, I am alive` (text) |
| `/models` | GET | `{models, modelNames, default}` |
| `/predict?model_id=<id>` | POST | multipart `file` → `{class, confidence, probabilities}`; unknown → `{class:"Unknown", is_unknown:true, entropy, message}` |
| `/gradcam?model_id=<id>` | POST | single `{overlay: data-uri}` or ensemble `{heatmaps:{id:{overlay}}}` |

- Model IDs: `small_cnn` · `mobilenetv2` · `efficientnetb0` · `ensemble` (default)
  (+ legacy alias `convnext_plantvillage` → `efficientnetb0`).
- Inputs: JPEG/PNG/WebP, max 10 MB. Class strings exact: `Early Blight` | `Late Blight` |
  `Healthy` | `Unknown`.
- Switch weight family without code changes:
  `POTATO_WEIGHTS_DIR=D:/Potato/outputs_pv uvicorn backend.app:app --port 8000`
  (default `outputs_image` = Irish field, `outputs_pv` = PlantVillage lab).
- Determinism verified: 3× serial identical requests → identical class + confidence.

### 3-layer foreign-object rejection

A leaf-only classifier confidently labels *any* photo as a disease. PotatoDoc answers
**Unknown** instead, layering cheapest-first:

| # | Layer | Where | Training |
|---|-------|-------|----------|
| 1 | `green_ratio` — leaf-green pixel fraction, logged on every prediction | `backend/app.py` | No |
| 2 | Trained **Non-Leaf** class (600 COCO person photos) → mapped to Unknown card | retrain 4 heads | Yes |
| 3 | Entropy / max-prob rule (`entropy > 0.85` or `max < 0.55`) | `backend/app.py` | No |

Layer 1 is deliberately *not* a hard gate: fully necrotic blight leaves score green ≈ 0.0,
indistinguishable from persons — rejection relies on appearance (2) + uncertainty (3).
`Non-Leaf` never reaches the app: it is returned as `{class:"Unknown", is_unknown:true}`
with a retake message, and is skipped for heatmap + save.

---

## Mobile app (React Native · Expo)

| Tab | What it does |
|-----|--------------|
| **Home** | Scan entry card, disease reference (Healthy / Early / Late Blight), signed-out "Sign In" card or signed-in account card with Sign out |
| **Diagnose** | Pick/take photo → choose model (or Ensemble) → predict → Grad-CAM heatmaps per model → Save |
| **History** | **Gated behind sign-in.** Last 50 predictions with thumbnails/confidence/model/timestamp, Clear button |
| **Location** | Field-location card |
| **About** | App info |

Engineering notes:
- **Auth** (`useAuth`) — opaque server token held in AsyncStorage, 30-day TTL;
  sign-in is local-first so a failed or offline session never blocks saving a
  prediction. History is locked until signed in; everything else stays open.
- **History sync** (`useHistorySync`) — device is the source of truth: server
  copy is unioned in once per sign-in (device wins on id collision, `imageUri`
  never syncs), then pushed back on a 1.5 s debounce. A 401 re-locks the tab
  without discarding local rows.
- History persisted in AsyncStorage with a **max-50 cap** and **oversized-row repair**
  (`historyRepair`) — base64 heatmap rows previously blew past Android's `CursorWindow`
  and made history unreadable; heatmaps are never stored, only metadata + thumbnail URI.
- `UnknownImageCard` shows a retake message, hides save, and skips the heatmap.
- Dev setup: Metro `:8081`, API `http://10.0.2.2:8000` for emulator (see `mobile/.env`).

## Training

Two trainers with resume-from-power-loss safety:

```bash
# PlantVillage lab run (16 epochs, batch 32, 224px)
python train_image_pv.py --epochs 16 --batch 32 --img 224 --models m1 m2 m3
python train_image_pv.py --epochs 16 --resume          # continue after interruption

# Irish field run
python train_image.py --epochs 25 --resume
```

- Every epoch writes `resume.pt` (weights + optimizer + scheduler + epoch + best +
  `n_classes`); a class-count guard refuses stale checkpoints from a different head size
  instead of crashing.
- Outputs land in `outputs_image/` (default) or `outputs_pv/`, one folder per model with
  `best.pt`, curves, history, and a shared `metrics.json` / `labels.json`.

## Data

- **PlantVillage** (lab): splits rebuilt — train 2201 / val 275 / test 276 (80/10/10, seed 42).
- **Irish field** (deployed): train 7840 / val 980 / test 981; class weights handle
  minority classes (e.g. non_leaf 16.33).
- **Negatives**: 600 COCO val2017 photos containing *person* but not *potted-plant*
  (annotations filtered, seed 42) → the `Non-Leaf` class.
- Integrity reports: `leakage_report.json`, `splits_hash_full.json`,
  `dropped_corrupt.json`, `dropped_truncated.json`.

## Testing & QA

- **Automated emulator campaign** (`reports/emulator_ui_driver.ps1` + uiautomator):
  59 image×model rows driven through the real Android UI, cross-checked against API truth
  saved to `emulator_set/manifest.json` — **58 ok / 1 historic menu_fail, 0 UI↔API
  mismatches, 41 saves, 50 history entries** (report: `test.md`).
- JSONL artifact `reports/emulator_ui_results.jsonl` (canonical 59 rows) with backups.
- Incident log (`reports/errors.log`) documents real bugs found and fixed: CursorWindow
  history corruption, stale manifest truth, tap-timing menu failures.
- UI screenshots are downscaled + `uiautomator` dumps drive reliable taps (content-desc
  taps proved flaky; resource-id taps are used).

## Project structure

```
PotatoDoc/
├── backend/app.py          # superseded — see PotatoDoc-Backend (no /auth/* here)
├── mobile/                 # Expo app (screens, hooks, history repair)
├── train_image.py          # Irish field trainer (resume-safe)
├── train_image_pv.py       # PlantVillage trainer (resume-safe)
├── outputs_image/          # served weights + metrics.json (default)
├── outputs_pv/             # lab weights (switch via POTATO_WEIGHTS_DIR)
├── reports/                # test.md, errors.log, emulator driver + artifacts
├── scripts/                # API-truth exporter, utilities
├── test.md                 # emulator campaign report
└── README.md
```

## Future work

- Field negatives (soil/hands-only shots) as a second negative source.
- Collect user-submitted Unknown cases into a growing negative set.

Shipped (was listed as future work): **server-side history sync with auth** —
implemented 2026-10-01 with opaque server tokens and SQLite (not Postgres) in
[PotatoDoc-Backend](https://github.com/RegShadbhav041/PotatoDoc-Backend).

## License

Dataset licenses apply to `PlantVillage` and COCO images respectively; project code is
provided as-is for research/education.
