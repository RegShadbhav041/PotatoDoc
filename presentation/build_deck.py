#!/usr/bin/env python3
"""PotatoDoc — final year project deck (16:9, PowerPoint)."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image
import os

# ────────────────────────────── EDIT THESE ──────────────────────────────
TEAM = ["Aswin Panta", "Shadbhav Regmi", "Salina Kunwar"]
COURSE = "BIT"
TEACHER = "Er. Amrit Poudel"
SUBMITTED = "Submitted to Gandaki University"
# ───────────────────────────────────────────────────────────────────────

A = "/Users/admin/Desktop/PotatoDoc/presentation/assets"
S = "/tmp/shots"
OUT = "/Users/admin/Desktop/PotatoDoc/presentation/PotatoDoc-Presentation.pptx"

DEEP  = RGBColor(0x0D, 0x3B, 0x1F)
GREEN = RGBColor(0x2E, 0x9E, 0x4F)
LGREEN= RGBColor(0x57, 0xB8, 0x73)
MINT  = RGBColor(0xD6, 0xEC, 0xD1)
PALE  = RGBColor(0xEA, 0xF4, 0xEA)
PAPER = RGBColor(0xF7, 0xFA, 0xF7)
INK   = RGBColor(0x10, 0x23, 0x1A)
BODY  = RGBColor(0x3A, 0x51, 0x43)
GREY  = RGBColor(0x7E, 0x94, 0x86)
AMBER = RGBColor(0xD9, 0x83, 0x24)
RED   = RGBColor(0xC0, 0x39, 0x2B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

H_FONT = "Georgia"
B_FONT = "Calibri"

W, H = 13.333, 7.5

prs = Presentation()
prs.slide_width  = Inches(W)
prs.slide_height = Inches(H)
BLANK = prs.slide_layouts[6]


# ─────────────────────────────── helpers ───────────────────────────────
def new(bg=WHITE):
    s = prs.slides.add_slide(BLANK)
    r = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    r.fill.solid(); r.fill.fore_color.rgb = bg
    r.line.fill.background(); r.shadow.inherit = False
    return s


def rect(s, x, y, w, h, fill=None, line=None, lw=1.0, round_=False, adj=None):
    shp = s.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if round_ else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line; shp.line.width = Pt(lw)
    shp.shadow.inherit = False
    if round_ and adj is not None:
        try: shp.adjustments[0] = adj
        except Exception: pass
    return shp


def txt(s, x, y, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.06):
    """runs = [(text, size, bold, color, font)] or plain str."""
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    if isinstance(runs, str):
        runs = [(runs, 18, False, BODY, B_FONT)]
    if isinstance(runs, tuple):
        runs = [runs]
    for i, item in enumerate(runs):
        if item == "BR":
            tf.add_paragraph(); continue
        text, size, bold, color, font = item
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.bold = bold
        r.font.name = font; r.font.color.rgb = color
    return tb


def pic_fit(s, path, x, y, w, h, border=None):
    iw, ih = Image.open(path).size
    ar = iw / ih
    if w / h > ar:
        nh, nw = h, h * ar
    else:
        nw, nh = w, w / ar
    px, py = x + (w - nw) / 2, y + (h - nh) / 2
    if border is not None:
        rect(s, px - 0.04, py - 0.04, nw + 0.08, nh + 0.08, fill=WHITE, line=border, lw=1.2)
    return s.shapes.add_picture(path, Inches(px), Inches(py), Inches(nw), Inches(nh))


def header(s, kicker, title, n):
    rect(s, 0, 0, W, 0.10, fill=GREEN)
    txt(s, 0.72, 0.46, 9.5, 0.3, (kicker.upper(), 11.5, True, GREEN, B_FONT))
    txt(s, 0.72, 0.76, 11.4, 0.62, (title, 30, True, DEEP, H_FONT))
    rect(s, 0.72, 1.44, 1.5, 0.05, fill=MINT)
    footer(s, n)


def footer(s, n):
    txt(s, 0.72, 7.02, 6.0, 0.3, ("PotatoDoc  ·  Gandaki University", 9.5, False, GREY, B_FONT))
    txt(s, 11.6, 7.02, 1.0, 0.3, (f"{n:02d}", 10, True, GREEN, B_FONT), align=PP_ALIGN.RIGHT)


def notes(s, text):
    s.notes_slide.notes_text_frame.text = text


def card(s, x, y, w, h, title, lines, accent=GREEN, tsize=15, bsize=12.5):
    rect(s, x, y, w, h, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
    rect(s, x, y, 0.055, h, fill=accent)
    txt(s, x + 0.3, y + 0.24, w - 0.55, 0.4, (title, tsize, True, DEEP, H_FONT))
    body = []
    for i, l in enumerate(lines):
        body.append((l, bsize, False, BODY, B_FONT))
        if i != len(lines) - 1:
            body.append("BR")
    txt(s, x + 0.3, y + 0.74, w - 0.55, h - 1.0, body, spacing=1.22)


def stat(s, x, y, w, big, label, color=GREEN):
    rect(s, x, y, w, 1.28, fill=PALE, round_=True, adj=0.11)
    txt(s, x + 0.12, y + 0.16, w - 0.24, 0.6, (big, 30, True, color, H_FONT), align=PP_ALIGN.CENTER)
    txt(s, x + 0.12, y + 0.82, w - 0.24, 0.4, (label, 11.5, False, BODY, B_FONT), align=PP_ALIGN.CENTER)


# ═══════════════════════════ 01 · TITLE ═══════════════════════════
s = new()
s.shapes.add_picture(f"{A}/banner_title.png", 0, 0, prs.slide_width, prs.slide_height)
rect(s, 0, 0, W, 0.10, fill=GREEN)
s.shapes.add_picture(f"{A}/gu_logo_plate.png", Inches(0.62), Inches(0.5), Inches(2.35))
s.shapes.add_picture(f"{A}/potatodoc_logo_plate.png", Inches(11.35), Inches(0.44), Inches(1.35))

txt(s, 0.75, 2.02, 8.4, 0.3, ("FINAL YEAR PROJECT PRESENTATION", 12.5, True, MINT, B_FONT))
txt(s, 0.72, 2.42, 9.6, 1.3, ("PotatoDoc", 68, True, WHITE, H_FONT))
rect(s, 0.75, 3.72, 2.2, 0.05, fill=GREEN)
txt(s, 0.75, 3.98, 8.3, 1.0,
    ("Diagnosing potato leaf disease from a single phone photo — "
     "with Grad-CAM heatmaps that show why, and an honest “Unknown” "
     "when the photo is not a potato leaf at all.", 17, False, RGBColor(0xE8, 0xF4, 0xEA), B_FONT),
    spacing=1.3)

# team block
rect(s, 0.72, 5.34, 6.5, 1.42, fill=RGBColor(0x08, 0x2A, 0x16), round_=True, adj=0.09)
txt(s, 1.0, 5.5, 6.0, 0.3, ("PRESENTED BY", 10, True, LGREEN, B_FONT))
nm = []
for i, m in enumerate(TEAM):
    nm.append((m, 15.5, True, WHITE, H_FONT))
    if i != len(TEAM) - 1:
        nm.append("BR")
txt(s, 1.0, 5.82, 6.0, 0.9, nm, spacing=1.24)

rect(s, 7.5, 5.34, 5.1, 1.42, fill=RGBColor(0x08, 0x2A, 0x16), round_=True, adj=0.09)
txt(s, 7.78, 5.5, 4.6, 0.3, ("COURSE & REVIEW", 10, True, LGREEN, B_FONT))
txt(s, 7.78, 5.82, 4.55, 0.9,
    [(COURSE, 13, True, WHITE, B_FONT), "BR",
     (f"External teacher: {TEACHER}", 12.5, False, RGBColor(0xC9, 0xE6, 0xD1), B_FONT), "BR",
     (SUBMITTED, 11.5, False, RGBColor(0x9C, 0xC7, 0xA8), B_FONT)], spacing=1.2)

notes(s, f"""Good morning/afternoon, respected teacher and panel.

We are Team PotatoDoc — {TEAM[0]}, {TEAM[1]} and {TEAM[2]} — presenting our final year project for {COURSE}.

PotatoDoc is a phone application that helps farmers identify disease on a potato leaf using only a photograph. It tells the farmer what disease it thinks the leaf has, and it draws a coloured heatmap over the leaf so the farmer can see which part of the leaf made the system decide that.

One important point we want to state at the very beginning: the system is built to say "Unknown" rather than give a wrong answer. If the photo is not a potato leaf, or if the system is not confident, it refuses to guess. We believe this honesty is more useful to a farmer than a confident wrong answer.

We will take about twelve to fifteen minutes. We will first explain the problem, then the system design, then the machine learning results — including a weakness we found and are reporting openly — and finally the application and our future work.""")


# ═══════════════════════════ 02 · PROBLEM ═══════════════════════════
s = new()
header(s, "01 · The problem", "Why this project exists", 2)

txt(s, 0.72, 1.72, 6.0, 1.5,
    [("Potato is a staple food crop in Nepal, but two diseases — "
      "Early Blight and Late Blight — can destroy a field within days.",
      17, False, BODY, B_FONT)], spacing=1.3)

facts = [
    ("Farmer", "Usually cannot tell Early Blight from Late Blight without an expert standing in the field."),
    ("Wrong call", "The wrong fungicide is sprayed. Money is wasted and the crop is still lost."),
    ("No access", "Agricultural experts are not available in every village, and travel takes time."),
    ("Too late", "By the time help arrives, the infection has already spread to neighbouring plants."),
]
y = 3.16
for t, b in facts:
    card(s, 0.72, y, 6.0, 0.86, t, [b], tsize=13.5, bsize=12)
    y += 0.98

rect(s, 7.15, 1.72, 5.45, 4.7, fill=PAPER, round_=True, adj=0.05)
txt(s, 7.5, 2.02, 4.8, 0.4, ("The gap we are closing", 16, True, DEEP, H_FONT))
gaps = [
    ("Speed", "An answer in seconds, straight from the farmer's own phone."),
    ("Cost", "No lab test, no expert visit, no extra equipment."),
    ("Explainability", "A heatmap shows which part of the leaf drove the decision."),
    ("Honesty", "Says “Unknown” instead of inventing a disease."),
]
yy = 2.62
for t, b in gaps:
    rect(s, 7.5, yy + 0.06, 0.16, 0.16, fill=GREEN, round_=True, adj=0.5)
    txt(s, 7.82, yy, 4.5, 0.3, (t, 13.5, True, DEEP, B_FONT))
    txt(s, 7.82, yy + 0.3, 4.5, 0.5, (b, 12.5, False, BODY, B_FONT), spacing=1.18)
    yy += 0.96

notes(s, f"""Let us start with the problem.

Potato is one of the most important food crops for Nepali farmers. Two diseases, Early Blight and Late Blight, spread very quickly. In a bad season they can take out a whole field in a matter of days.

The difficulty is that these two diseases look similar to the untrained eye. When a farmer picks the wrong treatment, they spend money on the wrong chemical and still lose the crop. In many villages there is no agricultural expert nearby, and by the time someone visits, the infection has already moved to the next plants.

So the four things we wanted to give the farmer are: speed — an answer in seconds; cost — no lab test and no equipment; explainability — a heatmap that shows the reason; and honesty — the system must say "Unknown" rather than guess.

{TEAM[0]} will now walk us through what we actually built.""")


# ═══════════════════════════ 03 · OBJECTIVES ═══════════════════════════
s = new()
header(s, "02 · Objectives", "What PotatoDoc delivers", 3)

objs = [
    ("01", "Diagnose from a photo", "Take or choose a photo of a potato leaf and return one of four labels: Early Blight, Late Blight, Healthy, or Non-Leaf.", GREEN),
    ("02", "Explain the decision", "Draw a Grad-CAM heatmap over the image so the farmer can see the region that influenced the prediction.", LGREEN),
    ("03", "Refuse to guess", "A three-layer safety check rejects photos that are not leaves or that the model is unsure about, answering “Unknown”.", AMBER),
    ("04", "Run in the field", "A production Android app with history, disease reference, news, location advisories and a support chat.", GREEN),
    ("05", "Stay accountable", "A superadmin console that monitors real usage — farmers, diagnoses, notices, tickets and model performance.", DEEP),
]
x = 0.72
for i, (n, t, b, c) in enumerate(objs):
    col, row = i % 3, i // 3
    cx = 0.72 + col * 4.13
    cy = 1.78 + row * 2.42
    w = 3.86
    rect(s, cx, cy, w, 2.16, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
    rect(s, cx, cy, w, 0.05, fill=c)
    txt(s, cx + 0.26, cy + 0.24, 1.0, 0.4, (n, 22, True, c, H_FONT))
    txt(s, cx + 0.26, cy + 0.72, w - 0.5, 0.4, (t, 14.5, True, DEEP, H_FONT))
    txt(s, cx + 0.26, cy + 1.14, w - 0.5, 0.9, (b, 12, False, BODY, B_FONT), spacing=1.2)

rect(s, 8.98, 4.2, 3.64, 2.16, fill=PALE, round_=True, adj=0.07)
txt(s, 9.24, 4.44, 3.1, 0.4, ("Four labels", 14.5, True, DEEP, H_FONT))
lbls = [("Early Blight", AMBER), ("Late Blight", RED), ("Healthy", GREEN), ("Non-Leaf (reject)", GREY)]
ly = 4.92
for name, c in lbls:
    rect(s, 9.26, ly + 0.05, 0.15, 0.15, fill=c, round_=True, adj=0.5)
    txt(s, 9.54, ly, 2.9, 0.3, (name, 12.5, False, BODY, B_FONT))
    ly += 0.34

notes(s, f"""Here are the five objectives we set for ourselves.

First, diagnose from a photo. The system returns one of four answers: Early Blight, Late Blight, Healthy, or Non-Leaf, meaning it is not a leaf at all.

Second, explain the decision. This is important for trust. The app draws a Grad-CAM heatmap over the leaf, so the farmer is not just told an answer — they can see the spot on the leaf that caused it.

Third, refuse to guess. We built a three-layer safety check. If the photo has no green content, if the model thinks it is not a leaf, or if the model is simply unsure, the app answers "Unknown". This is the design decision we are most proud of.

Fourth, run in the field. This is a real Android application with scan history, a disease reference, news, location advisories and a support chat.

Fifth, stay accountable. The superadmin console lets us monitor real usage — how many farmers, how many diagnoses, which model was used, and any support tickets.

The next two slides show how the whole system fits together.""")


# ═══════════════════════════ 04 · SYSTEM FLOW ═══════════════════════════
s = new()
header(s, "03 · Architecture", "System flow — from photo to answer", 4)
pic_fit(s, f"{A}/flow.png", 0.6, 1.62, 12.13, 5.1, border=RGBColor(0xDD, 0xE7, 0xDF))

notes(s, f"""This is the complete system flow, read from left to right.

The farmer opens the React Native Android app and takes a photo. The photo is sent over HTTPS to a Cloudflare named tunnel. Using a tunnel means the server has no open port — nothing is exposed directly to the internet, which is much safer than opening a firewall port.

The tunnel delivers the request to our FastAPI backend. The backend first checks the user's JWT token, then passes the photo into the inference pipeline.

Inside the pipeline, the photo goes through three safety gates in order: a green-pixel check, a trained Non-Leaf classifier, and an entropy rule that measures uncertainty. If any gate rejects, the answer is "Unknown". If all three pass, the photo goes to a soft-vote ensemble of three neural networks. The ensemble averages their probability outputs and also produces a Grad-CAM heatmap.

The result comes back as JSON — the label, the confidence, which model was used, and the heatmap image — and the phone displays it.

On the bottom path you can see the second client: the superadmin console in a browser. It uses the same backend with a superadmin token and reads and writes users, notices and tickets.

I will now hand over to {TEAM[1]}, who will explain how the backend code itself is organised.""")


# ═══════════════════════════ 05 · CLASS DIAGRAM ═══════════════════════════
s = new()
header(s, "04 · Backend", "Class and module structure", 5)
pic_fit(s, f"{A}/classes.png", 0.6, 1.62, 12.13, 5.1, border=RGBColor(0xDD, 0xE7, 0xDF))

notes(s, f"""This is the structure of our backend code, drawn as a UML-style class diagram.

The green box in the centre is InferenceService in app.py. It owns the loaded models, caches them so they are only loaded once, and exposes the functions that matter: loading a model, computing probabilities, generating the Grad-CAM overlay, measuring the green ratio for gate one, and measuring entropy for gate three.

The dark green box on the left is the User class. It holds the farmer's contact, name, role and password hash. Note that we never store a plain password — we hash it with PBKDF2. The two functions marked "guard", require_user and require_superadmin, protect every protected route.

Diagnosis in history.py records every prediction with its confidence and which model produced it. Notice is the farmer-facing news feed, and Ticket with TicketMessage is the two-way support chat. MediaStore in media.py saves uploaded images using content addressing and includes a safe_join function specifically to prevent path traversal attacks — a common security hole.

The three dashed boxes at the bottom are supporting modules: location advisories, the admin router layer, and the SQLite schema in db.py.

The key architectural decision here is that we use plain SQLite with no ORM. It keeps the code small and easy to understand, which matters for a student project that someone else has to read later.""")


# ═══════════════════════════ 06 · GATES ═══════════════════════════
s = new()
header(s, "05 · Safety design", "Three gates before any answer", 6)

txt(s, 0.72, 1.7, 11.9, 0.5,
    ("A wrong diagnosis is worse than no diagnosis. Every photo must pass three "
     "independent checks before the models are even consulted.", 15, False, BODY, B_FONT), spacing=1.25)

gates = [
    ("Gate 1", "Green-pixel check", "If the image has almost no green content it cannot be a leaf. Cheap, fast, and it filters out walls, floors and paperwork before any model runs.", "green_ratio(img) > threshold", GREEN),
    ("Gate 2", "Trained Non-Leaf class", "Non-Leaf is a real fourth training class, so the network has learned what a non-leaf looks like — people, dogs, buildings, soil.", "argmax includes “Non-Leaf”", LGREEN),
    ("Gate 3", "Entropy rule", "If the probability spread is too flat, the model is unsure. We return Unknown rather than picking the highest of four uncertain numbers.", "norm_entropy(p) < τ", AMBER),
]
x = 0.72
for i, (k, t, b, code, c) in enumerate(gates):
    cx = 0.72 + i * 4.13
    rect(s, cx, 2.42, 3.86, 2.7, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.06)
    rect(s, cx, 2.42, 3.86, 0.44, fill=c, round_=True, adj=0.4)
    txt(s, cx, 2.5, 3.86, 0.3, (k, 12.5, True, WHITE, B_FONT), align=PP_ALIGN.CENTER)
    txt(s, cx + 0.28, 3.02, 3.3, 0.4, (t, 15, True, DEEP, H_FONT))
    txt(s, cx + 0.28, 3.5, 3.3, 1.2, (b, 12, False, BODY, B_FONT), spacing=1.2)
    rect(s, cx + 0.28, 4.66, 3.3, 0.36, fill=PALE, round_=True, adj=0.2)
    txt(s, cx + 0.28, 4.74, 3.3, 0.3, (code, 11, True, DEEP, B_FONT), align=PP_ALIGN.CENTER)
    if i < 2:
        txt(s, cx + 3.88, 3.5, 0.28, 0.4, ("→", 20, True, GREY, B_FONT), align=PP_ALIGN.CENTER)

rect(s, 0.72, 5.4, 11.9, 1.1, fill=PALE, round_=True, adj=0.12)
txt(s, 1.05, 5.58, 3.3, 0.4, ("If any gate fails", 15, True, DEEP, H_FONT))
txt(s, 1.05, 5.98, 5.4, 0.4, ("the response is “Unknown” — never a guessed disease.", 13.5, False, BODY, B_FONT))
rect(s, 6.9, 5.6, 0.02, 0.72, fill=RGBColor(0xCF, 0xE0, 0xD3))
txt(s, 7.3, 5.58, 5.0, 0.4, ("If all three pass", 15, True, DEEP, H_FONT))
txt(s, 7.3, 5.98, 5.2, 0.4, ("the ensemble answers and Grad-CAM explains why.", 13.5, False, BODY, B_FONT))

notes(s, f"""Now let us explain the most important design decision in the project: the three safety gates.

Gate one is the green-pixel check. It is very cheap — we simply measure how much of the image is green. If there is almost no green, it cannot be a leaf, so we reject immediately. This filters out walls, floors, paperwork and photographs of people before we spend any compute on the neural networks.

Gate two is a trained Non-Leaf class. We did not just write a rule — we trained the network on a fourth class called Non-Leaf, so it has actually learned what a non-leaf looks like: people, dogs, buildings, soil, sky.

Gate three is the entropy rule. Entropy measures how spread out the model's probabilities are. If the four probabilities are all close to each other, the model is guessing. In that case we return "Unknown" rather than taking the highest of four uncertain numbers and presenting it as fact.

Only when all three gates pass do we let the ensemble answer. And when any gate fails, the farmer sees "Unknown" — never a wrong disease name.

{TEAM[1]} will now introduce the three neural networks behind that answer.""")


# ═══════════════════════════ 07 · MODELS ═══════════════════════════
s = new()
header(s, "06 · Machine learning", "Three models, one answer", 7)

mods = [
    ("Small CNN", "Built from scratch", "A compact convolutional network we trained ourselves. Fast, small, and a useful baseline to compare the others against.", "96.33%"),
    ("MobileNetV2", "Transfer learning", "A mobile-optimised network pretrained on ImageNet and fine-tuned on our potato data. Efficient enough to run cheaply.", "99.90%"),
    ("EfficientNet-B0", "Transfer learning", "A balanced accuracy/size architecture, also fine-tuned. The strongest single model in our cross-source test.", "99.90%"),
]
for i, (t, sub, b, acc) in enumerate(mods):
    cx = 0.72 + i * 4.13
    rect(s, cx, 1.76, 3.86, 2.5, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
    rect(s, cx, 1.76, 3.86, 0.05, fill=GREEN)
    txt(s, cx + 0.28, 2.02, 3.3, 0.4, (t, 16, True, DEEP, H_FONT))
    txt(s, cx + 0.28, 2.44, 3.3, 0.3, (sub.upper(), 10, True, GREEN, B_FONT))
    txt(s, cx + 0.28, 2.82, 3.3, 1.0, (b, 12, False, BODY, B_FONT), spacing=1.2)
    txt(s, cx + 0.28, 3.82, 3.3, 0.4, (acc, 24, True, GREEN, H_FONT))

rect(s, 0.72, 4.52, 5.9, 1.98, fill=DEEP, round_=True, adj=0.08)
txt(s, 1.05, 4.76, 5.3, 0.4, ("Soft-vote ensemble", 17, True, WHITE, H_FONT))
txt(s, 1.05, 5.2, 5.3, 1.1,
    ("Instead of trusting one network, we average the class probabilities from all three "
     "and take the majority view. The ensemble is what the app serves by default.",
     13, False, RGBColor(0xC9, 0xE6, 0xD1), B_FONT), spacing=1.25)

rect(s, 6.9, 4.52, 5.72, 1.98, fill=PAPER, round_=True, adj=0.08)
txt(s, 7.22, 4.76, 5.1, 0.4, ("Grad-CAM explanation", 17, True, DEEP, H_FONT))
txt(s, 7.22, 5.2, 5.1, 1.1,
    ("We take gradients from the final convolutional layer and build a heatmap over the "
     "image, so the app can show the farmer which patches drove the decision.",
     13, False, BODY, B_FONT), spacing=1.25)

notes(s, f"""We use three neural networks, and we deliberately chose three different kinds.

Small CNN is a network we built and trained from scratch. It is small and fast, and it gives us a baseline: if a simple network can do this well, we know the problem is learnable.

MobileNetV2 is a network designed for phones. It was pretrained on ImageNet — millions of everyday images — and then we fine-tuned it on our potato leaf data. This is called transfer learning: we reuse knowledge the network already has.

EfficientNet-B0 is a more carefully balanced architecture between accuracy and size. In our harder cross-source test it was actually the strongest single model.

Rather than trusting one network, we use a soft-vote ensemble. We average the probability outputs of all three networks and take the majority view. This reduces the chance that one model's mistake becomes the final answer. The ensemble is what the app serves by default.

Finally, Grad-CAM. We take the gradients from the last convolutional layer and turn them into a heatmap that is drawn over the leaf. That is what lets the farmer see the reasoning, not just the result.

The numbers on these cards are from our standard held-out test. {TEAM[1]} will now show what happened when we tested on a much harder, completely separate dataset.""")


# ═══════════════════════════ 08 · DOMAIN GAP ═══════════════════════════
s = new()
header(s, "07 · Results", "The honest gap", 8)
pic_fit(s, f"{A}/chart_domain_gap.png", 0.6, 1.6, 8.6, 4.9, border=RGBColor(0xDD, 0xE7, 0xDF))

rect(s, 9.45, 1.7, 3.2, 1.5, fill=DEEP, round_=True, adj=0.1)
txt(s, 9.6, 1.9, 2.9, 0.6, ("99.9%", 32, True, WHITE, H_FONT), align=PP_ALIGN.CENTER)
txt(s, 9.6, 2.56, 2.9, 0.5, ("in-distribution\nheld-out test", 11.5, False, RGBColor(0xA8, 0xD3, 0xB4), B_FONT), align=PP_ALIGN.CENTER)

rect(s, 9.45, 3.36, 3.2, 1.5, fill=AMBER, round_=True, adj=0.1)
txt(s, 9.6, 3.56, 2.9, 0.6, ("46.5%", 32, True, WHITE, H_FONT), align=PP_ALIGN.CENTER)
txt(s, 9.6, 4.22, 2.9, 0.5, ("cross-source\nPlantDoc test", 11.5, False, RGBColor(0xFF, 0xE9, 0xD4), B_FONT), align=PP_ALIGN.CENTER)

rect(s, 9.45, 5.02, 3.2, 1.5, fill=PALE, round_=True, adj=0.1)
txt(s, 9.62, 5.2, 2.86, 1.2,
    ("Same models, same weights — only the photo source changed.",
     13, True, DEEP, B_FONT), align=PP_ALIGN.CENTER, spacing=1.2)

notes(s, f"""This is the most honest slide in our presentation.

On the left you see our standard held-out test: the same kind of images our training data came from. There, our models score 96 to 99.9 percent. That number is real, but on its own it is not very meaningful, because the test photos look like the training photos.

On the right we tested on PlantDoc — a completely separate dataset, taken by different people, with different cameras, in different fields and lighting. The models had never seen a single one of these images.

Accuracy drops to 46.5 percent overall.

We want to be very clear about this. We are showing you the weaker number on purpose. Any project can report a flattering number from a test set that resembles its training set. The interesting and useful finding is the gap itself: a model that looks perfect in the lab can fall apart the moment the photo comes from a different source.

Notice also that EfficientNet-B0, at 50.9 percent, beats the ensemble at 46.5 percent on this harder test. That tells us our default model choice should change.

{TEAM[1]} will now break down exactly where the failures happen.""")


# ═══════════════════════════ 09 · RECALL ═══════════════════════════
s = new()
header(s, "08 · Analysis", "Where the model still fails", 9)
pic_fit(s, f"{A}/chart_recall.png", 0.6, 1.6, 8.2, 4.9, border=RGBColor(0xDD, 0xE7, 0xDF))

rect(s, 9.1, 1.7, 3.55, 2.3, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
txt(s, 9.4, 1.96, 3.0, 0.4, ("The main confusion", 15, True, DEEP, H_FONT))
txt(s, 9.4, 2.44, 3.0, 1.4,
    ("25 of 40 Early Blight images were called Late Blight. The two diseases "
     "share the same visual pattern — dark concentric rings — and the model "
     "learns the easier one first.", 12.5, False, BODY, B_FONT), spacing=1.22)

rect(s, 9.1, 4.16, 3.55, 2.34, fill=PALE, round_=True, adj=0.07)
txt(s, 9.4, 4.42, 3.0, 0.4, ("What would fix it", 15, True, DEEP, H_FONT))
fixes = [
    "More Early Blight field photos, not lab images",
    "Augmentation tuned to ring texture",
    "Class-balanced loss during training",
    "Switch the default model to EfficientNet-B0",
]
fy = 4.9
for f in fixes:
    rect(s, 9.42, fy + 0.06, 0.13, 0.13, fill=GREEN, round_=True, adj=0.5)
    txt(s, 9.66, fy, 2.7, 0.4, (f, 11.5, False, BODY, B_FONT), spacing=1.15)
    fy += 0.4

notes(s, f"""This chart shows recall — of all the images that really were a certain disease, how many we got right.

Late Blight is learned reasonably well at 75 percent. Early Blight is only 37.5 percent, and Non-Leaf is 23.5 percent.

Looking at the confusion table explains why. Out of 40 genuine Early Blight images, the model called 25 of them Late Blight. Both diseases produce dark rings on the leaf, and the model has learned the Late Blight pattern more strongly, so when it sees rings it defaults to Late Blight.

On the right we list what we would do about it. The most important point is the first one: we need more real Early Blight photographs taken in fields, not clean laboratory images. Augmentation specifically designed for ring texture would also help, as would class-balanced loss during training.

We would also change the default model. On this harder test, EfficientNet-B0 at 50.9 percent beat the ensemble at 46.5 percent, so the ensemble is not automatically the right choice.

{TEAM[2]} will now summarise the limitations in full, before we show the application.""")


# ═══════════════════════════ 10 · LIMITATIONS ═══════════════════════════
s = new()
header(s, "09 · Limitations", "What we are not claiming", 10)

lims = [
    ("No Healthy class", "PlantDoc has no valid healthy-potato annotations, so our hardest test "
     "cannot measure the Healthy class at all. We can only report on the three classes it contains.", RED),
    ("Open-set leak", "18 of 34 Non-Leaf images — 52.9 percent — still received a "
     "disease label instead of Unknown. The rejection layer is a start, not a solved problem.", AMBER),
    ("Macro F1 is low", "0.330 on the cross-source test. A high overall accuracy number would hide "
     "this, which is why we report F1 alongside it.", AMBER),
    ("Domain shift", "Accuracy depends heavily on camera, lighting and field. A model validated in a "
     "lab cannot be assumed to work in a farmer's hand.", RED),
]
x = 0.72
for i, (t, b, c) in enumerate(lims):
    col, row = i % 2, i // 2
    cx = 0.72 + col * 6.1
    cy = 1.78 + row * 1.86
    rect(s, cx, cy, 5.83, 1.66, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
    rect(s, cx, cy, 0.055, 1.66, fill=c)
    txt(s, cx + 0.3, cy + 0.22, 5.3, 0.4, (t, 15.5, True, DEEP, H_FONT))
    txt(s, cx + 0.3, cy + 0.66, 5.3, 0.9, (b, 12, False, BODY, B_FONT), spacing=1.2)

rect(s, 0.72, 5.6, 11.9, 1.0, fill=DEEP, round_=True, adj=0.14)
txt(s, 1.1, 5.78, 11.2, 0.7,
    ("We report these numbers because a system that cannot say “I do not know” "
     "is not safe to put in a farmer's hands. These are known weaknesses, not surprises.",
     14, False, RGBColor(0xE8, 0xF4, 0xEA), B_FONT), align=PP_ALIGN.CENTER, spacing=1.2)

notes(s, f"""We want to state our limitations clearly, because this is where an honest engineering report matters.

First, the PlantDoc dataset has no valid healthy-potato annotations. That means our hardest test cannot measure the Healthy class at all. We can only report the three classes it actually contains.

Second, and more serious: out of 34 genuine Non-Leaf images, 18 of them — 52.9 percent — still received a disease label instead of "Unknown". Our rejection layer is a real improvement over having nothing, but it is not solved, and we are not pretending otherwise.

Third, the macro F1 score is 0.330 on this cross-source test. We deliberately quote F1 next to accuracy, because a single accuracy number can look reasonable while the model is actually failing badly on one class.

Fourth, and the root cause of all of this: domain shift. Accuracy depends heavily on the camera, the lighting and the field. A model validated in a laboratory cannot simply be assumed to work in a farmer's hand.

We show these openly because a system that cannot say "I do not know" is not safe to put in front of a farmer. These are known weaknesses we have documented, not surprises we discovered afterwards.

Now let us show you what the application actually looks like.""")


# ═══════════════════════════ 11 · APP ═══════════════════════════
s = new()
header(s, "10 · Application", "The Android app", 11)

APP_SHOTS = [f"{S}/app_home.png", f"{S}/app_diagnose.png", f"{S}/app_result.png"]
have = [p for p in APP_SHOTS if os.path.exists(p)]

if have:
    txt(s, 0.72, 1.7, 11.9, 0.4,
        ("Captured on OPPO CPH2469 · Android 14 · API 34", 12.5, False, GREY, B_FONT))
    x = 0.9
    for p in have:
        pic_fit(s, p, x, 2.15, 3.7, 4.3, border=RGBColor(0xDD, 0xE7, 0xDF))
        x += 3.95
else:
    feats = [
        ("Diagnose", "Camera or gallery photo, model selector, instant label and confidence.", GREEN),
        ("Grad-CAM", "The heatmap overlay is rendered on the phone, so the farmer can zoom into the hot region.", LGREEN),
        ("History", "The last 50 diagnoses are stored locally and survive an app restart.", DEEP),
        ("Reference", "A built-in guide to each disease with symptoms and treatment steps, readable offline.", GREEN),
        ("Support", "A two-way chat with the superadmin, plus news, location advisories and profile.", AMBER),
    ]
    x = 0.72
    for i, (t, b, c) in enumerate(feats):
        col, row = i % 3, i // 3
        cx = 0.72 + col * 4.13
        cy = 1.86 + row * 2.46
        rect(s, cx, cy, 3.86, 2.2, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
        rect(s, cx, cy, 3.86, 0.05, fill=c)
        txt(s, cx + 0.28, cy + 0.3, 3.3, 0.4, (t, 16, True, DEEP, H_FONT))
        txt(s, cx + 0.28, cy + 0.8, 3.3, 1.2, (b, 12.5, False, BODY, B_FONT), spacing=1.22)
    txt(s, 0.72, 6.6, 11.9, 0.35,
        ("Built with React Native (Expo) — one codebase, native Android build.",
         12.5, False, GREY, B_FONT))

notes(s, f"""This is the product the farmer actually holds.

The app is built with React Native and Expo, so we write one codebase and build a native Android application from it. It runs entirely on its own — no laptop, no desktop, no internet required for the interface itself.

On the Diagnose screen the farmer can either take a photo or pick one from the gallery. They can also choose which model to use — the ensemble by default, or any single network for comparison.

When a diagnosis returns, the app shows the label, the confidence percentage, and a Grad-CAM heatmap drawn directly over the leaf. The farmer can zoom into the hottest region to see exactly which spot on the leaf caused the decision.

History keeps the last 50 diagnoses stored locally on the phone, and it is crash-safe — if the app is killed, the records are still there afterwards.

There is also a reference section explaining each disease with symptoms and treatment steps, which works offline, plus a support chat that connects the farmer directly to the superadmin, news, location advisories and profile management.

{TEAM[2]} will now show the side the administrators see.""")


# ═══════════════════════════ 12 · CONSOLE ═══════════════════════════
s = new()
header(s, "11 · Operations", "The superadmin console", 12)

pic_fit(s, f"{S}/console_dashboard.png", 0.72, 1.68, 8.5, 4.0, border=RGBColor(0xDD, 0xE7, 0xDF))
txt(s, 0.72, 5.78, 8.5, 0.3,
    ("Live production dashboard — potatodoc.shadbhavregmi.com.np/admin",
     11.5, False, GREY, B_FONT), align=PP_ALIGN.CENTER)

side = [
    ("Users", "Farmer accounts, roles and suspension — with a per-farmer detail view."),
    ("Notices", "Publish advisories with images straight to every phone."),
    ("Tickets", "A two-way support thread; a farmer reply reopens a resolved ticket."),
    ("Models", "Live inventory of every served model and which one is the default."),
]
sy = 1.72
for t, b in side:
    rect(s, 9.5, sy, 3.12, 1.16, fill=PAPER, round_=True, adj=0.1)
    txt(s, 9.74, sy + 0.16, 2.7, 0.3, (t, 13.5, True, DEEP, H_FONT))
    txt(s, 9.74, sy + 0.48, 2.7, 0.6, (b, 11, False, BODY, B_FONT), spacing=1.16)
    sy += 1.26

notes(s, f"""The app is only half of a real system. The other half is this superadmin console, which runs in an ordinary browser.

This screenshot is not a mockup — it is the live production dashboard at our public URL.

At the top you can see the real numbers: 10 farmer accounts, 10 active sessions, and 106 diagnoses recorded so far. Below that, two charts. On the left, the disease class mix — Early Blight is the most common, which matches what we would expect in the field. On the right, model usage, showing that most farmers are served by the ensemble.

Underneath we can see the newest farmers and the most recent diagnoses with their confidence scores.

On the right-hand side are the four other sections. Users handles farmer accounts, roles and suspension, with a detailed view for each farmer. Notices lets an administrator publish advisories with images directly to every phone. Tickets is a two-way support conversation — and importantly, if a farmer replies to a resolved ticket, it automatically reopens. Models shows the live inventory of every served model and which one is currently the default.

Everything on this page is protected by the superadmin role check we showed in the class diagram.""")


# ═══════════════════════════ 13 · PRODUCTION ═══════════════════════════
s = new()
header(s, "12 · In production", "Real usage, not a demo", 13)
pic_fit(s, f"{A}/chart_production.png", 0.6, 1.7, 9.1, 4.7, border=RGBColor(0xDD, 0xE7, 0xDF))

st = [("106", "diagnoses\nrecorded"), ("10", "farmer\naccounts"), ("4", "models\nserved")]
sy = 1.86
for big, lab in st:
    stat(s, 9.95, sy, 2.7, big, lab)
    sy += 1.46

rect(s, 9.95, 6.24, 2.7, 0.6, fill=DEEP, round_=True, adj=0.24)
txt(s, 9.95, 6.38, 2.7, 0.35, ("smoke-tested live", 12, True, WHITE, B_FONT), align=PP_ALIGN.CENTER)

notes(s, f"""We want to make the point that this is not a demo that only works on our laptops.

These numbers come straight from the production dashboard. There have been 106 diagnoses recorded, across 10 farmer accounts, and the system is serving four different models.

Looking at the disease class mix: Early Blight appears 52 times, Late Blight 35 and Healthy 15. Early Blight being the most common matches what we expect from real field data.

Looking at model usage: the ensemble handled 51 predictions, EfficientNet-B0 handled 19, MobileNetV2 17 and the Small CNN 16. Farmers can switch between models in the app, and every choice is logged, so we can compare how the models behave in real use rather than only in a test set.

The small "smoke" entries are from our automated smoke test — a script that runs against the live server and confirms the whole pipeline still works after every change.

This is the evidence that the system works end to end: a real Android app, a real server behind a real tunnel, and real traffic.""")


# ═══════════════════════════ 14 · ENGINEERING ═══════════════════════════
s = new()
header(s, "13 · Quality", "Engineering behind the project", 14)

cards = [
    ("171 + 23", "automated tests", "171 backend tests covering auth, gates, history, notices and tickets, plus 23 mobile UI tests.", GREEN),
    ("58 / 59", "emulator campaign", "A 59-case automated UI-to-API cross-check. The single failure was a known environmental issue, not a logic bug.", LGREEN),
    ("No open port", "Cloudflare named tunnel", "The server is reachable only through the tunnel, so nothing is exposed directly to the internet.", DEEP),
    ("PBKDF2", "password storage", "Passwords are never stored in plain text; every protected route is guarded by require_user.", GREEN),
    ("Path-safe", "media uploads", "Content-addressed storage with safe_join, specifically to block path traversal attacks.", AMBER),
    ("Versioned", "static assets", "Admin assets carry a cache-busting query so a CDN can never serve a stale stylesheet.", GREY),
]
for i, (big, lab, b, c) in enumerate(cards):
    col, row = i % 3, i // 3
    cx = 0.72 + col * 4.13
    cy = 1.8 + row * 2.44
    rect(s, cx, cy, 3.86, 2.18, fill=WHITE, line=RGBColor(0xDD, 0xE7, 0xDF), lw=1.0, round_=True, adj=0.07)
    rect(s, cx, cy, 3.86, 0.05, fill=c)
    txt(s, cx + 0.28, cy + 0.26, 3.3, 0.5, (big, 22, True, c, H_FONT))
    txt(s, cx + 0.28, cy + 0.78, 3.3, 0.3, (lab.upper(), 10, True, GREY, B_FONT))
    txt(s, cx + 0.28, cy + 1.16, 3.3, 0.9, (b, 11.5, False, BODY, B_FONT), spacing=1.2)

notes(s, f"""A project is not finished when it runs once — it is finished when it keeps running.

We wrote 171 automated tests for the backend covering authentication, the three safety gates, history, notices and tickets, plus 23 mobile UI tests. On top of that we ran a 59-case automated emulator campaign that checks the user interface against the API. 58 of 59 passed, and the one failure was a known environment issue, not a logic error.

On security: the server runs behind a Cloudflare named tunnel, which means there is no open port on the machine at all. Nothing is exposed directly to the internet. Passwords are stored hashed with PBKDF2, never in plain text, and every protected route is guarded by require_user or require_superadmin. Uploaded images use content-addressed storage with a safe_join function specifically to block path traversal attacks, which are one of the most common vulnerabilities in file-upload systems.

We also learned a practical lesson about deployment. The admin console is served as static files straight from disk, but a CDN was caching the stylesheet for four hours while the HTML updated immediately. That combination rendered the page unstyled. We fixed it by putting a version query on every static asset, so a stale copy can never be served again.

{TEAM[2]} will close with our future work.""")


# ═══════════════════════════ 15 · FUTURE + THANKS ═══════════════════════════
s = new()
rect(s, 0, 0, W, 0.10, fill=GREEN)
rect(s, 0, 0.1, W, 7.4, fill=DEEP)

txt(s, 0.9, 0.72, 8.0, 0.3, ("NEXT STEPS", 12, True, LGREEN, B_FONT))
txt(s, 0.88, 1.06, 9.5, 0.8, ("Where we go from here", 34, True, WHITE, H_FONT))
rect(s, 0.9, 1.94, 1.8, 0.05, fill=GREEN)

nexts = [
    ("Retrain on field photos", "Replace lab-style images with real field photographs, especially Early Blight, to close the domain gap."),
    ("Switch the default model", "EfficientNet-B0 beat the ensemble on the harder test — make it the default and re-measure."),
    ("Tighten the rejection layer", "The open-set leak of 52.9 percent must fall. We will calibrate the gates and add hard negatives."),
    ("On-device inference", "Run the model on the phone so a farmer with no network can still get a diagnosis."),
]
y = 2.34
for i, (t, b) in enumerate(nexts):
    col, row = i % 2, i // 2
    cx = 0.9 + col * 6.0
    cy = 2.34 + row * 1.42
    rect(s, cx, cy, 5.7, 1.24, fill=RGBColor(0x11, 0x4A, 0x28), round_=True, adj=0.1)
    rect(s, cx + 0.28, cy + 0.3, 0.14, 0.14, fill=LGREEN, round_=True, adj=0.5)
    txt(s, cx + 0.6, cy + 0.2, 4.9, 0.35, (t, 15, True, WHITE, H_FONT))
    txt(s, cx + 0.6, cy + 0.58, 4.9, 0.6, (b, 11.5, False, RGBColor(0xB9, 0xD9, 0xC4), B_FONT), spacing=1.18)

rect(s, 0.9, 5.36, 11.5, 1.5, fill=RGBColor(0x08, 0x2A, 0x16), round_=True, adj=0.1)
txt(s, 1.3, 5.6, 7.6, 0.5, ("Thank you.", 30, True, WHITE, H_FONT))
txt(s, 1.3, 6.14, 7.6, 0.55,
    ("Questions are welcome — we would rather defend a weakness than hide it.",
     13.5, False, RGBColor(0xB9, 0xD9, 0xC4), B_FONT))
s.shapes.add_picture(f"{A}/gu_logo_plate.png", Inches(9.4), Inches(5.72), Inches(1.7))
s.shapes.add_picture(f"{A}/potatodoc_logo_plate.png", Inches(11.35), Inches(5.66), Inches(1.05))

notes(s, f"""To finish, here is what we would do next.

First, retrain on real field photographs. Our biggest weakness is that the test photos came from a different distribution than the training photos. Field images — especially of Early Blight, which is our worst class — would close that gap most directly.

Second, switch the default model. On the harder test, EfficientNet-B0 beat the ensemble, so the ensemble is not automatically the right choice. We should make that change and re-measure.

Third, tighten the rejection layer. A 52.9 percent open-set leak is too high. We would calibrate the gates more carefully and add hard negative examples during training.

Fourth, on-device inference. If the model could run on the phone itself, a farmer with no network connection could still get a diagnosis.

And with that, we would like to thank you for your time. We have tried to present both what works and what does not. We would rather defend a weakness openly than hide it — so please, any questions.

Thank you, respected teacher and panel.""")


prs.save(OUT)
print(f"saved: {OUT}")
print(f"slides: {len(prs.slides)}")
