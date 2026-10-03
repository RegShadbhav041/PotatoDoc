"""Mechanical review pass over non_leaf_v2 (human visual review still required).
Drops unreadable + exact-duplicate (sha256) files, records pHash for near-dup triage.
Rewrites non_leaf_v2_manifest.csv. Does NOT judge content suitability.
Usage: python scripts/review_pass.py
"""
import csv
import hashlib
import os
from pathlib import Path

from PIL import Image
import imagehash

BASE = Path("D:/Potato")
NL2 = BASE / "non_leaf_v2"
seen_sha = {}
rows = []
dropped = []
for bucket in sorted(os.listdir(NL2)):
    d = NL2 / bucket
    if not d.is_dir():
        continue
    for f in sorted(d.glob("*")):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        try:
            with Image.open(f) as im:
                im.verify()
            h = hashlib.sha256(f.read_bytes()).hexdigest()
            if h in seen_sha:
                f.unlink()
                dropped.append((str(f), "exact-dup"))
                continue
            seen_sha[h] = str(f)
            try:
                ph = str(imagehash.phash(Image.open(f).convert("L")))
            except Exception:  # noqa: BLE001
                ph = ""
            src = "we3ds" if f.name.startswith("we3ds_") else (
                "plantdoc" if f.name.startswith("plantdoc_") else (
                    "openimages" if f.name.startswith("oi_") else "manual"))
            rows.append({"filepath": str(f), "bucket": bucket, "source": src,
                         "sha256": h, "phash": ph, "review": "pending-human"})
        except Exception:  # noqa: BLE001
            f.unlink()
            dropped.append((str(f), "unreadable"))
with open(NL2 / "non_leaf_v2_manifest.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
from collections import Counter
print("kept:", len(rows), Counter(r["bucket"] for r in rows))
print("dropped:", len(dropped), dropped[:10])
(BASE / "review_pass.json").write_text(
    __import__("json").dumps({"kept": len(rows), "dropped": dropped}, indent=1))
