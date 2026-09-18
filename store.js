const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "store.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 32).toString("hex");
  return s + ":" + hash;
}

function checkPassword(password, stored) {
  const [s, hash] = String(stored).split(":");
  const next = crypto.scryptSync(password, s, 32).toString("hex");
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
  return { users: [], sessions: [], producers: [], listings: [], follows: [], messages: [], nextUser: 1 };
}

function loadFile() {
  if (!fs.existsSync(FILE)) return null;
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveFile(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

async function init(seedFn) {
  const url = process.env.DATABASE_URL || process.env.db_DATABASE_URL || process.env.DATABASE_URL_INTERNAL;
  let data;
  let persist = "file";
  let pgClient = null;

  if (url) {
    persist = "postgres";
    const { Client } = require("pg");
    pgClient = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id integer PRIMARY KEY,
        payload jsonb NOT NULL
      )
    `);
    const row = await pgClient.query("SELECT payload FROM app_state WHERE id = 1");
    if (row.rows[0]) {
      data = row.rows[0].payload;
    } else {
      data = emptyData();
      seedFn(data);
      await pgClient.query("INSERT INTO app_state (id, payload) VALUES (1, $1)", [JSON.stringify(data)]);
    }
  } else {
    data = loadFile();
    if (!data) {
      data = emptyData();
      seedFn(data);
      saveFile(data);
    }
  }

  return {
    data,
    persist,
    async save() {
      if (pgClient) {
        await pgClient.query(
          "INSERT INTO app_state (id, payload) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload",
          [JSON.stringify(data)]
        );
      } else {
        saveFile(data);
      }
    },
    hashPassword,
    checkPassword,
    slugify,
  };
}

module.exports = { init, slugify, hashPassword, checkPassword };
