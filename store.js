const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "store.json");
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  console.error("Could not create data dir", e.message);
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 32).toString("hex");
  return s + ":" + hash;
}

function checkPassword(password, stored) {
  const [s, hash] = String(stored).split(":");
  if (!s || !hash) return false;
  const next = crypto.scryptSync(password, s, 32).toString("hex");
  if (hash.length !== next.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
}

function slugify(s) {
  return (
    String(s || "ranch")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "ranch"
  );
}

function emptyData() {
  return { users: [], sessions: [], producers: [], listings: [], follows: [], messages: [], news: [], nextUser: 1 };
}

function normalizeData(data) {
  const base = emptyData();
  const out = data && typeof data === "object" ? data : {};
  Object.keys(base).forEach((k) => {
    if (Array.isArray(base[k]) && !Array.isArray(out[k])) out[k] = [];
  });
  if (!out.nextUser) out.nextUser = 1;
  return out;
}

function loadFile() {
  try {
    if (!fs.existsSync(FILE)) return null;
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveFile(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function fileStore(data) {
  return {
    data,
    persist: "file",
    async save() {
      saveFile(data);
    },
    hashPassword,
    checkPassword,
    slugify,
  };
}

async function init(seedFn) {
  const url = process.env.DATABASE_URL || process.env.db_DATABASE_URL || process.env.DATABASE_URL_INTERNAL;
  if (url) {
    try {
      const { Client } = require("pg");
      let conn = String(url);
      if (/sslmode=/i.test(conn)) conn = conn.replace(/sslmode=[^&]*/i, "sslmode=no-verify");
      else conn += (conn.includes("?") ? "&" : "?") + "sslmode=no-verify";
      const pgClient = new Client({
        connectionString: conn,
        ssl: { rejectUnauthorized: false },
      });
      await pgClient.connect();
      await pgClient.query("CREATE SCHEMA IF NOT EXISTS herd");
      await pgClient.query("SET search_path TO herd");
      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS herd.app_state (
          id integer PRIMARY KEY,
          payload jsonb NOT NULL
        )
      `);
      const row = await pgClient.query("SELECT payload FROM herd.app_state WHERE id = 1");
      let data;
      if (row.rows[0]) {
        data = normalizeData(row.rows[0].payload);
      } else {
        data = emptyData();
        seedFn(data);
        await pgClient.query("INSERT INTO herd.app_state (id, payload) VALUES (1, $1)", [JSON.stringify(data)]);
      }
      console.log("Store: postgres");
      return {
        data,
        persist: "postgres",
        async save() {
          await pgClient.query(
            "INSERT INTO herd.app_state (id, payload) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload",
            [JSON.stringify(data)]
          );
        },
        hashPassword,
        checkPassword,
        slugify,
      };
    } catch (err) {
      const preview = String(url).slice(0, 18);
      console.error(
        "Postgres unavailable, using file store:",
        err && err.message,
        "code=" + ((err && err.code) || ""),
        "url_prefix=" + preview
      );
    }
  }

  let data = loadFile();
  if (!data) {
    data = emptyData();
    seedFn(data);
    try {
      saveFile(data);
    } catch (e) {
      console.error("File store write failed", e.message);
    }
  } else {
    data = normalizeData(data);
  }
  console.log("Store: file");
  return fileStore(data);
}

module.exports = { init, slugify, hashPassword, checkPassword };
