#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { init, slugify, hashPassword, checkPassword } = require("./store");
const { seedJson } = require("./seed-json");
const extraApi = require("./extra-api");
const messagesApi = require("./messages-api");
const newsApi = require("./news-api");
const stripeBilling = require("./stripe-billing");
const seo = require("./seo");
const mail = require("./mail");
const weeklyMail = require("./weekly-mail");
const videoStore = require("./video-store");

const PORT = process.env.PORT || 8080;
const PUBLIC = path.join(__dirname, "public");
let db;
const COOKIE = "rl_session";
const OG_SRC = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&h=630&q=80";
let OG_BUF = null;
function loadLogoSvg() {
  const p = path.join(PUBLIC, "logo.svg");
  if (fs.existsSync(p)) return fs.readFileSync(p);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170"><path fill="#16503c" d="M22 54c-8-18-10-36-2-48 16 10 30 24 40 40 8-18 20-32 34-42 6 20 8 38 8 54h8c0-16 2-34 8-54 14 10 26 24 34 42 10-16 24-30 40-40 8 12 6 30-2 48 16 12 28 28 34 46-20 2-40 0-56-8-6 16-16 30-28 40 8 16 10 32 8 48-18-8-34-20-44-36-10 16-26 28-44 36-2-16 0-32 8-48-12-10-22-24-28-40-16 8-36 10-56 8 6-18 18-34 34-46z"/></svg>`);
}
const LOGO_SVG = loadLogoSvg();

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
  return ({ ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" }[ext] || "application/octet-stream");
}

function serveLogo(res) {
  const buf = loadLogoSvg();
  res.writeHead(200, { "Content-Type": "image/svg+xml", "Content-Length": buf.length, "Cache-Control": "no-cache" });
  return res.end(buf);
}

function serveOg(res) {
  const disk = path.join(PUBLIC, "og.jpg");
  if (fs.existsSync(disk) && fs.statSync(disk).size > 1000) {
    const buf = fs.readFileSync(disk);
    res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": buf.length, "Cache-Control": "public, max-age=86400" });
    return res.end(buf);
  }
  if (OG_BUF) {
    res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": OG_BUF.length, "Cache-Control": "public, max-age=86400" });
    return res.end(OG_BUF);
  }
  res.writeHead(302, { Location: OG_SRC, "Cache-Control": "public, max-age=3600" });
  return res.end();
}

function sendIndex(res, urlPath) {
  const file = path.join(PUBLIC, "index.html");
  let html = fs.readFileSync(file, "utf8");
  html = seo.inject(html, seo.forRequest(urlPath, db));
  const buf = Buffer.from(html);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Length": buf.length, "Cache-Control": "no-cache" });
  res.end(buf);
}
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/logo.png" || urlPath === "/logo.svg" || urlPath === "/favicon.ico") return serveLogo(res);
  if (urlPath === "/og.jpg" || urlPath === "/social-card.png" || urlPath === "/social-card.jpg") return serveOg(res);
  if (urlPath === "/robots.txt") {
    const body = seo.robotsTxt();
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" });
    return res.end(body);
  }
  if (urlPath === "/sitemap.xml") {
    const body = seo.sitemapXml(db);
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" });
    return res.end(body);
  }
  if (urlPath.startsWith("/uploads/videos/")) {
    const file = videoStore.diskFile(urlPath);
    if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
    const buf = fs.readFileSync(file);
    res.writeHead(200, {
      "Content-Type": videoStore.mimeFor(file),
      "Content-Length": buf.length,
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes"
    });
    return res.end(buf);
  }
  if (urlPath === "/" || urlPath === "/index.html" || seo.isSpaPath(urlPath)) return sendIndex(res, urlPath);
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (seo.isSpaPath(urlPath)) return sendIndex(res, urlPath);
    res.writeHead(404); return res.end("Not found");
  }
  const buf = fs.readFileSync(file);
  res.writeHead(200, { "Content-Type": mime(file), "Content-Length": buf.length });
  res.end(buf);
}

function remainingDays(listedAt, stored) {
  const t = Date.parse(listedAt || "");
  if (!t) return Math.max(0, Number(stored || 0) || 0);
  return Math.max(0, Math.ceil((t + 60 * 86400000 - Date.now()) / 86400000));
}

function withProducer(listing) {
  const p = db.data.producers.find((x) => x.id === listing.producerId);
  const producer = p ? {
    id: p.id, slug: p.slug, name: p.name, owner: p.owner, location: p.location || "",
    rating: p.rating, reviews: p.reviews, sold: p.sold || 0, followers: p.followers || 0,
    about: p.about || "", avatar: p.avatar, cover: p.cover, lat: p.lat, lng: p.lng, website: p.website || ""
  } : null;
  return { ...listing, daysLeft: remainingDays(listing.listedAt, listing.daysLeft), producer };
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];
  const method = req.method;
  try {
    if (url === "/api/health") return send(res, 200, { ok: true, persist: db.persist, mail: mail.configured(), mailSample: db.data.mailSampleSentAt || null, weeklySample: db.data.mailWeeklySampleSentAt || null });
    if (await newsApi({ url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword })) return;
    if (await extraApi({ url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword })) return;
    if (await messagesApi({ url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword })) return;
    if (await stripeBilling({ url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword })) return;

    if (url === "/api/me" && method === "GET") {
      const u = userFromCookie(req);
      if (!u) return send(res, 200, { user: null, follows: [] });
      const producer = db.data.producers.find((p) => p.userId === u.id) || null;
      const follows = db.data.follows.filter((f) => f.userId === u.id).map((f) => f.producerId);
      return send(res, 200, { user: { id: u.id, name: u.name, email: u.email, emailWeeklyStats: !!u.emailWeeklyStats, emailUpdates: !!u.emailUpdates, emailPartners: !!u.emailPartners }, producer, follows });
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
      db.data.producers.push({ id: "u" + id, userId: id, slug, name, owner: name, location: "", rating: 5, reviews: 0, sold: 0, followers: 0, about: "", associations: [], cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80", avatar: "/cowboy.svg?v=2" });
      const token = crypto.randomBytes(24).toString("hex");
      db.data.sessions.push({ token, userId: id });
      await db.save();
      mail.welcome({ id: id, name: name, email: email });
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
      let list = db.data.listings.filter((l) => l.status !== "sold" && !l.hidden);
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
      const producer = db.data.producers.find((p) => p.userId === u.id) || (function () {
        const row = { id: "u" + u.id, userId: u.id, slug: slugify(u.name) + "-" + u.id, name: u.name, owner: u.name, location: "", rating: 5, reviews: 0, sold: 0, followers: 0, about: "", associations: [], cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80", avatar: "/cowboy.svg?v=2" };
        db.data.producers.push(row);
        return row;
      })();
      const id = "l" + Date.now();
      const price = b.price === "" || b.price == null ? null : Number(b.price);
      const uploaded = Array.isArray(b.images) ? b.images.filter((s) => typeof s === "string" && s.startsWith("data:image")).slice(0, 4) : [];
      if (typeof b.image === "string" && b.image.startsWith("data:image") && !uploaded.length) uploaded.push(b.image);
      const image = uploaded[0] || b.image || "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
      const listing = { id, producerId: producer.id, userId: u.id, title, breed: b.breed || "Angus", klass: b.klass || "Cow-Calf Pair", category: b.category || "Cattle", head: Number(b.head || 1), unit: b.category === "Genetics" ? "Units" : "Head", price, priceType: price == null ? "contact" : "per_head", daysLeft: 60, listedAt: new Date().toISOString().slice(0, 10), location: b.location || "", lat: Number(b.lat || 39.8), lng: Number(b.lng || -98.5), status: "active", image, images: uploaded.length ? uploaded : [image], video: videoStore.validVideo(b.video), description: String(b.description || ""), details: { ListedBy: u.name } };
      db.data.listings.unshift(listing);
      await db.save();
      mail.listingLive(u, listing);
      return send(res, 200, { listing: withProducer(listing) });
    }

    const listingMatch = url.match(/^\/api\/listings\/([^/]+)$/);
    if (listingMatch && method === "GET") {
      const listing = db.data.listings.find((l) => l.id === listingMatch[1]);
      if (!listing) return send(res, 404, { error: "Listing not found" });
      const viewer = userFromCookie(req);
      const pack = withProducer(listing);
      if (!viewer && pack.producer) {
        delete pack.producer.phone;
        delete pack.producer.email;
      } else if (viewer && listing.producerId) {
        const raw = db.data.producers.find((x) => x.id === listing.producerId);
        if (raw && pack.producer) {
          pack.producer.phone = raw.phone || "";
          pack.producer.email = raw.email || "";
        }
      }
      return send(res, 200, { listing: pack });
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
      const listings = db.data.listings.filter((l) => l.producerId === p.id && l.status !== "sold" && !l.hidden).map(withProducer);
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
      db.data.follows.push({ userId: u.id, producerId: p.id, at: Date.now() });
      p.followers = (p.followers || 0) + 1;
      await db.save();
      var owner = db.data.users.find(function (x) { return x.id === p.userId; });
      if (owner && owner.id !== u.id) mail.followed(owner, u.name, p.name);
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
    mail.attach(db);
    server.timeout = 180000;
    server.headersTimeout = 180000;
    server.listen(PORT, () => {
      console.log("Herd Yard running on http://localhost:" + PORT + " persist=" + db.persist + " mail=" + mail.configured());
      if (mail.configured() && !db.data.mailSampleSentAt) {
        mail.sampleWelcome("david@davidjay.com", "David").then(function (r) {
          db.data.mailSampleSentAt = Date.now();
          db.data.mailSampleResult = r && (r.ErrorCode != null ? r : { ok: !r.error, error: r.error, skipped: r.skipped });
          return db.save();
        }).then(function () {
          console.log("[mail] sample welcome sent to david@davidjay.com", db.data.mailSampleResult);
        }).catch(function (err) {
          console.error("[mail] sample welcome failed", err && err.message);
        });
      }
      if (mail.configured() && !db.data.mailWeeklySampleSentAt) {
        var david = (db.data.users || []).find(function (u) {
          return String(u.email || "").toLowerCase() === "david@davidjay.com";
        }) || { email: "david@davidjay.com", name: "David", id: 0 };
        var stats = david.id ? weeklyMail.statsFor(db, david) : {
          name: "David", ranch: "Herd Yard", weekViews: 12, messages: 3, newListings: 1, newFollowers: 2, liveCount: 4, topTitle: "Black Angus pairs", topViews: 8
        };
        mail.weeklyStats(david, stats, weeklyMail.HIGHLIGHTS).then(function (r) {
          db.data.mailWeeklySampleSentAt = Date.now();
          db.data.mailWeeklySampleResult = r && (r.ErrorCode != null ? r : { ok: !r.error, error: r.error, skipped: r.skipped });
          return db.save();
        }).then(function () {
          console.log("[mail] sample weekly stats sent to david@davidjay.com", db.data.mailWeeklySampleResult);
        }).catch(function (err) {
          console.error("[mail] sample weekly stats failed", err && err.message);
        });
      }
      setInterval(function () {
        if (!mail.configured()) return;
        if (!weeklyMail.shouldSendMonday()) return;
        weeklyMail.run(db, mail, {}).then(function (r) {
          if (!r.skipped) console.log("[mail] weekly stats", r);
        }).catch(function (err) {
          console.error("[mail] weekly stats", err && err.message);
        });
      }, 30 * 60 * 1000);
    });
  })
  .catch((err) => {
    console.error("Failed to start store", err);
    process.exit(1);
  });
