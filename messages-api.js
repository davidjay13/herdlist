const mail = require("./mail");
module.exports = async function messagesApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie } = ctx;
  if (!db.data.messages) db.data.messages = [];
  const LOGO = "/cowboy.svg?v=2";

  function userName(id) {
    const user = (db.data.users || []).find((x) => x.id === id);
    if (user) return user.name || user.email || "Member";
    return "Member";
  }
  function isPlaceholder(v) {
    if (!v) return true;
    var s = String(v);
    if (s.indexOf("unsplash.com") >= 0) return true;
    if (/logo\.(svg|png)/i.test(s)) return true;
    return false;
  }
  function avatarForUser(id) {
    const producer = (db.data.producers || []).find((p) => p.userId === id);
    if (producer && !isPlaceholder(producer.avatar)) return producer.avatar;
    const listing = (db.data.listings || []).find((l) => l.userId === id && l.image);
    if (listing && listing.image && String(listing.image).indexOf("unsplash.com") < 0) return listing.image;
    return LOGO;
  }
  function avatarForProducer(id) {
    const producer = (db.data.producers || []).find((p) => p.id === id);
    if (producer && !isPlaceholder(producer.avatar)) return producer.avatar;
    if (producer) return avatarForUser(producer.userId);
    return LOGO;
  }
  function decorateMessage(m, u) {
    const listing = (db.data.listings || []).find((l) => l.id === m.listingId) || null;
    const producer =
      (db.data.producers || []).find((p) => p.id === m.toProducer) ||
      (listing && (db.data.producers || []).find((p) => p.id === listing.producerId)) ||
      null;
    const sent = m.fromUser === u.id;
    const fromAvatar = avatarForUser(m.fromUser);
    const toAvatar = producer ? avatarForProducer(producer.id) : avatarForUser(m.toUser || (producer && producer.userId));
    return {
      id: m.id || null,
      listingId: m.listingId,
      listingTitle: listing ? listing.title : "Listing",
      fromUser: m.fromUser,
      fromName: userName(m.fromUser),
      fromAvatar: fromAvatar,
      toUser: m.toUser || (producer && producer.userId) || null,
      toName: producer ? producer.name : userName(m.toUser),
      toAvatar: toAvatar,
      toProducer: m.toProducer || (listing && listing.producerId) || null,
      body: m.body || "",
      at: m.at || 0,
      direction: sent ? "sent" : "received",
    };
  }

  const contactMatch = url.match(/^\/api\/listings\/([^/]+)\/contact$/);
  if (contactMatch && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const listing = db.data.listings.find((l) => l.id === decodeURIComponent(contactMatch[1]));
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    const b = await readBody(req);
    const body = String(b.body || "").trim() || "Interested.";
    const ownerId = listing.userId;
    const toUser = ownerId && ownerId !== u.id ? ownerId : null;
    const msg = {
      id: "m" + Date.now(),
      listingId: listing.id,
      fromUser: u.id,
      toUser: toUser,
      toProducer: listing.producerId,
      body: body,
      at: Date.now(),
    };
    db.data.messages.push(msg);
    await db.save();
    if (toUser) {
      var owner = db.data.users.find(function (x) { return x.id === toUser; });
      if (owner) mail.newMessage(owner, u.name, listing.title, body, listing.id);
    }
    send(res, 200, { ok: true, message: decorateMessage(msg, u) });
    return true;
  }

  if (url === "/api/messages" && method === "GET") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const producer = db.data.producers.find((p) => p.userId === u.id);
    const mine = db.data.messages.filter(function (m) {
      if (m.fromUser === u.id) return true;
      if (m.toUser === u.id) return true;
      if (producer && m.toProducer === producer.id) return true;
      return false;
    });
    mine.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    send(res, 200, { messages: mine.map(function (m) { return decorateMessage(m, u); }) });
    return true;
  }

  if (url === "/api/messages" && method === "POST") {
    const u = userFromCookie(req);
    if (!u) return send(res, 401, { error: "Sign in required" }), true;
    const b = await readBody(req);
    const body = String(b.body || "").trim();
    if (!body) return send(res, 400, { error: "Write a message first." }), true;
    const listing = db.data.listings.find((l) => l.id === b.listingId);
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    const producer = db.data.producers.find((p) => p.userId === u.id);
    const owns = listing.userId === u.id || (producer && listing.producerId === producer.id);
    let toUser = b.toUser != null && b.toUser !== "" ? Number(b.toUser) : null;
    if (!toUser) toUser = owns ? null : listing.userId;
    const msg = {
      id: "m" + Date.now(),
      listingId: listing.id,
      fromUser: u.id,
      toUser: toUser && toUser !== u.id ? toUser : null,
      toProducer: listing.producerId,
      body: body,
      at: Date.now(),
    };
    db.data.messages.push(msg);
    await db.save();
    if (msg.toUser) {
      var recip = db.data.users.find(function (x) { return x.id === msg.toUser; });
      if (recip) mail.newMessage(recip, u.name, listing.title, body, listing.id);
    }
    send(res, 200, { ok: true, message: decorateMessage(msg, u) });
    return true;
  }

  return false;
};
