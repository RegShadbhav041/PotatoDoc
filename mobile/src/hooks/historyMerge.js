// Pure history-merge helpers. No React / React Native imports, so Node's
// built-in test runner can exercise them directly.
export const MAX_HISTORY_ITEMS = 50;

const LOCAL_ONLY_KEYS = ["imageUri"];

export function stripLocalKeys(item) {
  const out = { ...item };
  for (const key of LOCAL_ONLY_KEYS) delete out[key];
  return out;
}

export function mergeHistory(local = [], server = []) {
  const byId = new Map();

  // Server side first, defensively stripped: a foreign file:// path would
  // render as a blank thumbnail on this device.
  for (const item of server) {
    if (item && item.id != null && String(item.id) !== "") {
      byId.set(String(item.id), stripLocalKeys(item));
    }
  }
  // Device side last — on collision the device copy wins and keeps its image.
  for (const item of local) {
    if (item && item.id != null && String(item.id) !== "") {
      byId.set(String(item.id), item);
    }
  }

  return [...byId.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, MAX_HISTORY_ITEMS);
}

export function historyEquals(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  return left.every(
    (item, i) => item && right[i] && String(item.id) === String(right[i].id)
  );
}
