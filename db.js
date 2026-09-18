const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "rangelist.db");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, "uploads"), { recursive: true });

let raw;
let persistTimer;

function persist() {
  const data = raw.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 50);
}

function wrap(db) {
  return {
    exec(sql) {
      db.run(sql);
      schedulePersist();
    },
    prepare(sql) {
      return {
        run(...args) {
          db.run(sql, args);
          schedulePersist();
          const last = db.exec("SELECT last_insert_rowid() AS id");
          return { lastInsertRowid: last[0] ? last[0].values[0][0] : 0 };
        },
        get(...args) {
          const stmt = db.prepare(sql);
          if (args.length) stmt.bind(args);
          if (!stmt.step()) {
            stmt.free();
            return undefined;
          }
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        },
        all(...args) {
          const stmt = db.prepare(sql);
          if (args.length) stmt.bind(args);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
    transaction(fn) {
      return () => {
        db.run("BEGIN");
        try {
          fn();
          db.run("COMMIT");
          persist();
        } catch (e) {
          db.run("ROLLBACK");
          throw e;
        }
      };
    },
  };
}

async function open() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    raw = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    raw = new SQL.Database();
  }
  const db = wrap(raw);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS producers (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      owner TEXT,
      location TEXT,
      state TEXT,
      lat REAL,
      lng REAL,
      rating REAL DEFAULT 5,
      reviews INTEGER DEFAULT 0,
      sold INTEGER DEFAULT 0,
      followers INTEGER DEFAULT 0,
      founded INTEGER,
      about TEXT,
      associations TEXT,
      cover TEXT,
      avatar TEXT
    );
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      producer_id TEXT NOT NULL,
      user_id INTEGER,
      title TEXT NOT NULL,
      breed TEXT,
      klass TEXT,
      category TEXT,
      head INTEGER,
      unit TEXT,
      price REAL,
      price_type TEXT,
      days_left INTEGER DEFAULT 60,
      listed_at TEXT,
      location TEXT,
      lat REAL,
      lng REAL,
      status TEXT DEFAULT 'active',
      image TEXT,
      images TEXT,
      description TEXT,
      details TEXT
    );
    CREATE TABLE IF NOT EXISTS follows (
      user_id INTEGER NOT NULL,
      producer_id TEXT NOT NULL,
      PRIMARY KEY (user_id, producer_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id TEXT,
      from_user INTEGER,
      to_producer TEXT,
      body TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  persist();
  return db;
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

function rowListing(r, producer) {
  if (!r) return null;
  return {
    id: r.id,
    producerId: r.producer_id,
    userId: r.user_id,
    title: r.title,
    breed: r.breed,
    klass: r.klass,
    category: r.category,
    head: r.head,
    unit: r.unit,
    price: r.price,
    priceType: r.price_type,
    daysLeft: r.days_left,
    listedAt: r.listed_at,
    location: r.location,
    lat: r.lat,
    lng: r.lng,
    status: r.status,
    image: r.image,
    images: r.images ? JSON.parse(r.images) : [r.image],
    description: r.description,
    details: r.details ? JSON.parse(r.details) : {},
    producer: producer || null,
  };
}

function rowProducer(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    slug: r.slug,
    name: r.name,
    owner: r.owner,
    location: r.location,
    state: r.state,
    lat: r.lat,
    lng: r.lng,
    rating: r.rating,
    reviews: r.reviews,
    sold: r.sold,
    followers: r.followers,
    founded: r.founded,
    about: r.about,
    associations: r.associations ? JSON.parse(r.associations) : [],
    cover: r.cover,
    avatar: r.avatar,
  };
}

module.exports = { open, slugify, rowListing, rowProducer };
