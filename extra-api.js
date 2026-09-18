module.exports = async function extraApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie, slugify, hashPassword, checkPassword } = ctx;
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
        cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80",
        avatar: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80",
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
    send(res, 200, { user: { id: u.id, name: u.name, email: u.email, phone: u.phone || "" }, producer });
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
  return false;
};
