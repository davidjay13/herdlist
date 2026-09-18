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
  const LOGO = "/logo.png?v=36";
  function isPlaceholderAvatar(v) {
    if (!v) return true;
    var s = String(v);
    if (s.indexOf("unsplash.com") >= 0) return true;
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
