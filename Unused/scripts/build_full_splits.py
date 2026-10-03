"""Grouped source-aware splits on the FULL Irish set (W1 formal step 2/3 prep).
Pool: IrishPotato37G_full/{earlyblt,healthy,lateblt} (58,709) + non_leaf/coco_person (600).
Group key: filename prefix + number//100 band (PROXY — not plant-level; see report_2.md).
Stratified group split 80/10/10, seed 42.
Outputs: Irish_full_grouped_{train,val,test}.csv, dataset_manifest_full.csv, splits_hash_full.json
Usage: python scripts/build_full_splits.py
"""
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path("D:/Potato")
FULL = BASE / "IrishPotato37G_full"
SEED = 42
CLS = {"earlyblt": "early_blight", "healthy": "healthy", "lateblt": "late_blight"}


def group_key(p: Path, label: str) -> str:
    if label == "non_leaf":
        return f"coco_{p.stem.lower()}"
    m = re.match(r"(.*?)(\d+)$", p.stem)
    if m:
        return f"{m.group(1).lower()}_{int(m.group(2)) // 100:04d}"
    return p.stem.lower()


rows = []
for folder, label in CLS.items():
    for p in sorted((FULL / folder).glob("*")):
        if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
            rows.append((str(p), label, "irish_full"))
coco = BASE / "non_leaf" / "coco_person"
for p in sorted(coco.glob("*")):
    if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
        rows.append((str(p), "non_leaf", "coco_person"))
pool = pd.DataFrame(rows, columns=["filepath", "label", "source"])
pool["group"] = [group_key(Path(f), lb) for f, lb in zip(pool.filepath, pool.label)]
print("pool:", len(pool), "groups:", pool.group.nunique())
print(pool.label.value_counts().to_dict())

rng = np.random.RandomState(SEED)
g = pool.groupby("group").agg(label=("label", lambda s: s.value_counts().idxmax())).reset_index()
assign = {}
for lab, sub in g.groupby("label"):
    ids = sub.group.tolist()
    rng.shuffle(ids)
    n = len(ids)
    n_te = max(1, int(round(n * 0.10)))
    n_va = max(1, int(round(n * 0.10)))
    for gid in ids[:n_te]:
        assign[gid] = "test"
    for gid in ids[n_te:n_te + n_va]:
        assign[gid] = "val"
    for gid in ids[n_te + n_va:]:
        assign[gid] = "train"
pool["split"] = pool.group.map(assign)
assert set(pool[pool.split == "train"].group) & set(pool[pool.split == "test"].group) == set()

for nm in ("train", "val", "test"):
    pool[pool.split == nm][["filepath", "label", "source"]].to_csv(
        BASE / f"Irish_full_grouped_{nm}.csv", index=False)
print(pool.groupby(["split", "label"]).size().unstack(fill_value=0).to_dict())

pool["bytes"] = pool.filepath.map(lambda f: Path(f).stat().st_size)
pool[["filepath", "label", "source", "bytes"]].to_csv(BASE / "dataset_manifest_full.csv", index=False)


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


info = {"seed": SEED, "group_rule": "prefix + number//100 band (PROXY, not plant-level)",
        "pool_n": int(len(pool)), "n_groups": int(pool.group.nunique()),
        "splits": {}}
for nm in ("train", "val", "test"):
    p = BASE / f"Irish_full_grouped_{nm}.csv"
    sub = pool[pool.split == nm]
    info["splits"][nm] = {"n": int(len(sub)), "sha256": sha(p),
                          "by_label": sub.label.value_counts().to_dict()}
info["manifest_sha256"] = sha(BASE / "dataset_manifest_full.csv")
(BASE / "splits_hash_full.json").write_text(json.dumps(info, indent=1))
print(json.dumps({k: v for k, v in info.items() if k != "splits"}, indent=1))
print("leak train/test groups: 0 (asserted)")
