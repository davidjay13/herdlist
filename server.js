const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { open, slugify, rowListing, rowProducer } = require("./db");
const { seed } = require("./seed");

let db;

const app = express();
const PORT = process.env.PORT || 8080;
const COOKIE = "rl_session";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "data", "uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").slice(0, 8) || ".jpg";
      cb(null, crypto.randomBytes(12).toString("hex") + ext);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));
app.use(express.static(path.join(__dirname, "public")));

function userFromReq(req) {
  const token = req.cookies[COOKIE];
  if (!token) return null;
  return db
    .prepare(
      `SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token);
}

function requireUser(req, res, next) {
  const u = userFromReq(req);
  if (!u) return res.status(401).json({ error: "Sign in required" });
  req.user = u;
  next();
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email };
}

function producerById(id) {
  return rowProducer(db.prepare("SELECT * FROM producers WHERE id = ?").get(id));
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", (req, res) => {
  const u = userFromReq(req);
  if (!u) return res.json({ user: null });
  const producer = rowProducer(
    db.prepare("SELECT * FROM producers WHERE user_id = ?").get(u.id)
  );
  const follows = db
    .prepare("SELECT producer_id FROM follows WHERE user_id = ?")
    .all(u.id)
    .map((r) => r.producer_id);
  res.json({ user: publicUser(u), producer, follows });
});

app.post("/api/signup", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email || password.length < 4) {
    return res.status(400).json({ error: "Name, email, and a password (4+ chars) are required." });
  }
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "That email already has an account." });
  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, password_hash);
  const userId = info.lastInsertRowid;
  let slug = slugify(name);
  const clash = db.prepare("SELECT id FROM producers WHERE slug = ?").get(slug);
  if (clash) slug = slug + "-" + userId;
  const pid = "u" + userId;
  db.prepare(
    `INSERT INTO producers (id, user_id, slug, name, owner, location, about, associations, cover, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    pid,
    userId,
    slug,
    name,
    name,
    "",
    "",
    "[]",
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80"
  );
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ user: { id: userId, name, email } });
});

app.post("/api/signin", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Email or password is wrong." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, row.id);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ user: publicUser(row) });
});

app.post("/api/signout", (req, res) => {
  const token = req.cookies[COOKIE];
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get("/api/listings", (req, res) => {
  const { category, breed, klass } = req.query;
  let sql = "SELECT * FROM listings WHERE status = 'active'";
  const args = [];
  if (category) {
    sql += " AND category = ?";
    args.push(category);
  }
  if (breed) {
    sql += " AND breed = ?";
    args.push(breed);
  }
  if (klass) {
    sql += " AND klass = ?";
    args.push(klass);
  }
  sql += " ORDER BY listed_at DESC";
  const producers = {};
  db.prepare("SELECT * FROM producers")
    .all()
    .forEach((p) => {
      producers[p.id] = rowProducer(p);
    });
  const listings = db.prepare(sql).all(...args).map((r) => rowListing(r, producers[r.producer_id]));
  res.json({ listings });
});

app.get("/api/listings/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Listing not found" });
  res.json({ listing: rowListing(r, producerById(r.producer_id)) });
});

app.post("/api/listings", requireUser, upload.single("photo"), (req, res) => {
  const b = req.body;
  const title = String(b.title || "").trim();
  if (!title) return res.status(400).json({ error: "Title is required." });
  const producer = db.prepare("SELECT * FROM producers WHERE user_id = ?").get(req.user.id);
  if (!producer) return res.status(400).json({ error: "No ranch profile on this account." });
  const id = "l" + Date.now();
  const image = req.file
    ? "/uploads/" + req.file.filename
    : "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
  const price = b.price === "" || b.price == null ? null : Number(b.price);
  db.prepare(
    `INSERT INTO listings (id, producer_id, user_id, title, breed, klass, category, head, unit, price, price_type, days_left, listed_at, location, lat, lng, image, images, description, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 60, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    producer.id,
    req.user.id,
    title,
    b.breed || "Angus",
    b.klass || "Cow-Calf Pair",
    b.category || "Cattle",
    Number(b.head || 1),
    b.category === "Genetics" ? "Units" : "Head",
    price,
    price == null ? "contact" : "per_head",
    b.location || producer.location || "",
    Number(b.lat || producer.lat || 39.8),
    Number(b.lng || producer.lng || -98.5),
    image,
    JSON.stringify([image]),
    String(b.description || ""),
    JSON.stringify({ ListedBy: req.user.name })
  );
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  res.json({ listing: rowListing(row, rowProducer(producer)) });
});

app.post("/api/listings/:id/contact", requireUser, (req, res) => {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  const body = String(req.body.body || "I'm interested in this listing.");
  db.prepare(
    "INSERT INTO messages (listing_id, from_user, to_producer, body) VALUES (?, ?, ?, ?)"
  ).run(listing.id, req.user.id, listing.producer_id, body);
  res.json({ ok: true });
});

app.get("/api/producers/:slug", (req, res) => {
  const p = db
    .prepare("SELECT * FROM producers WHERE slug = ? OR id = ?")
    .get(req.params.slug, req.params.slug);
  if (!p) return res.status(404).json({ error: "Ranch not found" });
  const listings = db
    .prepare("SELECT * FROM listings WHERE producer_id = ? AND status = 'active'")
    .all(p.id)
    .map((r) => rowListing(r, rowProducer(p)));
  res.json({ producer: rowProducer(p), listings });
});

app.post("/api/producers/:id/follow", requireUser, (req, res) => {
  const p = db.prepare("SELECT * FROM producers WHERE id = ?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Ranch not found" });
  const existing = db
    .prepare("SELECT 1 FROM follows WHERE user_id = ? AND producer_id = ?")
    .get(req.user.id, p.id);
  if (existing) {
    db.prepare("DELETE FROM follows WHERE user_id = ? AND producer_id = ?").run(req.user.id, p.id);
    db.prepare("UPDATE producers SET followers = MAX(followers - 1, 0) WHERE id = ?").run(p.id);
    return res.json({ following: false });
  }
  db.prepare("INSERT INTO follows (user_id, producer_id) VALUES (?, ?)").run(req.user.id, p.id);
  db.prepare("UPDATE producers SET followers = followers + 1 WHERE id = ?").run(p.id);
  res.json({ following: true });
});

app.get("/api/my/listings", requireUser, (req, res) => {
  const listings = db
    .prepare("SELECT * FROM listings WHERE user_id = ? ORDER BY listed_at DESC")
    .all(req.user.id)
    .map((r) => rowListing(r, producerById(r.producer_id)));
  res.json({ listings });
});

open().then((database) => {
  db = database;
  seed(db);
  app.listen(PORT, () => {
    console.log("RangeList running on http://localhost:" + PORT);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
