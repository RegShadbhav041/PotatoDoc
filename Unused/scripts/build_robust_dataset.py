"""Build leak-free robustness splits (EXP-ROBUST-001 prep).

Adds the external datasets (previously EVAL-only) to TRAINING while keeping
every evaluation set strictly held out:

  holdout = varied_eval's fixed sample (seed 42, per-small 5) + full PV test
            + full Irish grouped test
  sources  = ext_java (3076) + ext_eth_bari (514) + plantdoc (195) + non_leaf_v2 (1179)
  labels   = external -> our 4-class space; out-of-scope diseases -> non_leaf
  dedupe   = SHA1 content hash: any train file matching a holdout file is dropped
             (protects against renamed copies, e.g. plantdoc_* inside non_leaf_v2)
  splits   = per-source 80/10/10 (seed 42) on non-holdout files
  balance  = non_leaf TRAIN additions capped (keeps class ratios sane, avoids the
             non-leaf precision collapse seen in EXP-TRACKB)

Outputs (under BASE):
  robust_train.csv      = combined_train + capped external train
  robust_val.csv        = combined_val   + external val
  robust_ext_test.csv   = external test only (never trained/validated on)
  reports/robust_split_report.md
"""
import csv
import hashlib
import json
import random
import shutil
from collections import Counter, defaultdict
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent))
import varied_eval as ve

BASE = Path("D:/Potato")
SEED = 42
CAP_NONLEAF_TRAIN = 1400

JAVA_MAP = {
    "healthy": "healthy",
    "phytophthora": "late_blight",
    "fungi": "non_leaf",
    "bacteria": "non_leaf",
    "virus": "non_leaf",
    "nematode": "non_leaf",
    "pest": "non_leaf",
}
BARI_MAP = {
    "ethiopia_healthy": "healthy",
    "ethiopia_late_blight": "late_blight",
    "bari_healthy": "healthy",
    "bari_fungal_late_blight": "late_blight",
    "bari_bacterial_soft_rot": "non_leaf",
    "bari_viral_leaf_roll": "non_leaf",
    "bari_viral_pvx": "non_leaf",
    "bari_viral_pvy": "non_leaf",
}
IMG_EXT = {".jpg", ".jpeg", ".png"}


def sha1(p, buf=1 << 20):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        while True:
            b = f.read(buf)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def read_csv(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(p, rows):
    with open(p, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["filepath", "label", "source"])
        w.writeheader()
        w.writerows(rows)


def main():
    rng = random.Random(SEED)
    report = ["# Robust split build report (EXP-ROBUST-001)\n"]

    # ---- holdout (eval paths + full official test sets) ---------------------
    hold_items = ve.collect(random.Random(SEED), 5)
    hold_paths = {str(Path(i["path"])) for i in hold_items}
    hold_paths |= {r["filepath"] for r in read_csv(BASE / "PlantVillage_test.csv")}
    hold_paths |= {r["filepath"] for r in read_csv(BASE / "Irish_grouped_test.csv")}
    print(f"holdout paths: {len(hold_paths)} (varied_eval + PV test + Irish grouped test)")
    report.append(f"- holdout paths: {len(hold_paths)}\n")

    # ---- gather external candidates ----------------------------------------
    cand = []  # {filepath, label, source}

    def exists(p):
        return Path(p).exists()

    for r in read_csv(BASE / "ext_java.csv"):
        lab = JAVA_MAP.get(r["native_label"])
        if lab and exists(r["filepath"]):
            cand.append({"filepath": r["filepath"], "label": lab, "source": f"java_{r['native_label']}"})

    for r in read_csv(BASE / "ext_eth_bari.csv"):
        lab = BARI_MAP.get(r["native_label"])
        if lab and exists(r["filepath"]):
            cand.append({"filepath": r["filepath"], "label": lab, "source": f"bari_{r['native_label']}"})

    pd_root = BASE / "_staging" / "plantdoc" / "train"
    for d in sorted(pd_root.iterdir()):
        if d.is_dir():
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in IMG_EXT:
                    cand.append({"filepath": str(f), "label": "non_leaf", "source": f"plantdoc_{d.name}"})

    nl_root = BASE / "non_leaf_v2"
    for d in sorted(nl_root.iterdir()):
        if d.is_dir():
            for f in sorted(d.rglob("*")):
                if f.suffix.lower() in IMG_EXT:
                    cand.append({"filepath": str(f), "label": "non_leaf", "source": f"v2_{d.name}"})

    print(f"external candidates: {len(cand)}")
    print("  by label:", dict(Counter(c["label"] for c in cand)))

    # ---- drop holdout + hash dedupe ----------------------------------------
    cand = [c for c in cand if c["filepath"] not in hold_paths]
    hold_hashes = set()
    missing = 0
    for p in hold_paths:
        try:
            hold_hashes.add(sha1(p))
        except OSError:
            missing += 1
    print(f"after path-holdout removal: {len(cand)} (holdout unreadable: {missing})")

    kept, seen_hash, dup_hold, dup_self, unreadable = [], set(), 0, 0, 0
    for c in sorted(cand, key=lambda x: x["filepath"]):
        try:
            h = sha1(c["filepath"])
        except OSError:
            unreadable += 1
            continue
        if h in hold_hashes:
            dup_hold += 1
            continue
        if h in seen_hash:
            dup_self += 1
            continue
        seen_hash.add(h)
        kept.append(c)
    print(f"hash dedupe: dropped {dup_hold} holdout-copies, {dup_self} internal dups, {unreadable} unreadable")
    report.append(f"- external candidates: {len(cand)} -> after holdout+dedupe: {len(kept)} "
                  f"(holdout-copies {dup_hold}, self-dups {dup_self})\n")

    # ---- per-source 80/10/10 -----------------------------------------------
    by_src = defaultdict(list)
    for c in kept:
        by_src[c["source"]].append(c)
    train_ext, val_ext, test_ext = [], [], []
    for s in sorted(by_src):
        rows = sorted(by_src[s], key=lambda x: x["filepath"])
        rng.shuffle(rows)
        n = len(rows)
        n_tr = max(1, round(n * 0.8)) if n >= 5 else max(1, n - 2)
        n_va = max(1, round(n * 0.1)) if n >= 5 else 1
        if n_tr + n_va > n:
            n_tr = n - 1
        train_ext += rows[:n_tr]
        val_ext += rows[n_tr:n_tr + n_va]
        test_ext += rows[n_tr + n_va:]

    # ---- cap non_leaf TRAIN additions --------------------------------------
    nl_train = [r for r in train_ext if r["label"] == "non_leaf"]
    other_train = [r for r in train_ext if r["label"] != "non_leaf"]
    if len(nl_train) > CAP_NONLEAF_TRAIN:
        share = Counter(r["source"] for r in nl_train)
        keep, total = [], len(nl_train)
        bucket = defaultdict(list)
        for r in nl_train:
            bucket[r["source"]].append(r)
        for s, rows in bucket.items():
            k = max(1, int(CAP_NONLEAF_TRAIN * len(rows) / total))
            rng.shuffle(rows)
            keep += rows[:k]
        nl_train = keep[:CAP_NONLEAF_TRAIN]
    train_ext = other_train + nl_train
    print(f"non_leaf train additions capped: {len(nl_train)}")

    # ---- merge with combined splits ----------------------------------------
    comb_tr = read_csv(BASE / "combined_train.csv")
    comb_va = read_csv(BASE / "combined_val.csv")

    # early-stop: if a combined row is a holdout member (should not be), drop it
    comb_tr = [r for r in comb_tr if r["filepath"] not in hold_paths]
    comb_va = [r for r in comb_va if r["filepath"] not in hold_paths]

    robust_tr = comb_tr + train_ext
    tr_set = {r["filepath"] for r in robust_tr}
    leaked = [r for r in comb_va if r["filepath"] in tr_set]
    if leaked:
        print(f"combined_val leak into train: {len(leaked)} rows dropped from val")
    robust_va = [r for r in comb_va if r["filepath"] not in tr_set] + val_ext

    write_csv(BASE / "robust_train.csv", robust_tr)
    write_csv(BASE / "robust_val.csv", robust_va)
    write_csv(BASE / "robust_ext_test.csv", test_ext)

    # ---- assertions ---------------------------------------------------------
    sets = {
        "train": {r["filepath"] for r in robust_tr},
        "val": {r["filepath"] for r in robust_va},
        "test": {r["filepath"] for r in test_ext},
    }
    asserts = []
    asserts.append(("train âˆ© val = âˆ…", not (sets["train"] & sets["val"])))
    asserts.append(("train âˆ© ext_test = âˆ…", not (sets["train"] & sets["test"])))
    asserts.append(("val âˆ© ext_test = âˆ…", not (sets["val"] & sets["test"])))
    asserts.append(("holdout âˆ© train = âˆ…", not (hold_paths & sets["train"])))
    asserts.append(("holdout âˆ© val = âˆ…", not (hold_paths & sets["val"])))
    asserts.append(("holdout âˆ© ext_test = âˆ…", not (hold_paths & sets["test"])))
    asserts.append(("all files exist", all(Path(p).exists() for p in
                                           sets["train"] | sets["val"] | sets["test"])))

    def dist(rows):
        return dict(Counter(r["label"] for r in rows))

    print("\n== SPLIT SUMMARY ==")
    print(f"robust_train.csv     {len(robust_tr):6d}  {dist(robust_tr)}")
    print(f"robust_val.csv       {len(robust_va):6d}  {dist(robust_va)}")
    print(f"robust_ext_test.csv  {len(test_ext):6d}  {dist(test_ext)}")
    print("assertions:")
    for name, ok in asserts:
        print(f"  [{'OK' if ok else 'FAIL'}] {name}")
    if not all(ok for _, ok in asserts):
        raise SystemExit("split assertions FAILED â€” refusing to write")

    report += ["", "## Splits\n",
               "| split | rows | labels |", "|---|---|---|"]
    for name, rows in [("robust_train", robust_tr), ("robust_val", robust_va),
                       ("robust_ext_test", test_ext)]:
        report.append(f"| {name} | {len(rows)} | {dist(rows)} |")
    report += ["", "## Assertions\n"] + [f"- [{'OK' if ok else 'FAIL'}] {n}" for n, ok in asserts]
    report += ["", "## External train additions by source\n",
               "| source | rows |", "|---|---|"]
    for s, n in Counter(r["source"] for r in train_ext).most_common():
        report.append(f"| {s} | {n} |")
    (BASE / "reports" / "robust_split_report.md").write_text("\n".join(report), encoding="utf-8")
    print("\nreport -> reports/robust_split_report.md")

    # keep the holdout list for later audits
    Path("C:/Users/shadb/AppData/Local/Temp/opencode/holdout_paths.json").write_text(
        json.dumps(sorted(hold_paths), indent=0), encoding="utf-8")


if __name__ == "__main__":
    main()

