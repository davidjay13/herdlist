#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { init, slugify, hashPassword, checkPassword } = require("./store");
const { seedJson } = require("./seed-json");

const PORT = process.env.PORT || 8080;
const PUBLIC = path.join(__dirname, "public");
let db;
const COOKIE = "rl_session";

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
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    }[ext] || "application/octet-stream"
  );
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end("Not found");
  }
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
      db.data.producers.push({
        id: "u" + id,
        userId: id,
        slug,
        name,
        owner: name,
        location: "",
        rating: 5,
        reviews: 0,
        sold: 0,
        followers: 0,
        about: "",
        associations: [],
        cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80",
        avatar: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80",
      });
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
      const image =
        b.image ||
        "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
      const listing = {
        id,
        producerId: producer.id,
        userId: u.id,
        title,
        breed: b.breed || "Angus",
        klass: b.klass || "Cow-Calf Pair",
        category: b.category || "Cattle",
        head: Number(b.head || 1),
        unit: b.category === "Genetics" ? "Units" : "Head",
        price,
        priceType: price == null ? "contact" : "per_head",
        daysLeft: 60,
        listedAt: new Date().toISOString().slice(0, 10),
        location: b.location || "",
        lat: Number(b.lat || 39.8),
        lng: Number(b.lng || -98.5),
        status: "active",
        image,
        images: [image],
        description: String(b.description || ""),
        details: { ListedBy: u.name },
      };
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
    server.listen(PORT, () =>
      console.log("Herd Yard running on http://localhost:" + PORT + " persist=" + db.persist)
    );
  })
  .catch((err) => {
    console.error("Failed to start store", err);
    process.exit(1);
  });
