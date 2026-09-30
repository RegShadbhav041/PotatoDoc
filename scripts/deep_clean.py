"""Full-decode clean of full-dataset splits (catches truncated files verify() misses).
Rewrites Irish_full_grouped_{train,val,test}.csv in place + refreshes splits_hash_full.json.
Writes dropped_truncated.json. Usage: python scripts/deep_clean.py
"""
import hashlib
import json
from pathlib import Path

import pandas as pd
from PIL import Image

BASE = Path("D:/Potato")
rep = {}
for nm in ("train", "val", "test"):
    p = BASE / f"Irish_full_grouped_{nm}.csv"
    df = pd.read_csv(p)
    bad = []
    for i, fp in enumerate(df.filepath):
        try:
            with Image.open(fp) as im:
                im.load()
        except Exception:  # noqa: BLE001
            bad.append(fp)
        if (i + 1) % 10000 == 0:
            print(f"{nm} {i+1}/{len(df)} bad={len(bad)}", flush=True)
    if bad:
        df = df[~df.filepath.isin(bad)].reset_index(drop=True)
        df.to_csv(p, index=False)
    rep[nm] = {"n": int(len(df)), "dropped": len(bad), "files": bad[:50]}
    print(nm, "kept:", len(df), "dropped:", len(bad), flush=True)
(BASE / "dropped_truncated.json").write_text(json.dumps(rep, indent=1))


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
print("hashes refreshed")
