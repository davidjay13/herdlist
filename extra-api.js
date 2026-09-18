const importedProducers = (() => {
  const files = ["./import-producers.json", "./import-producers-b.json"];
  const rows = [];
  files.forEach(function (f) {
    try {
      const part = require(f);
      if (Array.isArray(part)) part.forEach(function (r) { rows.push(r); });
    } catch (e) {}
  });
  return rows;
})();

module.exports = async function extraApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword } = ctx;
  const ADMINS = ["david@davidjay.com"];
  const COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";

  function isAdmin(u) {
    return !!(u && ADMINS.indexOf(String(u.email || "").toLowerCase()) >= 0);
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
    let producer = db.data.producers.find((p) => p.id === id || p.hyId === row.hyId || p.slug === row.slug);
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
        avatar: row.avatar || COW,
        imported: true,
        hyId: row.hyId,
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
    producer.imported = true;
    producer.hyId = row.hyId;
    producer.userId = userId;

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
          producerId: id,
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
        });
      } else {
        existing.image = image;
        existing.images = images;
        existing.title = L.title || existing.title;
        existing.breed = L.breed || existing.breed;
        existing.klass = L.klass || existing.klass;
        existing.location = L.location || existing.location;
        existing.description = L.description || existing.description;
        if (L.price != null && L.price !== "") {
          existing.price = Number(L.price);
          existing.priceType = "per_head";
        }
        existing.producerId = id;
        existing.userId = userId;
        existing.imported = true;
      }
    });
  }

  if (!db.data.importedHyMediaSep18 && importedProducers.length && importedProducers[0].hyId) {
    importedProducers.forEach(applyImportedRow);
    db.data.importedHy = true;
    db.data.importedHyContact = true;
    db.data.importedHyMediaSep18 = true;
    await db.save();
  }

  function withProducer(listing) {
    const p = db.data.producers.find((x) => x.id === listing.producerId);
    return Object.assign({}, listing, { producer: p || null });
  }

  if (url === "/api/me" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 200, { user: null, follows: [], admin: false }), true;
    const producer = db.data.producers.find((p) => p.userId === u.id) || null;
    const follows = db.data.follows.filter((f) => f.userId === u.id).map((f) => f.producerId);
    send(res, 200, {
      user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "", admin: isAdmin(u) },
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
        phone: user.phone || (producer && producer.phone) || "",
        admin: isAdmin(user),
        imported: !!user.imported || email.indexOf("@herd-yard.local") >= 0,
        producerName: producer ? producer.name : "",
        slug: producer ? producer.slug : "",
        location: producer ? producer.location : "",
        listingCount: listingCount,
        sold: producer ? producer.sold || 0 : 0,
        avatar: producer ? producer.avatar : "",
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
    if (b.phone !== undefined) u.phone = String(b.phone || "").trim();
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
    if (b.phone !== undefined) producer.phone = String(b.phone || "").trim();
    if (b.email !== undefined) producer.email = String(b.email || "").trim();
    if (b.website !== undefined) producer.website = String(b.website || "").trim();
    if (b.associations !== undefined) producer.associations = String(b.associations || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (typeof b.avatar === "string" && (b.avatar.startsWith("data:image") || b.avatar.startsWith("http"))) producer.avatar = b.avatar;
    if (typeof b.cover === "string" && (b.cover.startsWith("data:image") || b.cover.startsWith("http"))) producer.cover = b.cover;
    await db.save();
    send(res, 200, { user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "" }, producer });
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
