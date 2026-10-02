"""Extract WE3DS RGB images + stride-sample diverse frames into non_leaf_v2.
Stride sampling (every kth frame) avoids adjacent-frame near-duplicates.
Writes non_leaf_v2/manifest_we3ds.csv (full W7 schema).
Usage: python scripts/we3ds_stage.py [--stride 8] [--n 320]
"""
import csv
import hashlib
import shutil
import sys
import zipfile
from pathlib import Path

BASE = Path("D:/Potato")
DST = BASE / "_staging" / "we3ds_rgb"
OUT_BUCKETS = {"soil_ground": 0.45, "empty_background": 0.3, "other_crops": 0.25}


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


def main():
    stride = int(sys.argv[sys.argv.index("--stride") + 1]) if "--stride" in sys.argv else 8
    n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 320
    zf = zipfile.ZipFile(BASE / "_staging" / "WE3DS.zip")
    imgs = sorted(m for m in zf.namelist()
                  if m.startswith("images/") and m.lower().endswith(".png"))
    print("rgb images:", len(imgs), flush=True)
    DST.mkdir(parents=True, exist_ok=True)
    picks = imgs[::stride][:n]
    for m in picks:
        dest = DST / Path(m).name
        if not dest.exists():
            with zf.open(m) as src, open(dest, "wb") as fh:
                shutil.copyfileobj(src, fh, 8 * 1024 * 1024)
    print(f"staged {len(picks)} frames", flush=True)
    files = sorted(DST.glob("*.png"))
    n_soil = int(len(files) * 0.45)
    n_bg = int(len(files) * 0.3)
    assign = {}
    for f in files[:n_soil]:
        assign[f] = "soil_ground"
    for f in files[n_soil:n_soil + n_bg]:
        assign[f] = "empty_background"
    for f in files[n_soil + n_bg:]:
        assign[f] = "other_crops"
    rows = []
    for f, bucket in assign.items():
        dest = BASE / "non_leaf_v2" / bucket / f"we3ds_{f.name}"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy(f, dest)
        rows.append({"dataset_name": "we3ds", "dataset_version": "zenodo-7457983",
                     "source_url": "https://doi.org/10.5281/zenodo.7457983",
                     "download_date": "2026-09-26", "native_label": "field-background",
                     "mapped_label": "non_leaf", "image_id": f.stem,
                     "original_filename": f.name, "sha256": sha(dest),
                     "perceptual_hash": "", "source_split": "train",
                     "manual_review_status": "pending", "license": "CC-BY-4.0",
                     "included_in_training": "0", "included_in_calibration": "0",
                     "included_in_final_test": "0"})
    with open(BASE / "non_leaf_v2" / "manifest_we3ds.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"bucketed {len(rows)} + manifest_we3ds.csv", flush=True)


if __name__ == "__main__":
    main()
