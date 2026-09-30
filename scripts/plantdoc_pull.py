"""Selective PlantDoc checkout: legal Windows names, train/ only, NON-potato species.
Target ~200 foreign-leaf images across species for non_leaf_v2 other_leaves/other_crops.
Writes _staging/plantdoc_manifest.csv (repo path, species, split, sha256).
Usage: python scripts/plantdoc_pull.py [--n 200]
"""
import csv
import hashlib
import random
import subprocess
import sys
from pathlib import Path

REPO = Path("D:/Potato/_staging/plantdoc")
BAD = set('?*:<>|"')
SKIP_CLASS = ("potato",)


def ls_tree():
    r = subprocess.run(["git", "-C", str(REPO), "ls-tree", "-r", "HEAD", "--name-only"],
                       capture_output=True, text=True, check=True)
    return r.stdout.splitlines()


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


def main():
    n_target = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 200
    allp = ls_tree()
    cand = [p for p in allp if p.startswith("train/") and not any(ch in p for ch in BAD)
            and len(p) < 180  # Windows path-length safety
            and p.lower().endswith((".jpg", ".jpeg", ".png"))
            and not any(k in p.lower() for k in SKIP_CLASS)]
    by_cls = {}
    for p in cand:
        by_cls.setdefault(p.split("/")[1], []).append(p)
    print("classes:", {k: len(v) for k, v in sorted(by_cls.items())}, flush=True)
    rng = random.Random(42)
    per = max(1, n_target // max(1, len(by_cls)))
    picked = []
    for cls in sorted(by_cls):
        picked += rng.sample(by_cls[cls], min(per, len(by_cls[cls])))
    subprocess.run(["git", "-C", str(REPO), "restore", "--source=HEAD", "--"] + picked,
                   check=True)
    rows = [{"dataset_name": "plantdoc", "dataset_version": "github-HEAD",
             "source_url": "https://github.com/pratikkayal/PlantDoc-Dataset",
             "download_date": "2026-09-26", "native_label": Path(p).parts[1],
             "mapped_label": "non_leaf", "image_id": "",
             "original_filename": Path(p).name,
             "sha256": sha(REPO / p), "perceptual_hash": "", "source_split": "train",
             "manual_review_status": "pending", "license": "CHECK-REQUIRED (repo)",
             "included_in_training": "0", "included_in_calibration": "0",
             "included_in_final_test": "0"} for p in picked]
    with open(REPO / "plantdoc_manifest.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"restored {len(picked)} files + manifest", flush=True)


if __name__ == "__main__":
    main()
