import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

NPZ = r"D:\Potato\report_outputs_combined\data\test_probas.npz"
OUT = r"D:\Potato\report_outputs_combined\figures\probas_heatmap_test.png"
OUT2 = r"D:\Potato\report_outputs_combined\figures\ensemble_confusion_test.png"
CLASSES = ["Early Blight", "Late Blight", "Healthy", "Non-Leaf"]
MODELS = ["small_cnn", "mobilenetv2", "efficientnetb0"]
TITLES = ["SmallCNN", "MobileNetV2", "EfficientNet-B0"]

d = np.load(NPZ)
y = d["true"]
P = {m: d[m + "_proba"] for m in MODELS}

# ---------- Figure 1: probability heatmaps (rows sorted by true class) ----------
order = np.argsort(y, kind="stable")
fig, axes = plt.subplots(1, 3, figsize=(12.5, 7.2), constrained_layout=True)
for ax, m, t in zip(axes, MODELS, TITLES):
    pred = P[m].argmax(1)
    acc = (pred == y).mean()
    im = ax.imshow(P[m][order], aspect="auto", vmin=0, vmax=1, cmap="viridis")
    n = len(y)
    bounds = np.flatnonzero(np.diff(y[order])) + 1
    for b in bounds:
        ax.axhline(b - 0.5, color="w", lw=1.2)
    ax.set_title(f"{t}\naccuracy = {acc:.3f}", fontsize=11, fontweight="bold")
    ax.set_xlabel("predicted class probability")
    ax.set_xticks(range(4), CLASSES, rotation=35, ha="right", fontsize=9)
    ax.set_yticks([np.mean([0, bounds[0]]), np.mean([bounds[0], bounds[1]]),
                   np.mean([bounds[1], bounds[2]]), np.mean([bounds[2], n])],
                  CLASSES, fontsize=9)
axes[0].set_ylabel("test sample (sorted by true class)", fontsize=10)
cb = fig.colorbar(im, ax=axes, shrink=0.85, pad=0.015)
cb.set_label("P(class)", fontsize=10)
fig.suptitle("Figure: per-model prediction probabilities on the 276-sample test set",
             fontsize=13, fontweight="bold")
fig.savefig(OUT, dpi=200, facecolor="white")
plt.close(fig)

# ---------- Figure 2: soft-vote ensemble confusion matrix ----------
E = np.mean([P[m] for m in MODELS], axis=0)
yhat = E.argmax(1)
cm = confusion_matrix(y, yhat, labels=[0, 1, 2, 3])
fig, ax = plt.subplots(figsize=(5.6, 5.0), constrained_layout=True)
ConfusionMatrixDisplay(cm, display_labels=CLASSES).plot(
    ax=ax, cmap="Blues", colorbar=False, values_format="d")
ax.set_title(f"Soft-vote ensemble — test set (accuracy = {(yhat == y).mean():.3f})",
             fontsize=11, fontweight="bold")
ax.set_xlabel("predicted label", fontsize=10)
ax.set_ylabel("true label", fontsize=10)
plt.setp(ax.get_xticklabels(), rotation=35, ha="right", fontsize=9)
ax.set_yticklabels(CLASSES, fontsize=9)
fig.savefig(OUT2, dpi=200, facecolor="white")
plt.close(fig)

print("saved:", OUT)
print("saved:", OUT2)
