"""Consolidate non_leaf_v2 buckets + manifests.
1) WE3DS: all frames are soil-dominant -> soil_ground (fix arbitrary split).
2) PlantDoc pulled files -> other_leaves bucket.
3) Merge manifests -> non_leaf_v2_manifest.csv with review flags.
Usage: python scripts/stage_negatives.py
"""
import csv
import os
import shutil
from pathlib import Path

BASE = Path("D:/Potato")
NL2 = BASE / "non_leaf_v2"

# 1) WE3DS rebucket
moved = 0
for b in ("empty_background", "other_crops"):
    d = NL2 / b
    for f in list(d.glob("we3ds_*.png")):
        shutil.move(str(f), str(NL2 / "soil_ground" / f.name))
        moved += 1
print("we3ds rebucketed to soil_ground:", moved)

# 2) PlantDoc -> other_leaves
src = BASE / "_staging" / "plantdoc" / "train"
n = 0
for root, _, files in os.walk(src):
    for f in files:
        if f.lower().endswith((".jpg", ".jpeg", ".png")):
            dest = NL2 / "other_leaves" / f"plantdoc_{Path(root).name}_{f}"
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                shutil.copy(os.path.join(root, f), dest)
            n += 1
print("plantdoc staged:", n)

# 3) merged manifest (bucket, filename, source, sha noted by bucket manifest files)
import hashlib


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for c in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


rows = []
for bucket in sorted(os.listdir(NL2)):
    d = NL2 / bucket
    if not d.is_dir():
        continue
    for f in sorted(d.glob("*")):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        src = "we3ds" if f.name.startswith("we3ds_") else (
            "plantdoc" if f.name.startswith("plantdoc_") else "manual")
        rows.append({"filepath": str(f), "bucket": bucket, "source": src,
                     "sha256": sha(f), "review": "pending"})
with open(NL2 / "non_leaf_v2_manifest.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
from collections import Counter
print("total:", len(rows), Counter(r["bucket"] for r in rows))
