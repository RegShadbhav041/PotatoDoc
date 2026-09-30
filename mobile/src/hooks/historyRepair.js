// Repairs an oversized potatoDocHistory row in AsyncStorage's SQLite file.
// History entries used to embed base64 Grad-CAM overlays; once the single JSON
// blob exceeds Android's CursorWindow (~2MB) AsyncStorage.getItem throws
// "Row too big to fit into CursorWindow" and history appears empty (and any
// new save would overwrite/corrupt the stored data). This module opens the
// same DB file directly (expo-sqlite), strips the unused heatmap fields,
// rewrites the row small, and lets normal AsyncStorage reads succeed again.
//
// DB file location discovered via `adb shell dumpsys dbinfo`: Expo Go scopes
// AsyncStorage per experience: databases/RKStorage-scoped-experience-<urlencoded-id>
import * as SQLite from "expo-sqlite";

const STORAGE_KEY = "potatoDocHistory";
const CURSOR_WINDOW_SAFE = 1500000; // ~1.5MB stays well under the ~2MB window

// expo-sqlite's defaultDatabaseDirectory is <pkg>/files/SQLite; AsyncStorage
// lives in <pkg>/databases (sibling of <files>). dumpsys reports paths under
// /data/user/0 while canonical paths use /data/data - probe both bases.
function storageDirectories() {
  const filesDir = (SQLite.defaultDatabaseDirectory || "").replace(/\/SQLite\/?$/, "");
  const pkgDir = filesDir.replace(/\/files\/?$/, "");
  const dirs = new Set();
  if (pkgDir) {
    dirs.add(`${pkgDir}/databases`);
    dirs.add(`${pkgDir.replace("/data/data/", "/data/user/0/")}/databases`);
  }
  return [...dirs];
}

// expo-sqlite runs databasePath.toUri().path (URI-DECODES) before opening, so
// a filename containing literal %40/%2F would decode into '@'/'/' and open a
// wrong nested file. Escape literal '%' so one decode yields the real name.
const encodeForNative = (name) => name.replace(/%/g, "%25");

const DB_CANDIDATES = [
  // scoped-experience DB used by Expo Go (id stable per project), then fallbacks
  "RKStorage-scoped-experience-%40anonymous%2Fpotato-doc-e196f1ff-8d58-4ff3-ba9b-03f965c78b8d",
  "AsyncStorage",
  "RKStorage",
];

function shrink(entries) {
  let out = entries.map((e) => {
    const { heatmap, ...rest } = e || {};
    return rest;
  });
  let json = JSON.stringify(out);
  if (json.length > CURSOR_WINDOW_SAFE) {
    // still too big: also drop per-class probability maps (UI never uses them)
    out = out.map(({ probabilities, individual, ...rest }) => rest);
    json = JSON.stringify(out);
  }
  return { json, count: entries.length };
}

async function tryRepairInDb(db, dbName, tableName) {
  const row = await db.getFirstAsync(`SELECT value FROM "${tableName}" WHERE key = ?`, [
    STORAGE_KEY,
  ]);
  if (!row || typeof row.value !== "string" || row.value.length === 0) return false;
  let entries;
  try {
    entries = JSON.parse(row.value);
  } catch (e) {
    console.warn(`history repair: JSON parse failed in ${dbName}.${tableName}: ${e?.message}`);
    return false;
  }
  if (!Array.isArray(entries)) return false;
  const { json, count } = shrink(entries);
  if (json.length >= row.value.length) {
    console.warn(`history repair: nothing to shrink in ${dbName}.${tableName}`);
    return false;
  }
  await db.runAsync(`UPDATE "${tableName}" SET value = ? WHERE key = ?`, [json, STORAGE_KEY]);
  console.warn(
    `history repaired: ${count} entries, ${row.value.length} -> ${json.length} bytes (${dbName}.${tableName})`
  );
  return true;
}

export async function repairOversizedHistoryRow() {
  const dirs = storageDirectories();
  for (const dir of dirs) {
    for (const dbName of DB_CANDIDATES) {
      let db = null;
      try {
        db = await SQLite.openDatabaseAsync(encodeForNative(dbName), undefined, dir);
        const tables = await db.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        for (const { name } of tables) {
          const cols = await db.getAllAsync(`PRAGMA table_info("${name}")`);
          const colNames = cols.map((c) => c.name);
          if (!colNames.includes("key") || !colNames.includes("value")) continue;
          if (await tryRepairInDb(db, dbName, name)) return true;
        }
      } catch (e) {
        console.warn(`history repair: skip [${dir}] ${dbName}: ${e?.message}`);
      } finally {
        if (db) {
          try {
            await db.closeAsync();
          } catch {}
        }
      }
    }
  }
  console.warn("history repair: potatoDocHistory row not found in any candidate DB");
  return false;
}
