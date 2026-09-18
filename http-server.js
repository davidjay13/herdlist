#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { init, slugify, hashPassword, checkPassword } = require("./store");
const { seedJson } = require("./seed-json");
const extraApi = require("./extra-api");

const PORT = process.env.PORT || 8080;
const PUBLIC = path.join(__dirname, "public");
let db;
const COOKIE = "rl_session";
let LOGO_PNG = null;
try {
  const disk = path.join(PUBLIC, "logo.png");
  if (fs.existsSync(disk) && fs.statSync(disk).size > 1000) {
    LOGO_PNG = fs.readFileSync(disk);
  } else {
    LOGO_PNG = Buffer.from(require("./logo-png-b64"), "base64");
  }
} catch (e) {
  LOGO_PNG = null;
}
const LOGO_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 227" width="240" height="227"><path fill="#16503c" d="M42 78c-18-22-28-48-22-62 14 8 32 22 46 40 6-16 16-30 28-40 8 18 12 36 12 54h8c0-18 4-36 12-54 12 10 22 24 28 40 14-18 32-32 46-40 6 14-4 40-22 62 16 10 28 24 34 40-18 4-38 4-54-2-4 16-12 30-24 40 10 14 14 30 12 46-16-8-30-20-40-34-10 14-24 26-40 34-2-16 2-32 12-46-12-10-20-24-24-40-16 6-36 6-54 2 6-16 18-30 34-40z"/><path fill="#fff" d="M88 118c8 0 14 8 12 16-2 6-8 10-14 8s-10-10-8-16c2-5 6-8 10-8zm64 0c4 0 8 3 10 8 2 6-2 14-8 16s-12-2-14-8c-2-8 4-16 12-16zM120 148c12 0 22 8 24 18-8 6-16 8-24 8s-16-2-24-8c2-10 12-18 24-18z"/></svg>`);

function userFromCookie(req) {
  const raw = req.headers.cookie || "";
  const m = raw.match(new RegExp("(?:^|; )" + COOKIE + "=([^;]+)"));
  if (!m) return null;
  const sess = db.data.sessions.find((s) => s.token === m[1]);
  if (!sess) return null;
  return db.data.users.find((u) => u.id === sess.userId) || null;
}

function send(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...extra });
  res.end(body);
}

function setSession(res, token) {
  return { "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 3600}` };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({ ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" }[ext] || "application/octet-stream");
}

function serveLogo(res) {
  if (LOGO_PNG && LOGO_PNG.length > 8000 && LOGO_PNG[0] === 0x89 && LOGO_PNG[1] === 0x50) {
    res.writeHead(200, { "Content-Type": "image/png", "Content-Length": LOGO_PNG.length, "Cache-Control": "public, max-age=60, must-revalidate" });
    return res.end(LOGO_PNG);
  }
  res.writeHead(200, { "Content-Type": "image/svg+xml", "Content-Length": LOGO_SVG.length, "Cache-Control": "no-cache" });
  return res.end(LOGO_SVG);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/logo.png" || urlPath === "/logo.svg" || urlPath === "/favicon.ico") return serveLogo(res);
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
  const buf = fs.readFileSync(file);
  res.writeHead(200, { "Content-Type": mime(file), "Content-Length": buf.length });
  res.end(buf);
}

function withProducer(listing) {
  const p = db.data.producers.find((x) => x.id === listing.producerId);
  return { ...listing, producer: p || null };
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];
  const method = req.method;
  try {
    if (url === "/api/health") return send(res, 200, { ok: true, persist: db.persist });
    if (await extraApi({ url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword })) return;

    if (url === "/api/me" && method === "GET") {
      const u = userFromCookie(req);
      if (!u) return send(res, 200, { user: null, follows: [] });
      const producer = db.data.producers.find((p) => p.userId === u.id) || null;
      const follows = db.data.follows.filter((f) => f.userId === u.id).map((f) => f.producerId);
      return send(res, 200, { user: { id: u.id, name: u.name, email: u.email }, producer, follows });
    }

    if (url === "/api/signup" && method === "POST") {
      const b = await readBody(req);
      const name = String(b.name || "").trim();
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      if (!name || !email || password.length < 4) return send(res, 400, { error: "Name, email, and a password (4+ chars) are required." });
      if (db.data.users.some((u) => u.email === email)) return send(res, 409, { error: "That email already has an account." });
      const id = db.data.nextUser++;
      db.data.users.push({ id, name, email, passwordHash: hashPassword(password) });
      let slug = slugify(name);
      if (db.data.producers.some((p) => p.slug === slug)) slug += "-" + id;
      db.data.producers.push({ id: "u" + id, userId: id, slug, name, owner: name, location: "", rating: 5, reviews: 0, sold: 0, followers: 0, about: "", associations: [], cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80", avatar: "/logo.png?v=44" });
      const token = crypto.randomBytes(24).toString("hex");
      db.data.sessions.push({ token, userId: id });
      await db.save();
      return send(res, 200, { user: { id, name, email } }, setSession(res, token));
    }

    if (url === "/api/signin" && method === "POST") {
      const b = await readBody(req);
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      const u = db.data.users.find((x) => x.email === email);
      if (!u || !checkPassword(password, u.passwordHash)) return send(res, 401, { error: "Email or password is wrong." });
      const token = crypto.randomBytes(24).toString("hex");
      db.data.sessions.push({ token, userId: u.id });
      await db.save();
      return send(res, 200, { user: { id: u.id, name: u.name, email: u.email } }, setSession(res, token));
    }

    if (url === "/api/signout" && method === "POST") {
      const raw = req.headers.cookie || "";
      const m = raw.match(new RegExp("(?:^|; )" + COOKIE + "=([^;]+)"));
      if (m) db.data.sessions = db.data.sessions.filter((s) => s.token !== m[1]);
      await db.save();
      return send(res, 200, { ok: true }, { "Set-Cookie": `${COOKIE}=; HttpOnly; Path=/; Max-Age=0` });
    }

    if (url === "/api/listings" && method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      let list = db.data.listings.filter((l) => l.status !== "sold");
      if (q.get("category")) list = list.filter((l) => l.category === q.get("category"));
      if (q.get("breed")) list = list.filter((l) => l.breed === q.get("breed"));
      if (q.get("klass")) list = list.filter((l) => l.klass === q.get("klass"));
      return send(res, 200, { listings: list.map(withProducer) });
    }

    if (url === "/api/listings" && method === "POST") {
      const u = userFromCookie(req);
      if (!u) return send(res, 401, { error: "Sign in required" });
      const b = await readBody(req);
      const title = String(b.title || "").trim();
      if (!title) return send(res, 400, { error: "Title is required." });
      const producer = db.data.producers.find((p) => p.userId === u.id);
      const id = "l" + Date.now();
      const price = b.price === "" || b.price == null ? null : Number(b.price);
      const uploaded = Array.isArray(b.images) ? b.images.filter((s) => typeof s === "string" && s.startsWith("data:image")).slice(0, 4) : [];
      if (typeof b.image === "string" && b.image.startsWith("data:image") && !uploaded.length) uploaded.push(b.image);
      const image = uploaded[0] || b.image || "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
      const listing = { id, producerId: producer.id, userId: u.id, title, breed: b.breed || "Angus", klass: b.klass || "Cow-Calf Pair", category: b.category || "Cattle", head: Number(b.head || 1), unit: b.category === "Genetics" ? "Units" : "Head", price, priceType: price == null ? "contact" : "per_head", daysLeft: 60, listedAt: new Date().toISOString().slice(0, 10), location: b.location || "", lat: Number(b.lat || 39.8), lng: Number(b.lng || -98.5), status: "active", image, images: uploaded.length ? uploaded : [image], description: String(b.description || ""), details: { ListedBy: u.name } };
      db.data.listings.unshift(listing);
      await db.save();
      return send(res, 200, { listing: withProducer(listing) });
    }

    const listingMatch = url.match(/^\/api\/listings\/([^/]+)$/);
    if (listingMatch && method === "GET") {
      const listing = db.data.listings.find((l) => l.id === listingMatch[1]);
      if (!listing) return send(res, 404, { error: "Listing not found" });
      return send(res, 200, { listing: withProducer(listing) });
    }

    const contactMatch = url.match(/^\/api\/listings\/([^/]+)\/contact$/);
    if (contactMatch && method === "POST") {
      const u = userFromCookie(req);
      if (!u) return send(res, 401, { error: "Sign in required" });
      const listing = db.data.listings.find((l) => l.id === contactMatch[1]);
      if (!listing) return send(res, 404, { error: "Listing not found" });
      const b = await readBody(req);
      db.data.messages.push({ listingId: listing.id, fromUser: u.id, toProducer: listing.producerId, body: b.body || "Interested", at: Date.now() });
      await db.save();
      return send(res, 200, { ok: true });
    }

    const prodMatch = url.match(/^\/api\/producers\/([^/]+)$/);
    if (prodMatch && method === "GET") {
      const key = decodeURIComponent(prodMatch[1]);
      const p = db.data.producers.find((x) => x.slug === key || x.id === key);
      if (!p) return send(res, 404, { error: "Ranch not found" });
      const listings = db.data.listings.filter((l) => l.producerId === p.id).map(withProducer);
      return send(res, 200, { producer: p, listings });
    }

    const followMatch = url.match(/^\/api\/producers\/([^/]+)\/follow$/);
    if (followMatch && method === "POST") {
      const u = userFromCookie(req);
      if (!u) return send(res, 401, { error: "Sign in required" });
      const p = db.data.producers.find((x) => x.id === followMatch[1]);
      if (!p) return send(res, 404, { error: "Ranch not found" });
      const i = db.data.follows.findIndex((f) => f.userId === u.id && f.producerId === p.id);
      if (i >= 0) {
        db.data.follows.splice(i, 1);
        p.followers = Math.max((p.followers || 1) - 1, 0);
        await db.save();
        return send(res, 200, { following: false });
      }
      db.data.follows.push({ userId: u.id, producerId: p.id });
      p.followers = (p.followers || 0) + 1;
      await db.save();
      return send(res, 200, { following: true });
    }

    if (url === "/api/my/listings" && method === "GET") {
      const u = userFromCookie(req);
      if (!u) return send(res, 401, { error: "Sign in required" });
      return send(res, 200, { listings: db.data.listings.filter((l) => l.userId === u.id).map(withProducer) });
    }

    if (url.startsWith("/api/")) return send(res, 404, { error: "Not found" });
    return serveStatic(req, res);
  } catch (err) {
    console.error(err);
    send(res, 500, { error: "Server error" });
  }
});

init(seedJson)
  .then((store) => {
    db = store;
    server.listen(PORT, () => console.log("Herd Yard running on http://localhost:" + PORT + " persist=" + db.persist));
  })
  .catch((err) => {
    console.error("Failed to start store", err);
    process.exit(1);
  });
