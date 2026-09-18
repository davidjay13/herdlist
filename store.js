const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "store.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(FILE)) return null;
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

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

function init(seedFn) {
  let data = load();
  if (!data) {
    data = { users: [], sessions: [], producers: [], listings: [], follows: [], messages: [], nextUser: 1 };
    seedFn(data);
    save(data);
  }
  return {
    data,
    save() {
      save(data);
    },
    hashPassword,
    checkPassword,
    slugify,
  };
}

module.exports = { init, slugify, hashPassword, checkPassword };
