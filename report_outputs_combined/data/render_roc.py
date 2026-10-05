import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, roc_auc_score

NPZ = r"D:\Potato\report_outputs_combined\data\test_probas.npz"
OUT = r"D:\Potato\report_outputs_combined\figures\roc_curves_test.png"
CLS = ["Early Blight", "Late Blight", "Healthy", "Non-Leaf"]
MODELS = [("small_cnn", "SmallCNN"), ("ensemble", "Ensemble")]

d = np.load(NPZ)
y = d["true"]
ens = np.mean([d[m + "_proba"] for m in ["small_cnn", "mobilenetv2", "efficientnetb0"]], axis=0)
probs = {"small_cnn": d["small_cnn_proba"], "ensemble": ens}

fig, axes = plt.subplots(1, 2, figsize=(11.5, 5.2), constrained_layout=True)
for ax, (key, name) in zip(axes, MODELS):
    p = probs[key]
    for i, c in enumerate(CLS):
        fpr, tpr, _ = roc_curve((y == i).astype(int), p[:, i])
        auc = roc_auc_score((y == i).astype(int), p[:, i])
        ax.plot(fpr, tpr, lw=2, label=f"{c} (AUC = {auc:.4f})")
    ax.plot([0, 1], [0, 1], ls="--", c="grey", lw=1, label="chance (AUC = 0.5)")
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)
    ax.set_aspect("equal")
    ax.set_xlabel("False Positive Rate", fontsize=11)
    ax.set_ylabel("True Positive Rate", fontsize=11)
    ax.set_title(f"{name} — macro AUC = {np.mean([roc_auc_score((y==i).astype(int), p[:,i]) for i in range(4)]):.4f}",
                 fontsize=12, fontweight="bold")
    ax.legend(loc="lower right", fontsize=8.5, framealpha=0.95)
    ax.grid(alpha=0.3)

fig.suptitle("Figure X — One-vs-rest ROC curves on the 276-sample test set (from test_probas.npz)",
             fontsize=13, fontweight="bold")
fig.savefig(OUT, dpi=200, facecolor="white")
print("saved:", OUT)
