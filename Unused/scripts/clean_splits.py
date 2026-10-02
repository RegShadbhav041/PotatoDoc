"""Drop unreadable images from all split CSVs (rewrite in place) + refresh hashes.
Usage: python scripts/clean_splits.py
Outputs: dropped_corrupt.json; updated splits_hash_full.json (full splits re-hashed).
"""
import hashlib
import json
from pathlib import Path

import pandas as pd
from PIL import Image

BASE = Path("D:/Potato")
CSVS = ["Irish_full_grouped_train.csv", "Irish_full_grouped_val.csv", "Irish_full_grouped_test.csv",
        "Irish_grouped_train.csv", "Irish_grouped_val.csv", "Irish_grouped_test.csv",
        "Irish_grouped_strict_test.csv"]
rep = {}
for name in CSVS:
    p = BASE / name
    df = pd.read_csv(p)
    bad = []
    for fp in df.filepath:
        try:
            with Image.open(fp) as im:
                im.verify()
        except Exception:
            bad.append(fp)
    if bad:
        df = df[~df.filepath.isin(bad)].reset_index(drop=True)
        df.to_csv(p, index=False)
    rep[name] = {"n": int(len(df)), "dropped": len(bad), "dropped_files": bad[:50]}
    print(name, "kept:", len(df), "dropped:", len(bad), flush=True)
(BASE / "dropped_corrupt.json").write_text(json.dumps(rep, indent=1))


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


info = json.loads((BASE / "splits_hash_full.json").read_text())
for nm in ("train", "val", "test"):
    p = BASE / f"Irish_full_grouped_{nm}.csv"
    sub = pd.read_csv(p)
    info["splits"][nm] = {"n": int(len(sub)), "sha256": sha(p),
                          "by_label": sub.label.value_counts().to_dict()}
(BASE / "splits_hash_full.json").write_text(json.dumps(info, indent=1))
print("hashes refreshed; dropped_total:",
      sum(v["dropped"] for v in rep.values()))
