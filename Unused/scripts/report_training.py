"""Comprehensive training-report generator for every PotatoDoc weight family.

Produces ONE self-contained markdown report with embedded PNGs:
  - experiment registry (all past runs)
  - per-family training curves (train/val loss + val macro-F1, best-epoch markers)
  - full metric tables (acc / bal-acc / F1 / MCC / per-class F1 / ROC-AUC)
  - confusion matrices (counts + row-normalized) for every saved test set
  - calibration (temperature, ECE before/after) + reliability diagrams from probas
  - cross-family comparison table
  - latest varied external evaluation (per-source accuracy + top failures)

Idempotent: re-run after ANY train/retrain to refresh everything (including
future runs — any new outputs_<family>/ directory is picked up automatically).

Usage:
  python scripts/report_training.py
  python scripts/report_training.py --families outputs_robust outputs_combined
"""
import argparse
import json
import datetime
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE = Path("D:/Potato")
REPORTS = BASE / "reports"
MODELS = ["small_cnn", "mobilenetv2", "efficientnetb0", "ensemble"]
MLABEL = {"small_cnn": "Small CNN (M1)", "mobilenetv2": "MobileNetV2 (M2)",
          "efficientnetb0": "EfficientNet-B0 (M3)", "ensemble": "Ensemble"}
CLASSES = ["Early Blight", "Late Blight", "Healthy", "Non-Leaf"]


def jload(p):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except Exception:
        return None


def fmt(v, nd=4):
    if v is None:
        return "-"
    if isinstance(v, (int, float)):
        return f"{v:.{nd}f}"
    return str(v)


def fig_path(assets, family, name):
    d = assets / family
    d.mkdir(parents=True, exist_ok=True)
    return d / name


def rel(md_dir, p):
    return Path(p).relative_to(md_dir).as_posix()


# ---------------------------------------------------------------- curves ----
def plot_curves(fam_dir, assets, md_dir, lines):
    """Grid: one row per available model, cols = (loss, val macro-F1)."""
    present = [m for m in MODELS[:3] if (fam_dir / m / "history.json").exists()]
    if not present:
        return None
    fig, axes = plt.subplots(len(present), 2, figsize=(11, 3.1 * len(present)), squeeze=False)
    for i, mid in enumerate(present):
        h = jload(fam_dir / mid / "history.json") or {}
        tl, vl, vf = h.get("train_loss", []), h.get("val_loss", []), h.get("val_f1", [])
        ep = range(1, max(len(tl), len(vl), len(vf)) + 1)
        ax = axes[i][0]
        if tl: ax.plot(range(1, len(tl) + 1), tl, label="train loss", color="#1f77b4")
        if vl: ax.plot(range(1, len(vl) + 1), vl, label="val loss", color="#ff7f0e")
        ax.set_title(f"{MLABEL[mid]} — loss"); ax.set_xlabel("epoch"); ax.legend(fontsize=8); ax.grid(alpha=.3)
        ax = axes[i][1]
        if vf:
            ax.plot(range(1, len(vf) + 1), vf, label="val macro-F1", color="#2ca02c")
            b = int(np.argmax(vf)) + 1
            ax.scatter([b], [vf[b - 1]], color="red", zorder=5, s=40)
            ax.annotate(f"best ep{b} = {vf[b - 1]:.4f}", (b, vf[b - 1]),
                        textcoords="offset points", xytext=(8, -12), fontsize=8, color="red")
        ax.set_title(f"{MLABEL[mid]} — val macro-F1"); ax.set_xlabel("epoch"); ax.set_ylim(0, 1.02); ax.grid(alpha=.3)
    fig.suptitle(f"{fam_dir.name} — training curves", y=1.0, fontsize=12)
    fig.tight_layout()
    out = fig_path(assets, fam_dir.name, "curves.png")
    fig.savefig(out, dpi=110, bbox_inches="tight")
    plt.close(fig)
    lines.append(f"![training curves]({rel(md_dir, out)})")
    return True


# ----------------------------------------------------------- confusion ------
def plot_confusions(metrics, title, assets, md_dir, family, tag):
    models = [m for m in MODELS if m in metrics and metrics[m].get("confusion") is not None]
    if not models:
        return
    n = len(models)
    cols = 2
    rows = (n + 1) // 2
    fig, axes = plt.subplots(rows, cols, figsize=(10, 4.1 * rows), squeeze=False)
    for k, mid in enumerate(models):
        ax = axes[k // cols][k % cols]
        cm = np.array(metrics[mid]["confusion"], dtype=float)
        row = cm / np.maximum(cm.sum(1, keepdims=True), 1)
        im = ax.imshow(row, cmap="Blues", vmin=0, vmax=1)
        for r in range(cm.shape[0]):
            for c in range(cm.shape[1]):
                v = int(cm[r, c])
                ax.text(c, r, f"{v}\n{row[r, c]*100:.0f}%", ha="center", va="center",
                        fontsize=8, color="black" if row[r, c] < 0.6 else "white")
        ax.set_xticks(range(len(CLASSES)), CLASSES, rotation=20, ha="right", fontsize=8)
        ax.set_yticks(range(len(CLASSES)), CLASSES, fontsize=8)
        ax.set_xlabel("predicted"); ax.set_ylabel("true")
        ax.set_title(f"{MLABEL[mid]}", fontsize=9)
    for k in range(n, rows * cols):
        axes[k // cols][k % cols].axis("off")
    fig.suptitle(title, fontsize=12)
    fig.tight_layout()
    out = fig_path(assets, family, f"confusion_{tag}.png")
    fig.savefig(out, dpi=110, bbox_inches="tight")
    plt.close(fig)
    lines = [f"![confusions]({rel(md_dir, out)})"]
    return lines


# ------------------------------------------------------- reliability --------
def reliability(logits, true, n_bins=10):
    """Top-label reliability: returns (conf, acc, count) per bin + ECE."""
    p = softmax(logits)
    conf = p.max(1)
    pred = p.argmax(1)
    acc_bin = (pred == true).astype(float)
    edges = np.linspace(0, 1, n_bins + 1)
    out, ece = [], 0.0
    for b in range(n_bins):
        m = (conf > edges[b]) & (conf <= edges[b + 1]) if b else (conf >= edges[b]) & (conf <= edges[b + 1])
        if m.sum() == 0:
            out.append((np.nan, np.nan, 0)); continue
        c, a = conf[m].mean(), acc_bin[m].mean()
        out.append((c, a, int(m.sum())))
        ece += m.mean() * abs(a - c)
    return out, float(ece)


def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


def plot_reliability(fam_dir, assets, md_dir, lines):
    for split in ("test", "val"):
        npz = fam_dir / f"{split}_probas.npz"
        if not npz.exists():
            continue
        z = np.load(npz)
        true = z["true"]
        present = [m for m in MODELS[:3] if f"{m}_logits" in z.files]
        if not present:
            continue
        fig, axes = plt.subplots(1, len(present), figsize=(4.4 * len(present), 4.0), squeeze=False)
        for i, mid in enumerate(present):
            bins, ece = reliability(z[f"{m_logits(mid)}"], true)
            ax = axes[0][i]
            xs = [b[0] for b in bins if not np.isnan(b[0])]
            ys = [b[1] for b in bins if not np.isnan(b[1])]
            ax.plot([0, 1], [0, 1], "--", color="gray", lw=1)
            ax.plot(xs, ys, "-o", color="#1f77b4", ms=4)
            for bx, by, n in bins:
                if not np.isnan(bx):
                    ax.annotate(str(n), (bx, by), fontsize=6, textcoords="offset points", xytext=(4, -8), alpha=.6)
            ax.set_title(f"{MLABEL[mid]}  ECE={ece:.4f}", fontsize=9)
            ax.set_xlabel("confidence bin"); ax.set_ylabel("accuracy"); ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.grid(alpha=.3)
        fig.suptitle(f"{fam_dir.name} — {split} reliability (bin counts annotated)", fontsize=11)
        fig.tight_layout()
        out = fig_path(assets, fam_dir.name, f"reliability_{split}.png")
        fig.savefig(out, dpi=110, bbox_inches="tight")
        plt.close(fig)
        lines.append(f"![reliability {split}]({rel(md_dir, out)})")


def m_logits(mid):
    return f"{mid}_logits"


# ------------------------------------------------------------ tables --------
def metrics_table(metrics):
    rows = ["| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |",
            "|---|---|---|---|---|---|---|---|"]
    for m in MODELS:
        d = metrics.get(m)
        if not d:
            continue
        pc = d.get("per_class_f1", {}) or {}
        pcs = " ".join(f"{k.split()[0][:4]}={v:.3f}" for k, v in pc.items())
        auc = d.get("roc_auc_ovr", {})
        if isinstance(auc, dict) and auc:
            auc_s = f"{np.mean(list(auc.values())):.4f}"
        else:
            auc_s = fmt(auc)
        rows.append(f"| {MLABEL[m]} | {fmt(d.get('accuracy'))} | {fmt(d.get('balanced_accuracy'))} "
                    f"| {fmt(d.get('f1_macro'))} | {fmt(d.get('f1_weighted'))} | {fmt(d.get('mcc'))} "
                    f"| {pcs} | {auc_s} |")
    return rows


def config_table(cfg):
    if not cfg:
        return ["_no config.json_"]
    rows = ["| field | value |", "|---|---|"]
    for k, v in cfg.items():
        if isinstance(v, (str, int, float, bool)):
            rows.append(f"| {k} | {v} |")
        elif isinstance(v, list) and len(v) <= 8 and all(isinstance(x, (str, int)) for x in v):
            rows.append(f"| {k} | {', '.join(map(str, v))} |")
    return rows


# ------------------------------------------------------------ registry ------
def registry_section(lines):
    reg = jload_or_none_csv(BASE / "experiment_registry.csv")
    if not reg:
        return
    lines.append("## Experiment registry (all past runs)\n")
    lines.append("| exp_id | code | data split | test metrics | status |")
    lines.append("|---|---|---|---|---|")
    for r in reg:
        cell = lambda s: (s or "").replace("|", "/").replace("\n", " ")[:110]
        lines.append(f"| {cell(r.get('exp_id'))} | {cell(r.get('code'))} | {cell(r.get('data_split'))} "
                     f"| {cell(r.get('test_metrics'))} | {cell(r.get('status'))} |")
    lines.append("")


def jload_or_none_csv(p):
    try:
        import csv
        with open(p, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    except Exception:
        return None


# -------------------------------------------------------- varied eval -------
def varied_section(lines, assets, md_dir):
    res = jload(BASE / "reports" / "varied_eval_results.json")
    if not res:
        return
    items = res.get("rows", [])
    if not items:
        return
    lines.append("## Latest external robustness evaluation (`varied_eval`, fixed seed holdout)\n")
    lines.append(f"_seed={res.get('seed')}, images={res.get('n_images')}, predictions={len(items)}_\n")
    # expected-set correctness per model
    by_model, by_src = {}, {}
    fails = []
    for it in items:
        src = it.get("source", "?")
        exp = it.get("expected") or []
        m = it.get("model")
        pred, conf = it.get("pred"), it.get("conf")
        ok = pred in exp
        by_model.setdefault(m, [0, 0])
        by_model[m][1] += 1
        by_model[m][0] += int(ok)
        by_src.setdefault((m, src), [0, 0])
        by_src[(m, src)][1] += 1
        by_src[(m, src)][0] += int(ok)
        if not ok and m == "ensemble":
            fails.append((m, Path(it.get("path", "?")).name, src, pred, conf, exp))
    lines.append("### Overall (expected-set accuracy)\n")
    lines.append("| model | correct | total | accuracy |")
    lines.append("|---|---|---|---|")
    for m, (c, t) in sorted(by_model.items()):
        lines.append(f"| {MLABEL.get(m, m)} | {c} | {t} | {c/t*100:.1f}% |")
    lines.append("")
    srcs = sorted({s for _, s in by_src})
    lines.append("### Per-source × model\n")
    lines.append("| source | n | " + " | ".join(MLABEL.get(m, m) for m in MODELS if m in by_model) + " |")
    lines.append("|---|---|" + "---|" * len([m for m in MODELS if m in by_model]))
    for s in srcs:
        n = by_src.get(("ensemble", s), [0, 0])[1] or next(iter(by_src.values()))[1]
        row = [s, str(n)]
        for m in MODELS:
            if m in by_model:
                c, t = by_src.get((m, s), [None, None])
                row.append(f"{c/t*100:.0f}%" if c is not None else "-")
        lines.append("| " + " | ".join(row) + " |")
    lines.append("")
    # failure bar chart
    cnt = {}
    for m, name, src, pred, conf, exp in fails:
        if m != "ensemble":
            continue
        key = (src, str(pred))
        cnt[key] = cnt.get(key, 0) + 1
    if cnt:
        top = sorted(cnt.items(), key=lambda kv: -kv[1])[:14]
        fig, ax = plt.subplots(figsize=(9, 4.6))
        ax.barh([f"{k[0]} -> {k[1]}" for k, _ in top][::-1], [v for _, v in top][::-1], color="#d62728")
        ax.set_xlabel("count (ensemble, not in expected set)")
        ax.set_title("Varied eval — top ensemble failures")
        ax.grid(alpha=.3, axis="x")
        fig.tight_layout()
        out = fig_path(assets, "_varied", "failures.png")
        fig.savefig(out, dpi=110, bbox_inches="tight")
        plt.close(fig)
        lines.append(f"![varied failures]({rel(md_dir, out)})")
    lines.append("")


# ============================================================ main ==========
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(REPORTS / "TRAINING_REPORT.md"))
    ap.add_argument("--families", nargs="*", default=None,
                    help="limit to specific outputs_* dirs (default: all)")
    args = ap.parse_args()

    md_path = Path(args.out)
    md_dir = md_path.parent
    assets = md_path.parent / "training_report_assets"
    md_path.parent.mkdir(parents=True, exist_ok=True)

    families = sorted([p for p in BASE.glob("outputs_*") if p.is_dir()])
    if args.families:
        families = [BASE / f for f in args.families]

    L = []
    L.append("# PotatoDoc — full training report\n")
    L.append(f"Generated: {datetime.datetime.now():%Y-%m-%d %H:%M:%S} — "
             f"`python scripts/report_training.py` (idempotent; re-run after any train/retrain)\n")
    registry_section(L)

    # ---- cross-family comparison -------------------------------------------
    L.append("## Cross-family comparison\n")
    L.append("| family | train rows | test file(s) | ens acc | ens F1 | ens MCC | best single |")
    L.append("|---|---|---|---|---|---|---|")
    fam_summaries = []
    for fam in families:
        cfg = jload(fam / "config.json") or {}
        n_train = cfg.get("train_rows") or cfg.get("rows_train") or cfg.get("train_n")
        if not n_train and cfg.get("train_csv"):
            n_train = jload_or_none_csv(BASE / cfg["train_csv"])
            n_train = len(n_train) if n_train else "-"
        n_train = n_train or "-"
        mfile = fam / "metrics.json"
        m = jload(mfile) or {}
        tests = sorted(p.name for p in fam.glob("metrics*.json"))
        ens = m.get("ensemble") or {}
        singles = {k: (v or {}).get("f1_macro", 0) for k, v in m.items() if k != "ensemble"}
        best = max(singles, key=singles.get) if singles else "-"
        L.append(f"| {fam.name} | {n_train} | {', '.join(tests) or '-'} "
                 f"| {fmt(ens.get('accuracy'))} | {fmt(ens.get('f1_macro'))} | {fmt(ens.get('mcc'))} "
                 f"| {MLABEL.get(best, best)} {fmt(singles.get(best))} |")
        fam_summaries.append((fam, cfg, m))
    L.append("")

    # ---- per-family detailed sections --------------------------------------
    for fam, cfg, m in fam_summaries:
        L.append(f"---\n\n## {fam.name}\n")
        L.append("### Run configuration\n")
        L += config_table(cfg)
        L.append("")
        if plot_curves(fam, assets, md_dir, L) is None:
            L.append("_no history.json (not a trained family or training incomplete)_\n")
        else:
            L.append("")

        for mf in sorted(fam.glob("metrics*.json")):
            mm = jload(mf) or {}
            if not mm:
                continue
            tag = mf.stem.replace("metrics", "test").strip("_") or "main"
            title = f"Test results — {mf.name}"
            L.append(f"### {title}\n")
            L += metrics_table(mm)
            L.append("")
            cl = plot_confusions(mm, title, assets, md_dir, fam.name, tag)
            if cl:
                L += cl
                L.append("")

        cal = jload(fam / "calibration.json")
        if cal:
            L.append("### Calibration (temperature scaling, fitted on VAL only)\n")
            L.append("| model | T | ECE before | ECE after | Brier after |")
            L.append("|---|---|---|---|---|")
            for mid, d in (cal.get("models") or {}).items():
                L.append(f"| {MLABEL.get(mid, mid)} | {fmt(d.get('T'), 2)} | {fmt(d.get('ece_before'))} "
                         f"| {fmt(d.get('ece_after'))} | {fmt(d.get('brier_after'))} |")
            L.append("")
        rl = []
        plot_reliability(fam, assets, md_dir, rl)
        if rl:
            L.append("### Reliability (from saved probas)\n")
            L += rl
            L.append("")

    # ---- varied external eval ----------------------------------------------
    varied_section(L, assets, md_dir)

    L.append("---\n")
    L.append("**Regenerate:** `python D:\\Potato\\scripts\\report_training.py` — "
             "assets under `reports/training_report_assets/`.\n")

    md_path.write_text("\n".join(L), encoding="utf-8")
    print(f"report -> {md_path}")
    print(f"assets -> {assets}")


if __name__ == "__main__":
    main()
