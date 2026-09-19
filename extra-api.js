const mail = require("./mail");
const weeklyMail = require("./weekly-mail");
const videoStore = require("./video-store");
const photoStore = require("./photo-store");
const seo = require("./seo");

const importedProducers = (() => {
  const rows = [];
  for (let i = 0; i < 8; i++) {
    try {
      const part = require("./import-p" + i + ".json");
      if (Array.isArray(part)) part.forEach(function (r) { rows.push(r); });
    } catch (e) {}
  }
  try {
    const legacy = require("./import-producers.json");
    if (Array.isArray(legacy)) legacy.forEach(function (r) {
      if (!rows.some(function (x) { return x.hyId === r.hyId; })) rows.push(r);
    });
  } catch (e) {}
  return rows;
})();

module.exports = async function extraApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword } = ctx;
  const ADMINS = ["david@davidjay.com"];
  const COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
  const LOGO = "/cowboy.svg?v=2";
  function isPlaceholderAvatar(v) {
    if (!v) return true;
    var s = String(v);
    if (s.indexOf("unsplash.com") >= 0) return true;
    if (/logo\.(svg|png)/i.test(s)) return true;
    return false;
  }
  function avatarSrc(v) {
    return isPlaceholderAvatar(v) ? LOGO : v;
  }
  function normName(s) {
    return String(s || "").toLowerCase().replace(/and/g, "").replace(/[^a-z0-9]/g, "");
  }
  function isImageValue(s) {
    if (typeof s !== "string") return false;
    return s.startsWith("data:image") || s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
  }

  function isAdmin(u) {
    return !!(u && ADMINS.indexOf(String(u.email || "").toLowerCase()) >= 0);
  }

  function findImportedProducer(row) {
    const id = "hy" + row.hyId;
    return (
      db.data.producers.find((p) => p.id === id || p.hyId === row.hyId || p.slug === row.slug) ||
      db.data.producers.find((p) => normName(p.name) && normName(p.name) === normName(row.name)) ||
      null
    );
  }

  function applyImportedRow(row) {
    const id = "hy" + row.hyId;
    const userId = 8000 + Number(row.hyId);
    let user = db.data.users.find((u) => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        name: row.owner || row.name,
        email: row.email || "imported+" + row.hyId + "@herd-yard.local",
        passwordHash: hashPassword("imported-" + row.hyId),
        imported: true,
        phone: row.phone || "",
      };
      db.data.users.push(user);
    } else {
      const clash = (db.data.users || []).find(
        (u) => u.id !== userId && row.email && String(u.email || "").toLowerCase() === String(row.email).toLowerCase() && !u.imported
      );
      if (row.email && !clash) user.email = row.email;
      if (row.phone) user.phone = row.phone;
      if (row.owner) user.name = row.owner;
      user.imported = true;
    }
    let producer = findImportedProducer(row);
    if (!producer) {
      producer = {
        id: id,
        userId: userId,
        slug: String(row.slug || slugify(row.name)).replace(/[^a-z0-9-]/g, "-"),
        name: row.name,
        owner: row.owner || row.name,
        location: row.location || "",
        rating: row.rating || 5,
        reviews: row.reviews || 0,
        sold: row.sold || 0,
        followers: row.followers || 0,
        about: row.about || "",
        operations: "",
        associations: [],
        cover: row.cover || COW,
        avatar: row.avatar || LOGO,
        imported: true,
        hyId: row.hyId,
        lat: row.lat || null,
        lng: row.lng || null,
      };
      db.data.producers.push(producer);
    }
    producer.name = row.name || producer.name;
    if (row.owner) producer.owner = row.owner;
    if (row.location) producer.location = row.location;
    if (row.about) producer.about = row.about;
    if (row.cover) producer.cover = row.cover;
    if (row.avatar) producer.avatar = row.avatar;
    if (row.email) producer.email = row.email;
    if (row.phone) producer.phone = row.phone;
    if (row.website) producer.website = row.website;
    if (row.photos && row.photos.length) producer.photos = row.photos;
    if (row.reviews) producer.reviews = row.reviews;
    if (row.followers) producer.followers = row.followers;
    if (row.sold != null) producer.sold = row.sold;
    if (row.rating) producer.rating = row.rating;
    if (row.lat) producer.lat = row.lat;
    if (row.lng) producer.lng = row.lng;
    producer.imported = true;
    producer.hyId = row.hyId;
    producer.userId = userId;
    producer.slugAliases = Array.from(new Set([].concat(producer.slugAliases || [], [producer.slug, row.slug].filter(Boolean))));

    const listings = Array.isArray(row.listings) ? row.listings : [];
    listings.forEach(function (L) {
      if (!L || !L.hyListingId) return;
      const lid = "hyL" + L.hyListingId;
      const image = L.image || (L.images && L.images[0]) || row.cover || row.avatar || COW;
      const images = Array.isArray(L.images) && L.images.length ? L.images : [image];
      let existing = db.data.listings.find((x) => x.id === lid || x.hyListingId === L.hyListingId);
      if (!existing) {
        db.data.listings.push({
          id: lid,
          hyListingId: L.hyListingId,
          producerId: producer.id,
          userId: userId,
          title: L.title || row.name + " listing",
          breed: L.breed || "",
          klass: L.klass || "",
          category: L.category || "Cattle",
          head: L.head || 1,
          unit: String(L.category || "").toLowerCase().indexOf("genetic") >= 0 ? "Units" : "Head",
          price: L.price == null || L.price === "" ? null : Number(L.price),
          priceType: L.price == null || L.price === "" ? "contact" : "per_head",
          daysLeft: 60,
          listedAt: L.listedAt || new Date().toISOString().slice(0, 10),
          location: L.location || row.location || "",
          status: L.status === "sold" ? "sold" : "active",
          image: image,
          images: images,
          description: L.description || "",
          imported: true,
          hidden: false,
          lat: row.lat || null,
          lng: row.lng || null,
        });
      } else {
        if (!existing.imageLocked) {
          existing.image = image;
          existing.images = images;
        }
        existing.title = L.title || existing.title;
        if (L.price != null && L.price !== "") {
          existing.price = Number(L.price);
          existing.priceType = "per_head";
        }
        existing.producerId = producer.id;
        existing.userId = userId;
        existing.imported = true;
      }
    });
  }

  if (!db.data.importedHyLiveSep18) {
    importedProducers.forEach(applyImportedRow);
    try {
      const liveRows = await require("./hy-import-live")();
      liveRows.forEach(applyImportedRow);
    } catch (e) {}
    db.data.importedHy = true;
    db.data.importedHyContact = true;
    db.data.importedHyMediaSep18 = true;
    db.data.importedHyRefreshSep18d = true;
    db.data.importedHyRefreshSep18e = true;
    db.data.importedHyRefreshSep18f = true;
    db.data.importedHyLiveSep18 = true;
    await db.save();
  }

  (db.data.producers || []).forEach(function (p) {
    if (isPlaceholderAvatar(p.avatar)) p.avatar = LOGO;
  });

  function remainingDays(listedAt, stored) {
    const t = Date.parse(listedAt || "");
    if (!t) return Math.max(0, Number(stored || 0) || 0);
    return Math.max(0, Math.ceil((t + 60 * 86400000 - Date.now()) / 86400000));
  }
  function publicProducer(p, revealContact) {
    if (!p) return null;
    const out = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      owner: p.owner,
      location: p.location || "",
      rating: p.rating,
      reviews: p.reviews,
      sold: p.sold || 0,
      followers: p.followers || 0,
      about: p.about || "",
      operations: p.operations || "",
      associations: p.associations || [],
      cover: p.cover,
      coverVideo: p.coverVideo || ((p.slug === "abn-ranch" || p.id === "hy26") ? "/abn-header.mp4" : ""),
      avatar: avatarSrc(p.avatar),
      lat: p.lat,
      lng: p.lng,
      website: p.website || "",
    };
    if (revealContact) {
      out.phone = p.phone || "";
      out.email = p.email || "";
    }
    return out;
  }

  function withProducer(listing, revealContact) {
    const p = db.data.producers.find((x) => x.id === listing.producerId);
    return Object.assign({}, listing, {
      daysLeft: remainingDays(listing.listedAt, listing.daysLeft),
      producer: publicProducer(p, revealContact),
    });
  }

  if (url === "/api/me" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 200, { user: null, follows: [], admin: false }), true;
    const producer = db.data.producers.find((p) => p.userId === u.id) || null;
    const follows = db.data.follows.filter((f) => f.userId === u.id).map((f) => f.producerId);
    send(res, 200, {
      user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "", admin: isAdmin(u), emailWeeklyStats: !!u.emailWeeklyStats, emailUpdates: !!u.emailUpdates, emailPartners: !!u.emailPartners },
      producer: producer ? Object.assign({}, producer, { avatar: avatarSrc(producer.avatar) }) : null,
      follows,
      admin: isAdmin(u),
    });
    return true;
  }

  if (url === "/api/upload/photo" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    try {
      const saved = await photoStore.saveFromReq(req);
      send(res, 200, saved);
    } catch (err) {
      send(res, 400, { error: (err && err.message) || "Could not upload photo." });
    }
    return true;
  }

  if (url === "/api/stats/hit" && method === "POST") {
    const b = await readBody(req);
    const pathName = String((b && b.path) || "").slice(0, 180);
    if (!pathName || pathName.indexOf("/account") === 0 || pathName.indexOf("/signin") === 0) {
      send(res, 200, { ok: true, skipped: true });
      return true;
    }
    if (!Array.isArray(db.data.hits)) db.data.hits = [];
    db.data.hits.push({
      at: Date.now(),
      path: pathName,
      ref: String((b && b.ref) || "").slice(0, 180)
    });
    if (db.data.hits.length > 8000) db.data.hits = db.data.hits.slice(-6000);
    if (db.data.hits.length % 20 === 0) await db.save();
    send(res, 200, { ok: true });
    return true;
  }

  if (url === "/api/admin/traffic" && method === "GET") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const hits = Array.isArray(db.data.hits) ? db.data.hits : [];
    const since = Date.now() - 7 * 86400000;
    const week = hits.filter(function (h) { return h && h.at >= since; });
    const pages = {};
    const refs = {};
    week.forEach(function (h) {
      const p = h.path || "/";
      pages[p] = (pages[p] || 0) + 1;
      const r = h.ref || "(direct)";
      refs[r] = (refs[r] || 0) + 1;
    });
    function top(obj) {
      return Object.keys(obj).map(function (k) { return { name: k, n: obj[k] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, 20);
    }
    send(res, 200, { week: week.length, all: hits.length, pages: top(pages), refs: top(refs) });
    return true;
  }

  if (url === "/api/upload/video" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    try {
      const saved = await videoStore.saveFromReq(req);
      send(res, 200, saved);
    } catch (err) {
      send(res, 400, { error: (err && err.message) || "Could not upload video." });
    }
    return true;
  }

  if (url === "/api/producers" && method === "GET") {
    send(res, 200, { producers: db.data.producers.map(function (p) {
      return publicProducer(p, false);
    }) });
    return true;
  }

  if (url === "/api/admin/test-email" && method === "POST") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const b = await readBody(req);
    const to = String((b && b.to) || u.email || "").trim();
    const r = await mail.sampleWelcome(to, u.name || "David");
    send(res, 200, { ok: !r.error && !r.skipped, result: r, to: to });
    return true;
  }

  if (url === "/api/admin/weekly-stats" && method === "POST") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const r = await weeklyMail.run(db, mail, { force: true });
    send(res, 200, r);
    return true;
  }

  if ((url === "/api/cron/weekly-stats") && (method === "GET" || method === "POST")) {
    const q = new URL(req.url, "http://x").searchParams;
    const key = q.get("key") || req.headers["x-cron-key"] || "";
    const expect = process.env.CRON_SECRET || "";
    if (!expect || key !== expect) return send(res, 401, { error: "Bad cron key" }), true;
    if (!weeklyMail.shouldSendMonday()) {
      send(res, 200, { skipped: true, reason: "not-monday-morning" });
      return true;
    }
    const r = await weeklyMail.run(db, mail, {});
    send(res, 200, r);
    return true;
  }

  if (url === "/api/admin/mail" && method === "GET") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const emails = Array.isArray(db.data.mailLog) ? db.data.mailLog.slice() : [];
    send(res, 200, { emails: emails, count: emails.length });
    return true;
  }

  if (url === "/api/admin/accounts" && method === "GET") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const accounts = (db.data.users || []).map(function (user) {
      const producer = db.data.producers.find((p) => p.userId === user.id) || null;
      const listingCount = (db.data.listings || []).filter((l) => l.userId === user.id).length;
      const email = String(user.email || "");
      return {
        id: user.id,
        name: user.name || "",
        email: email,
        phone: user.phone || (producer && producer.phone) || "",
        admin: isAdmin(user),
        imported: !!user.imported || email.indexOf("@herd-yard.local") >= 0,
        producerName: producer ? producer.name : "",
        producerId: producer ? producer.id : "",
        slug: producer ? producer.slug : "",
        location: producer ? producer.location : "",
        listingCount: listingCount,
        sold: producer ? producer.sold || 0 : 0,
        avatar: avatarSrc(producer ? producer.avatar : ""),
      };
    });
    send(res, 200, { accounts: accounts, count: accounts.length });
    return true;
  }

  if (url === "/api/listings" && method === "GET") {
    const u = userFromCookie(req);
    let list = db.data.listings.slice();
    if (!isAdmin(u)) {
      list = list.filter((l) => l.status !== "sold" && !l.hidden && !seo.isTestListing(l));
    }
    send(res, 200, { listings: list.map((l) => withProducer(l, false)) });
    return true;
  }

  if (url === "/api/admin/listings" && method === "GET") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    send(res, 200, { listings: db.data.listings.map((l) => withProducer(l, true)), admin: true });
    return true;
  }

  if (url === "/api/my/listings" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const list = db.data.listings.filter((l) => l.userId === u.id);
    send(res, 200, { listings: list.map((l) => withProducer(l, true)), admin: isAdmin(u) });
    return true;
  }

  const listingIdMatch = url.match(/^\/api\/listings\/([^/]+)$/);
  if (listingIdMatch && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const listing = db.data.listings.find((l) => l.id === decodeURIComponent(listingIdMatch[1]));
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    if (!isAdmin(u) && listing.userId !== u.id) return send(res, 403, { error: "Not your listing" }), true;
    if (method === "DELETE") {
      db.data.listings = db.data.listings.filter((l) => l.id !== listing.id);
      await db.save();
      return send(res, 200, { ok: true }), true;
    }
    const b = await readBody(req);
    if (b.title != null) listing.title = String(b.title).trim() || listing.title;
    if (b.breed != null) listing.breed = String(b.breed);
    if (b.klass != null) listing.klass = String(b.klass);
    if (b.head != null && b.head !== "") listing.head = Number(b.head);
    if (b.price !== undefined) {
      listing.price = b.price === "" || b.price == null ? null : Number(b.price);
      listing.priceType = listing.price == null ? "contact" : "per_head";
    }
    if (b.location != null) listing.location = String(b.location);
    if (b.status) listing.status = String(b.status);
    if (b.description != null) listing.description = String(b.description);
    if (b.hidden != null) listing.hidden = !!b.hidden;
    if (b.video !== undefined) listing.video = videoStore.validVideo(b.video);
    const uploaded = photoStore.persistList(
      (Array.isArray(b.images) ? b.images : []).concat(isImageValue(b.image) ? [b.image] : [])
    );
    if (uploaded.length) {
      listing.image = uploaded[0];
      listing.images = uploaded;
      listing.imageLocked = true;
    } else if (isImageValue(b.image)) {
      listing.image = photoStore.persistAny(b.image) || b.image;
      listing.images = [listing.image].concat((listing.images || []).slice(1)).slice(0, 4);
      listing.imageLocked = true;
    }
    await db.save();
    send(res, 200, { listing: withProducer(listing, isAdmin(u) || listing.userId === u.id) });
    return true;
  }

  if (url === "/api/profile" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const b = await readBody(req);
    if (b.name) u.name = String(b.name).trim();
    if (b.phone !== undefined) u.phone = String(b.phone || "").trim();
    function flag(key) {
      if (b[key] === undefined) return;
      const v = b[key];
      u[key] = v === true || v === 1 || v === "1" || v === "on" || v === "true";
    }
    const wasStats = !!u.emailWeeklyStats;
    flag("emailWeeklyStats");
    flag("emailUpdates");
    flag("emailPartners");
    let producer = db.data.producers.find((p) => p.userId === u.id);
    if (!producer) {
      producer = { id: "u" + u.id, userId: u.id, slug: slugify(u.name) + "-" + u.id, name: u.name, owner: u.name, location: "", rating: 5, reviews: 0, sold: 0, followers: 0, about: "", operations: "", associations: [], cover: COW, avatar: LOGO };
      db.data.producers.push(producer);
    }
    if (b.ranchName) producer.name = String(b.ranchName).trim();
    if (b.owner) producer.owner = String(b.owner).trim();
    if (b.location !== undefined) producer.location = String(b.location || "").trim();
    if (b.about !== undefined) producer.about = String(b.about || "");
    if (b.operations !== undefined) producer.operations = String(b.operations || "");
    if (b.phone !== undefined) producer.phone = String(b.phone || "").trim();
    if (b.email !== undefined) {
      const email = String(b.email || "").trim().toLowerCase();
      producer.email = email;
      if (email && email.indexOf("@") > 0) {
        const taken = (db.data.users || []).some((x) => x.id !== u.id && String(x.email || "").toLowerCase() === email);
        if (!taken) u.email = email;
      }
    }
    if (b.website !== undefined) producer.website = String(b.website || "").trim();
    if (b.associations !== undefined) {
      producer.associations = String(b.associations || "").split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (typeof b.avatar === "string" && (b.avatar.startsWith("data:image") || b.avatar.startsWith("http"))) producer.avatar = b.avatar;
    if (typeof b.cover === "string" && (b.cover.startsWith("data:image") || b.cover.startsWith("http"))) producer.cover = b.cover;
    if (u.emailWeeklyStats && !wasStats) {
      try {
        u.statsSnap = weeklyMail.snapshot(db, u);
      } catch (e) {}
    }
    await db.save();
    send(res, 200, { user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "", emailWeeklyStats: !!u.emailWeeklyStats, emailUpdates: !!u.emailUpdates, emailPartners: !!u.emailPartners }, producer: Object.assign({}, producer, { avatar: avatarSrc(producer.avatar) }) });
    return true;
  }


  const adminProdMatch = url.match(/^\/api\/admin\/producers\/([^/]+)$/);
  if (adminProdMatch && method === "POST") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const key = decodeURIComponent(adminProdMatch[1]);
    const producer = db.data.producers.find((p) => p.id === key || p.slug === key || String(p.hyId) === key);
    if (!producer) return send(res, 404, { error: "Ranch not found" }), true;
    const b = await readBody(req);
    if (b.ranchName || b.name) producer.name = String(b.ranchName || b.name).trim();
    if (b.owner !== undefined) producer.owner = String(b.owner || "").trim();
    if (b.location !== undefined) producer.location = String(b.location || "").trim();
    if (b.about !== undefined) producer.about = String(b.about || "");
    if (b.operations !== undefined) producer.operations = String(b.operations || "");
    if (b.phone !== undefined) producer.phone = String(b.phone || "").trim();
    if (b.email !== undefined) producer.email = String(b.email || "").trim();
    if (b.website !== undefined) producer.website = String(b.website || "").trim();
    if (b.associations !== undefined) {
      producer.associations = String(b.associations || "").split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (typeof b.avatar === "string" && (b.avatar.startsWith("data:image") || b.avatar.startsWith("http") || b.avatar.startsWith("/"))) producer.avatar = b.avatar;
    if (typeof b.cover === "string" && (b.cover.startsWith("data:image") || b.cover.startsWith("http") || b.cover.startsWith("/"))) producer.cover = b.cover;
    if (b.lat !== undefined) producer.lat = b.lat === "" || b.lat == null ? null : Number(b.lat);
    if (b.lng !== undefined) producer.lng = b.lng === "" || b.lng == null ? null : Number(b.lng);
    await db.save();
    send(res, 200, { producer: Object.assign({}, producer, { avatar: avatarSrc(producer.avatar) }) });
    return true;
  }

  const prodMatch = url.match(/^\/api\/producers\/([^/]+)$/);
  if (prodMatch && method === "GET") {
    const key = decodeURIComponent(prodMatch[1]);
    const nk = normName(key);
    const p = db.data.producers.find((x) =>
      x.slug === key ||
      x.id === key ||
      String(x.hyId) === key ||
      (x.slugAliases || []).indexOf(key) >= 0 ||
      normName(x.slug) === nk ||
      normName(x.name) === nk
    );
    if (!p) return send(res, 404, { error: "Ranch not found" }), true;
    const viewer = userFromCookie(req);
    const listings = db.data.listings
      .filter((l) => l.producerId === p.id && l.status !== "sold" && !l.hidden)
      .map((l) => withProducer(l, false));
    send(res, 200, { producer: publicProducer(p, !!viewer), listings });
    return true;
  }

  return false;
};
