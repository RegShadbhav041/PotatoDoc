"""Varied-data API evaluation: every model (small_cnn / mobilenetv2 / efficientnetb0 / ensemble)
against in-distribution leaves, external datasets, other potato diseases (bacteria/fungi/virus/
nematode/pest/phytophthora), other-crop leaves, non-leaf OOD, and synthetic corruptions.

Expected-set semantics:
  in-distribution classes -> exact class required (Unknown on a clean leaf = failure)
  semantically-equivalent (bari_fungal_late_blight, java_phytophthora, plantdoc tomato EL/LB)
      -> accept the matching disease OR Unknown
  everything else (bacteria, virus, other crops, non-leaf, corruptions... ) -> Unknown required

Usage: python scripts/varied_eval.py [--limit N] [--workers 4]
Outputs: reports/varied_eval_results.json, reports/varied_eval_report.md
"""
import argparse, io, json, random, sys, time
from collections import Counter, defaultdict
from pathlib import Path

import requests
from PIL import Image, ImageEnhance, ImageFilter

BASE = Path("D:/Potato")
REPORTS = BASE / "reports"
API = "http://127.0.0.1:8000/predict"
MODELS = ["small_cnn", "mobilenetv2", "efficientnetb0", "ensemble"]
MODEL_LABEL = {"small_cnn": "Small CNN", "mobilenetv2": "MobileNetV2",
               "efficientnetb0": "EfficientNetB0", "ensemble": "Ensemble"}
SEED = 42
MAX_BYTES = 9 * 1024 * 1024

E, L, H, U = "Early Blight", "Late Blight", "Healthy", "Unknown"

BARI_EXPECT = {
    "bari_fungal_late_blight": [L, U], "bari_healthy": [H],
    "bari_bacterial_soft_rot": [U], "bari_viral_leaf_roll": [U],
    "bari_viral_pvx": [U], "bari_viral_pvy": [U],
}
JAVA_EXPECT = {"healthy": [H], "phytophthora": [L, U], "bacteria": [U],
               "fungi": [U], "virus": [U], "nematode": [U], "pest": [U]}
PLANTDOC_EXPECT = {"Tomato Early blight leaf": [E, U], "Tomato leaf late blight": [L, U]}


def read_csv(p):
    import csv
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def sample(rows, key, per, rng):
    by = defaultdict(list)
    for r in rows:
        by[r[key]].append(r)
    out = []
    for k in sorted(by):
        grp = sorted(by[k], key=lambda r: r["filepath"])
        out += rng.sample(grp, min(per, len(grp)))
    return out


def collect(rng, per_small):
    items = []  # {path, source, native, expected}

    def add(path, source, native, expected):
        items.append({"path": str(path), "source": source, "native": native,
                      "expected": expected})

    pv = read_csv(BASE / "PlantVillage_test.csv")
    for r in sample(pv, "label", per_small, rng):
        exp = {"early_blight": [E], "late_blight": [L], "healthy": [H], "non_leaf": [U]}[r["label"]]
        add(r["filepath"], "plantvillage_test", r["label"], exp)

    ir = read_csv(BASE / "Irish_grouped_test.csv")
    for r in sample(ir, "label", per_small, rng):
        exp = {"early_blight": [E], "late_blight": [L], "healthy": [H], "non_leaf": [U]}[r["label"]]
        add(r["filepath"], "irish_test", r["label"], exp)

    eb = read_csv(BASE / "ext_eth_bari.csv")
    for r in sample(eb, "native_label", per_small + 1, rng):
        nat = r["native_label"]
        if nat == "ethiopia_healthy":
            exp = [H]
        elif nat == "ethiopia_late_blight":
            exp = [L]
        else:
            exp = BARI_EXPECT[nat]
        add(r["filepath"], "ext_ethiopia_bari", nat, exp)

    java = read_csv(BASE / "ext_java.csv")
    for r in sample(java, "native_label", per_small + 1, rng):
        add(r["filepath"], "ext_central_java", r["native_label"], JAVA_EXPECT[r["native_label"]])

    pd_dir = BASE / "_staging" / "plantdoc" / "train"
    for d in sorted(pd_dir.iterdir()):
        if not d.is_dir():
            continue
        files = sorted(f for f in d.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
        for f in rng.sample(files, min(2, len(files))):
            add(f, "plantdoc_other_crops", d.name, PLANTDOC_EXPECT.get(d.name, [U]))

    nl_dir = BASE / "non_leaf_v2"
    for d in sorted(nl_dir.iterdir()):
        if not d.is_dir():
            continue
        files = sorted(f for f in d.rglob("*")
                       if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
        for f in rng.sample(files, min(per_small, len(files))):
            add(f, f"non_leaf_v2/{d.name}", d.name, [U])

    return items


def add_corruptions(items, rng):
    base = [i for i in items if i["source"] == "plantvillage_test"
            and i["native"] in ("early_blight", "late_blight", "healthy")]
    picked = rng.sample(base, min(6, len(base)))
    out = []
    for it in picked:
        im = Image.open(it["path"]).convert("RGB")
        variants = {
            "blur": ImageFilter.GaussianBlur(6),
            "dark": None,
            "overexposed": None,
        }
        b = im.filter(variants["blur"])
        d = ImageEnhance.Brightness(im).enhance(0.3)
        o = ImageEnhance.Brightness(im).enhance(2.6)
        for name, img in (("blur", b), ("dark", d), ("overexposed", o)):
            buf = io.BytesIO(); img.save(buf, "JPEG", quality=90)
            out.append({"path": it["path"], "bytes": buf.getvalue(),
                        "source": f"synthetic_{name}", "native": it["native"],
                        "expected": it["expected"], "derived_from": it["path"]})
    return out


def predict(raw, model, timeout=60):
    for attempt in (0, 1):
        try:
            r = requests.post(API, params={"model_id": model},
                              files={"file": ("t.jpg", raw, "image/jpeg")},
                              timeout=timeout)
            if r.status_code == 200:
                return r.json()
            if attempt == 0:
                time.sleep(1.5)
            else:
                return {"error": f"HTTP {r.status_code}: {r.text[:120]}"}
        except Exception as e:
            if attempt == 0:
                time.sleep(1.5)
            else:
                return {"error": str(e)}
    return {"error": "unreachable"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-small", type=int, default=5,
                    help="images per small class (default 5)")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    rng = random.Random(SEED)
    items = collect(rng, args.per_small)
    items += add_corruptions(items, rng)

    loadable = []
    for it in items:
        try:
            if "bytes" in it:
                raw = it["bytes"]
            else:
                p = Path(it["path"])
                if not p.exists() or p.stat().st_size > MAX_BYTES:
                    continue
                raw = p.read_bytes()
            Image.open(io.BytesIO(raw)).verify()
            it["bytes"] = raw
            loadable.append(it)
        except Exception:
            continue
    print(f"evaluating {len(loadable)} images x {len(MODELS)} models "
          f"({len(loadable)*len(MODELS)} requests)", flush=True)

    rows = []
    t0 = time.time()
    from concurrent.futures import ThreadPoolExecutor
    tasks = [(it, m) for it in loadable for m in MODELS]

    def run(task):
        it, m = task
        res = predict(it["bytes"], m)
        row = {"source": it["source"], "path": it["path"], "native": it["native"],
               "expected": it["expected"], "model": m}
        if "error" in res:
            row.update(pred=None, conf=None, is_unknown=None, error=res["error"])
        else:
            row.update(pred=res["class"], conf=round(float(res["confidence"]), 4),
                       is_unknown=res["is_unknown"],
                       entropy=round(float(res.get("entropy", 0)), 3),
                       green_ratio=res.get("green_ratio"),
                       probs=res.get("probabilities") or None)
        return row

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        for i, row in enumerate(ex.map(run, tasks), 1):
            rows.append(row)
            if i % 100 == 0:
                print(f"  {i}/{len(tasks)} ({time.time()-t0:.0f}s)", flush=True)

    REPORTS.mkdir(exist_ok=True)
    (REPORTS / "varied_eval_results.json").write_text(
        json.dumps({"seed": SEED, "n_images": len(loadable), "rows": rows}, indent=1))

    ok = [r for r in rows if r["pred"] is not None]
    for r in ok:
        r["correct"] = r["pred"] in r["expected"]

    lines = ["# Varied-data evaluation report", "",
             f"- images: {len(loadable)} (seed {SEED})",
             f"- models: {', '.join(MODELS)}",
             f"- requests ok: {len(ok)}/{len(rows)}", "",
             "## Accuracy by model", "",
             "| model | correct | total | accuracy |", "|---|---|---|---|"]
    for m in MODELS:
        sub = [r for r in ok if r["model"] == m]
        c = sum(r["correct"] for r in sub)
        lines.append(f"| {MODEL_LABEL[m]} | {c} | {len(sub)} | {c/len(sub):.1%} |")

    lines += ["", "## Accuracy by source x model", "",
              "| source | n | " + " | ".join(MODEL_LABEL[m] for m in MODELS) + " |",
              "|---|---|" + "---|" * len(MODELS)]
    by_src = defaultdict(lambda: defaultdict(list))
    for r in ok:
        by_src[r["source"]][r["model"]].append(r["correct"])
    for src in sorted(by_src):
        n = len(next(iter(by_src[src].values())))
        cells = [f"{sum(by_src[src][m])/len(by_src[src][m]):.0%}" if by_src[src].get(m) else "-" for m in MODELS]
        lines.append(f"| {src} | {n} | " + " | ".join(cells) + " |")

    lines += ["", "## Failures (predicted class not in expected set)", ""]
    fails = [r for r in ok if not r["correct"]]
    lines.append(f"total failures: {len(fails)}")
    combo = Counter((r["model"], r["native"], r["pred"]) for r in fails)
    lines += ["", "| model | true/native | predicted as | count |", "|---|---|---|---|"]
    for (m, nat, pred), c in combo.most_common():
        lines.append(f"| {MODEL_LABEL[m]} | {nat} | {pred} | {c} |")

    lines += ["", "## Per-image failure list", ""]
    for r in fails:
        lines.append(f"- [{MODEL_LABEL[r['model']]}] {r['source']}/{Path(r['path']).name} "
                     f"({r['native']}) -> {r['pred']} conf={r['conf']} "
                     f"expected={'|'.join(r['expected'])}")

    (REPORTS / "varied_eval_report.md").write_text("\n".join(lines))
    print(f"done in {time.time()-t0:.0f}s; report -> {REPORTS/'varied_eval_report.md'}")


if __name__ == "__main__":
    main()
