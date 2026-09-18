module.exports = async function extraApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword } = ctx;
  const ADMINS = ["david@davidjay.com"];
  const COW =
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";
  const COWS = [
    COW,
    "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1570042223119-0d2d2d6c1384?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1596733439284-f58b3c1d9858?auto=format&fit=crop&w=1200&q=80",
  ];
  const NOT_COW = ["1464226184884", "1416879595882", "1560493676", "1484557985045", "1477764250597"];

  function isAdmin(u) {
    return !!(u && ADMINS.indexOf(String(u.email || "").toLowerCase()) >= 0);
  }

  function cowify(src, i) {
    if (!src || typeof src !== "string") return COWS[i % COWS.length];
    if (src.indexOf("data:image") === 0) return src;
    for (var n = 0; n < NOT_COW.length; n++) {
      if (src.indexOf(NOT_COW[n]) >= 0) return COWS[i % COWS.length];
    }
    return src;
  }

  function withProducer(listing, i) {
    const p = db.data.producers.find((x) => x.id === listing.producerId);
    const image = cowify(listing.image, i || 0);
    const images = (listing.images && listing.images.length ? listing.images : [listing.image]).map(function (s, n) {
      return cowify(s, n);
    });
    return Object.assign({}, listing, { image: image, images: images, producer: p || null });
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

  if (url === "/api/listings" && method === "GET") {
    const u = userFromCookie(req);
    const q = new URL(req.url, "http://x").searchParams;
    let list = db.data.listings.slice();
    if (!isAdmin(u)) list = list.filter((l) => l.status !== "sold" && !l.hidden);
    if (q.get("category")) list = list.filter((l) => l.category === q.get("category"));
    if (q.get("breed")) list = list.filter((l) => l.breed === q.get("breed"));
    if (q.get("klass")) list = list.filter((l) => l.klass === q.get("klass"));
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
    db.data.listings.forEach(function (l) {
      l.hidden = hide;
    });
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
    if (b.email) {
      const email = String(b.email).trim().toLowerCase();
      if (db.data.users.some((x) => x.email === email && x.id !== u.id)) {
        return send(res, 409, { error: "That email is already in use." }), true;
      }
      u.email = email;
    }
    let producer = db.data.producers.find((p) => p.userId === u.id);
    if (!producer) {
      producer = {
        id: "u" + u.id,
        userId: u.id,
        slug: slugify(u.name) + "-" + u.id,
        name: u.name,
        owner: u.name,
        location: "",
        rating: 5,
        reviews: 0,
        sold: 0,
        followers: 0,
        about: "",
        operations: "",
        phone: "",
        associations: [],
        cover: COW,
        avatar: COWS[4],
      };
      db.data.producers.push(producer);
    }
    if (b.ranchName) producer.name = String(b.ranchName).trim();
    if (b.owner) producer.owner = String(b.owner).trim();
    if (b.location !== undefined) producer.location = String(b.location || "").trim();
    if (b.about !== undefined) producer.about = String(b.about || "");
    if (b.operations !== undefined) producer.operations = String(b.operations || "");
    if (b.associations !== undefined) {
      producer.associations = String(b.associations || "").split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (typeof b.avatar === "string" && b.avatar.startsWith("data:image")) producer.avatar = b.avatar;
    if (typeof b.cover === "string" && b.cover.startsWith("data:image")) producer.cover = b.cover;
    producer.phone = u.phone || "";
    await db.save();
    send(res, 200, { user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "", admin: isAdmin(u) }, producer });
    return true;
  }

  if (url === "/api/password" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const b = await readBody(req);
    const current = String(b.current || "");
    const next = String(b.next || "");
    if (next.length < 4) return send(res, 400, { error: "New password must be 4+ characters." }), true;
    if (!checkPassword(current, u.passwordHash)) return send(res, 401, { error: "Current password is wrong." }), true;
    u.passwordHash = hashPassword(next);
    await db.save();
    send(res, 200, { ok: true });
    return true;
  }

  const listingMatch = url.match(/^\/api\/listings\/([^/]+)$/);
  if (listingMatch && (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE")) {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const listing = db.data.listings.find((l) => l.id === listingMatch[1]);
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    if (listing.userId !== u.id && !isAdmin(u)) {
      return send(res, 403, { error: "You can only change your own listings." }), true;
    }
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
    if (b.hidden === true || b.hidden === false || b.hidden === "true" || b.hidden === "false") {
      listing.hidden = b.hidden === true || b.hidden === "true";
    }
    if (b.price === "" || b.price === null) {
      listing.price = null;
      listing.priceType = "contact";
    } else if (b.price != null) {
      listing.price = Number(b.price);
      listing.priceType = "per_head";
    }
    await db.save();
    send(res, 200, { listing: withProducer(listing) });
    return true;
  }

  return false;
};
