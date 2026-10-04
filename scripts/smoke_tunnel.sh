#!/usr/bin/env bash
# PotatoDoc tunnel smoke test.
#   usage: ./scripts/smoke_tunnel.sh https://xxxx.trycloudflare.com
# Exits non-zero on the first hard failure so it can gate a demo.
set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <tunnel-base-url>" >&2
  exit 2
fi
BASE="${BASE%/}"

PASS=0
FAIL=0
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=$((FAIL+1)); }
head_() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

# Repo root = parent of scripts/
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMG_DIR="$ROOT/Unused/datasets/External images"
EMUL="$ROOT/reports/emulator_set"

head_ "1. /ping  (backend alive?)"
PING=$(curl -s -m 20 -w '\n%{http_code}' "$BASE/ping")
CODE="${PING##*$'\n'}"; BODY="${PING%$'\n'*}"
[[ "$CODE" == "200" ]] && ok "HTTP 200" || bad "HTTP $CODE"
[[ "$BODY" == *"alive"* ]] && ok "body = '$BODY'" || bad "body = '$BODY' (expected 'Hello, I am alive')"

head_ "2. /models  (model registry)"
M=$(curl -s -m 20 "$BASE/models")
echo "$M"
grep -q '"ensemble"' <<<"$M" && ok "ensemble advertised" || bad "ensemble missing"
python3 - "$M" <<'PY' 2>/dev/null && ok "default = ensemble" || bad "default is not ensemble"
import json,sys
d=json.loads(sys.argv[1]); sys.exit(0 if d.get("default")=="ensemble" else 1)
PY

head_ "3. /predict  (real leaf images)"
if [[ -d "$IMG_DIR" ]]; then
  for img in "$IMG_DIR"/early.jpg "$IMG_DIR"/late.jpg "$IMG_DIR"/Early-blight*.jpg; do
    [[ -f "$img" ]] || continue
    name="$(basename "$img")"
    R=$(curl -s -m 120 -X POST -F "file=@$img" "$BASE/predict?model_id=ensemble")
    if python3 -c "
import json,sys
d=json.loads(sys.argv[1])
assert 'class' in d and 'confidence' in d, d
assert 'probabilities' in d, 'no probabilities'
" "$R" 2>/dev/null; then
      ok "$name -> $(python3 -c "
import json,sys
d=json.loads(sys.argv[1])
print(f\"{d['class']} {d['confidence']:.2f}\" + (' [Unknown]' if d.get('is_unknown') else ''))
" "$R")"
    else
      bad "$name -> ${R:0:160}"
    fi
  done
else
  bad "image dir missing: $IMG_DIR"
fi

head_ "4. /predict  (hard cases: non-leaf, foreign leaf)"
if [[ -d "$EMUL" ]]; then
  for img in "$EMUL"/24_nonleaf_person.jpg "$EMUL"/10_other_leaf.jpg; do
    [[ -f "$img" ]] || continue
    R=$(curl -s -m 120 -X POST -F "file=@$img" "$BASE/predict?model_id=ensemble")
    if python3 -c "
import json,sys
d=json.loads(sys.argv[1]); assert 'class' in d, d" "$R" 2>/dev/null; then
      ok "$(basename "$img") -> $(python3 -c "
import json,sys
d=json.loads(sys.argv[1]); print(d['class'], 'is_unknown=',d.get('is_unknown',False))
" "$R")"
    else
      bad "$(basename "$img") -> ${R:0:160}"
    fi
  done
fi

head_ "5. /predict?model_id=efficientnetb0  (per-model path)"
IMG=$(ls "$IMG_DIR"/early.jpg 2>/dev/null | head -1)
[[ -f "$IMG" ]] && {
  R=$(curl -s -m 120 -X POST -F "file=@$IMG" "$BASE/predict?model_id=efficientnetb0")
  python3 -c "
import json,sys
d=json.loads(sys.argv[1]); assert 'class' in d, d" "$R" 2>/dev/null \
    && ok "single-model ok -> $(python3 -c "import json,sys;print(json.loads(sys.argv[1])['class'])" "$R")" \
    || bad "single-model -> ${R:0:160}"
}

head_ "6. /gradcam  (heatmap overlay)"
[[ -f "$IMG" ]] && {
  R=$(curl -s -m 180 -X POST -F "file=@$IMG" "$BASE/gradcam?model_id=ensemble")
  OVER=$(python3 -c "
import json,sys
d=json.loads(sys.argv[1])
k='overlay' if 'overlay' in d else ('heatmaps' if 'heatmaps' in d else None)
v=d.get(k) if k=='overlay' else (list(d['heatmaps'].values())[0].get('overlay') if d.get('heatmaps') else None)
print(len(v) if isinstance(v,str) else 0)
" "$R" 2>/dev/null)
  [[ "${OVER:-0}" -gt 1000 ]] && ok "overlay data-URI ($OVER chars)" || bad "no/short overlay -> ${R:0:160}"
}

head_ "7. /location/analyze  (Pokhara ~28.2096,83.9856)"
R=$(curl -s -m 60 "$BASE/location/analyze?lat=28.2096&lon=83.9856")
if python3 -c "
import json,sys
d=json.loads(sys.argv[1])
assert 'score' in d and 'band' in d, list(d)[:12]
assert d.get('factors'), 'no factors'
assert d.get('varieties'), 'no varieties'
" "$R" 2>/dev/null; then
  ok "$(python3 -c "
import json,sys
d=json.loads(sys.argv[1])
place=(d.get('place') or '?')[:28]
f=d['factors']
print('score=%s band=%s place=%s alt=%sm varieties=%d factors=%d' % (
    d['score'], d['band'], place, d.get('altitude_m'), len(d['varieties']), len(f)))
" "$R")"
else
  bad "${R:0:200}"
fi

head_ "8. /location/analyze  (bad input -> 400)"
CODE=$(curl -s -m 30 -o /dev/null -w '%{http_code}' "$BASE/location/analyze?lat=999&lon=0")
[[ "$CODE" == "400" ]] && ok "invalid lat -> 400" || bad "invalid lat -> $CODE (expected 400)"

head_ "9. /auth/register  (new account)"
SUF="$$-$(date +%s)"
REG=$(curl -s -m 30 -w '\n%{http_code}' -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"contact\":\"smoke${SUF}@test.com\",\"name\":\"Smoke Test\",\"password\":\"testpass123\"}")
CODE="${REG##*$'\n'}"; BODY="${REG%$'\n'*}"
case "$CODE" in
  201|409) ok "HTTP $CODE (201 created / 409 already exists)";;
  *)       bad "HTTP $CODE -> ${BODY:0:160}";;
esac

TOKEN=$(python3 -c "
import json,sys
try: print(json.loads(sys.argv[1]).get('token',''))
except Exception: print('')" "$BODY" 2>/dev/null)
[[ -n "$TOKEN" ]] && ok "token issued (len ${#TOKEN})" || bad "no token in response"

head_ "10. /history  (authed round-trip)"
if [[ -n "$TOKEN" ]]; then
  H=$(curl -s -m 30 -X PUT "$BASE/history" -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"items\":[{\"id\":\"$(date +%s)000\",\"class\":\"Healthy\",\"confidence\":0.99,\"model\":\"smoke\"}]}")
  python3 -c "
import json,sys
d=json.loads(sys.argv[1]); assert 'upserted' in d, d" "$H" 2>/dev/null \
    && ok "PUT /history ok -> $(python3 -c "import json,sys;print('upserted',json.loads(sys.argv[1])['upserted'])" "$H")" \
    || bad "PUT /history -> ${H:0:160}"
  G=$(curl -s -m 30 "$BASE/history" -H "Authorization: Bearer $TOKEN")
  python3 -c "
import json,sys
d=json.loads(sys.argv[1])
items=d.get('items',d) if isinstance(d,dict) else d
assert len(items)>=1, d" "$G" 2>/dev/null \
    && ok "GET /history returns the item" || bad "GET /history -> ${G:0:160}"
else
  bad "skipped (no token)"
fi

head_ "11. unauthenticated /predict  (public surface — expect 200)"
CODE=$(curl -s -m 120 -o /dev/null -w '%{http_code}' -X POST -F "file=@$IMG" "$BASE/predict?model_id=ensemble")
[[ "$CODE" == "200" ]] && ok "predict needs no auth (rate-limit risk)" || bad "predict -> $CODE"

head_ "RESULT"
printf '  %d passed, %d failed\n\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]] || exit 1
