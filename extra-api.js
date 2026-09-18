const importedProducers = (() => {
  try {
    const rows = require("./import-producers.json");
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
})();

module.exports = async function extraApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword } = ctx;
  const ADMINS = ["david@davidjay.com"];
  const COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";

  function isAdmin(u) {
    return !!(u && ADMINS.indexOf(String(u.email || "").toLowerCase()) >= 0);
  }

  if (!db.data.importedHy && importedProducers.length && importedProducers[0].hyId) {
    importedProducers.forEach(function (row) {
      const id = "hy" + row.hyId;
      if (db.data.producers.some((p) => p.id === id || p.slug === row.slug)) return;
      const userId = 8000 + Number(row.hyId);
      if (!db.data.users.some((u) => u.id === userId)) {
        db.data.users.push({
          id: userId,
          name: row.name,
          email: "imported+" + row.hyId + "@herd-yard.local",
          passwordHash: hashPassword("imported-" + row.hyId),
          imported: true,
        });
      }
      db.data.producers.push({
        id: id,
        userId: userId,
        slug: String(row.slug || slugify(row.name)).replace(/[^a-z0-9-]/g, "-"),
        name: row.name,
        owner: row.name,
        location: row.location || "",
        rating: row.rating || 5,
        reviews: 0,
        sold: row.sold || 0,
        followers: 0,
        about: row.about || "",
        operations: "",
        associations: [],
        cover: COW,
        avatar: COW,
        imported: true,
        hyId: row.hyId,
      });
    });
    db.data.importedHy = true;
    await db.save();
  }

  function withProducer(listing, i) {
    const p = db.data.producers.find((x) => x.id === listing.producerId);
    return Object.assign({}, listing, { producer: p || null });
  }

  if (url === "/api/me" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 200, { user: null, follows: [], admin: false }), true;
    const producer = db.data.producers.find((p) => p.userId === u.id) || null;
    const follows = db.data.follows.filter((f) => f.userId === u.id).map((f) => f.producerId);
    send(res, 200, {
      user: { id: u.id, name: u.name, email: u.email, admin: isAdmin(u) },
      producer,
      follows,
      admin: isAdmin(u),
    });
    return true;
  }

  if (url === "/api/producers" && method === "GET") {
    send(res, 200, { producers: db.data.producers });
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
        admin: isAdmin(user),
        imported: !!user.imported || email.indexOf("@herd-yard.local") >= 0,
        producerName: producer ? producer.name : "",
        slug: producer ? producer.slug : "",
        location: producer ? producer.location : "",
        listingCount: listingCount,
        sold: producer ? producer.sold || 0 : 0,
      };
    });
    send(res, 200, { accounts: accounts, count: accounts.length });
    return true;
  }

  if (url === "/api/listings" && method === "GET") {
    const u = userFromCookie(req);
    let list = db.data.listings.slice();
    if (!isAdmin(u)) list = list.filter((l) => l.status !== "sold" && !l.hidden);
    send(res, 200, { listings: list.map(withProducer) });
    return true;
  }

  if (url === "/api/my/listings" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const list = isAdmin(u) ? db.data.listings : db.data.listings.filter((l) => l.userId === u.id);
    send(res, 200, { listings: list.map(withProducer), admin: isAdmin(u) });
    return true;
  }

  if (url === "/api/admin/visibility" && method === "POST") {
    const u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    const b = await readBody(req);
    const hide = !!b.hide;
    db.data.listings.forEach(function (l) { l.hidden = hide; });
    await db.save();
    send(res, 200, { ok: true, hidden: hide, count: db.data.listings.length });
    return true;
  }

  if (url === "/api/profile" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const b = await readBody(req);
    if (b.name) u.name = String(b.name).trim();
    let producer = db.data.producers.find((p) => p.userId === u.id);
    if (!producer) {
      producer = { id: "u" + u.id, userId: u.id, slug: slugify(u.name) + "-" + u.id, name: u.name, owner: u.name, location: "", rating: 5, reviews: 0, sold: 0, followers: 0, about: "", operations: "", associations: [], cover: COW, avatar: COW };
      db.data.producers.push(producer);
    }
    if (b.ranchName) producer.name = String(b.ranchName).trim();
    if (b.owner) producer.owner = String(b.owner).trim();
    if (b.location !== undefined) producer.location = String(b.location || "").trim();
    if (b.about !== undefined) producer.about = String(b.about || "");
    if (b.operations !== undefined) producer.operations = String(b.operations || "");
    if (b.associations !== undefined) producer.associations = String(b.associations || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (typeof b.avatar === "string" && b.avatar.startsWith("data:image")) producer.avatar = b.avatar;
    if (typeof b.cover === "string" && b.cover.startsWith("data:image")) producer.cover = b.cover;
    await db.save();
    send(res, 200, { user: { id: u.id, name: u.name, email: u.email }, producer });
    return true;
  }

  const listingMatch = url.match(/^\/api\/listings\/([^/]+)$/);
  if (listingMatch && (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE")) {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const listing = db.data.listings.find((l) => l.id === listingMatch[1]);
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    if (listing.userId !== u.id && !isAdmin(u)) return send(res, 403, { error: "You can only change your own listings." }), true;
    if (method === "DELETE") {
      db.data.listings = db.data.listings.filter((l) => l.id !== listing.id);
      await db.save();
      send(res, 200, { ok: true });
      return true;
    }
    const b = await readBody(req);
    if (b.title != null) listing.title = String(b.title).trim() || listing.title;
    if (b.breed != null) listing.breed = String(b.breed);
    if (b.klass != null) listing.klass = String(b.klass);
    if (b.category != null) listing.category = String(b.category);
    if (b.head != null) listing.head = Number(b.head || listing.head);
    if (b.location != null) listing.location = String(b.location);
    if (b.description != null) listing.description = String(b.description);
    if (b.status === "sold" || b.status === "active") listing.status = b.status;
    if (b.hidden === true || b.hidden === false || b.hidden === "true" || b.hidden === "false") listing.hidden = b.hidden === true || b.hidden === "true";
    if (b.price === "" || b.price === null) { listing.price = null; listing.priceType = "contact"; }
    else if (b.price != null) { listing.price = Number(b.price); listing.priceType = "per_head"; }
    await db.save();
    send(res, 200, { listing: withProducer(listing) });
    return true;
  }

  return false;
};
