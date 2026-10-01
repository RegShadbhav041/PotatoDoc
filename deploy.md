# PotatoDoc — Backend Models, Sizes & Free Deployment

Generated: 2026-09-29

> **Superseded.** The backend now lives in
> [RegShadbhav041/PotatoDoc-Backend](https://github.com/RegShadbhav041/PotatoDoc-Backend)
> (`app:app`, not `backend.app:app`), which adds `/auth/*` and `/history`.
> This file is kept as the model/weights inventory for the historical
> `D:\Potato` layout; its deploy commands no longer describe the live service.

## 1. Which models does the FastAPI backend serve?

Service: `D:\Potato\backend\app.py` (FastAPI, run with
`uvicorn backend.app:app --host 0.0.0.0 --port 8000`).
Weights dir: `D:/Potato/outputs_image` (override via env `POTATO_WEIGHTS_DIR`).
All models are **PyTorch** checkpoints (`.pt`), loaded lazily on first request and cached in RAM.

| model_id | Display name (in app) | Architecture | Weights file | Size |
|---|---|---|---|---|
| `small_cnn` | Small CNN (from scratch) | `SmallCNN` defined in `train_image_pv.py` | `outputs_image/small_cnn/best.pt` | **4.62 MB** |
| `mobilenetv2` | MobileNetV2 (transfer) | `torchvision.models.mobilenet_v2` + new `Linear` head | `outputs_image/mobilenetv2/best.pt` | **8.72 MB** |
| `efficientnetb0` | EfficientNet-B0 (transfer) | `torchvision.models.efficientnet_b0` + new `Linear` head | `outputs_image/efficientnetb0/best.pt` | **15.57 MB** |
| `ensemble` | Ensemble (All Models) | arithmetic **mean of the 3 members' softmax** probabilities (no own weights file) | uses the 3 above | (—) |
| `convnext_plantvillage` | *(legacy alias)* | resolves to `efficientnetb0` | same as above | (—) |

- Endpoint contract: `GET /ping`, `GET /models`, `POST /predict?model_id=…`, `POST /gradcam?model_id=…`
- Classes: `Early Blight | Late Blight | Healthy | Non-Leaf` (Non-Leaf and the entropy/prob
  gates return `Unknown` to the app).
- Gate config: `D:\Potato\calibration\thresholds.json` (`entropy_max=0.85`, `prob_min=0.55`).

## 2. Collected size and paths

### Serving-essential (what you actually need on a server)

| Item | Path | Size |
|---|---|---|
| small_cnn weights | `D:\Potato\outputs_image\small_cnn\best.pt` | 4.62 MB |
| mobilenetv2 weights | `D:\Potato\outputs_image\mobilenetv2\best.pt` | 8.72 MB |
| efficientnetb0 weights | `D:\Potato\outputs_image\efficientnetb0\best.pt` | 15.57 MB |
| labels/classes | `D:\Potato\outputs_image\labels.json` | 165 B |
| train config / ensemble config / metrics | `outputs_image\{config.json,ensemble_config.json,metrics.json}` | ~2.8 KB |
| gate thresholds | `D:\Potato\calibration\thresholds.json` | 449 B |
| backend code | `D:\Potato\backend\app.py` | 10.0 KB |
| SmallCNN architecture import | `D:\Potato\train_image_pv.py` | 14.3 KB |
| dependencies | `D:\Potato\requirements.txt` | 119 B |
| **Total (weights)** | | **≈ 29 MB** |
| **Total (weights + code/config)** | | **≈ 29.1 MB** |

### Full training output (NOT needed to serve)

- Whole `outputs_image` dir: **144.13 MB** — includes `last.pt` (28.91 MB) and `resume.pt`
  (86.08 MB optimizer-state checkpoints used only for training resume).
- Runtime dependency footprint: **CPU-only** torch/torchvision wheels ≈ 190 MB installed
  (`pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu` — no CUDA needed).

**Recommendation for deploy:** ship only the three `best.pt` files + the 6 small config/code
files (~29 MB). Exclude `resume.pt`/`last.pt`/`curves.png`/`train.log`.

## 3. Free backend server suggestion

**Recommended: Hugging Face Spaces (Docker SDK)** — best free fit for this workload.

- **Free tier:** 2 vCPU / 16 GB RAM CPU Basic — comfortably runs torch CPU inference
  (EfficientNet-B0 @224px ≈ 100–300 ms/request on 2 vCPU; ensemble ≈ 3× that).
- **Size fit:** 29 MB weights via Git LFS (free), repo limit far above this.
- **Full control:** Docker SDK → run exactly the same FastAPI/uvicorn command; the API
  contract (`/ping`, `/models`, `/predict`, `/gradcam`) is unchanged.
- **Cost:** $0. Caveats: sleeps after ~48 h inactivity (cold start 30–60 s) — keep it awake
  with a free ping-cron (GitHub Actions schedule or UptimeRobot); public repos are free,
  private Spaces need a PRO account (make it public instead).
- **App change:** set `mobile/.env` → `EXPO_PUBLIC_API_URL=https://<user>-<space>.hf.space`.

Minimal `Dockerfile` sketch:

```dockerfile
FROM python:3.11-slim
RUN pip install --no-cache-dir torch torchvision \
      --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" python-multipart pillow matplotlib
COPY backend/app.py ./backend/app.py
COPY train_image_pv.py .
COPY outputs_image/ ./outputs_image/
COPY calibration/ ./calibration/
# BASE is hardcoded to D:/Potato in app.py -> change BASE to Path(".") or use env var first
ENV POTATO_WEIGHTS_DIR=/app/outputs_image
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
```

(7860 is the port HF Spaces exposes for Docker.)

### Alternatives (free-tier honest assessment)

| Platform | Free offer | Verdict for this project |
|---|---|---|
| **Google Cloud Run** | 2M req/mo + 360k GB-s vCPU-s/month, containerized, scales to zero | Best "production-ish" free option; cold starts a few seconds; needs a Dockerfile + `gcloud` setup |
| **Oracle Cloud Always Free VM** | Always-free ARM Ampere (up to 4 OCPU / 24 GB RAM) | Full always-on server, no sleep; you administer an Ubuntu VM yourself |
| **Render (free web service)** | 512 MB RAM, spins down, ephemeral disk | **Not recommended** — torch server typically needs 1 GB+; likely OOM |
| **Railway / Fly.io** | No meaningful always-free tier in 2026 (trial credit only) | Not free long-term |
| **Vercel / Netlify** | Serverless functions | Unsuitable — no long-lived torch process, request/time limits |
| **Kaggle / Colab notebooks** | Free GPU sessions | Not a 24/7 server; only for batch/offline scoring |

**Bottom line:** use **Hugging Face Spaces (Docker)** for zero-cost, minimal-effort hosting of
these ~29 MB of PyTorch weights; switch to Cloud Run or an Oracle always-free VM if you need
no-sleep availability or private access.
