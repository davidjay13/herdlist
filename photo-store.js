const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(__dirname, "data", "uploads", "photos");
const MAX = 6 * 1024 * 1024;

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function extOf(name, type) {
  const n = String(name || "").toLowerCase();
  const t = String(type || "").toLowerCase();
  if (n.endsWith(".png") || t.indexOf("png") >= 0) return ".png";
  if (n.endsWith(".webp") || t.indexOf("webp") >= 0) return ".webp";
  if (n.endsWith(".gif") || t.indexOf("gif") >= 0) return ".gif";
  return ".jpg";
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function diskFile(urlPath) {
  const raw = decodeURIComponent(String(urlPath || "").split("?")[0]);
  if (raw.indexOf("/uploads/photos/") !== 0) return null;
  const base = path.basename(raw);
  if (!base || base.indexOf("..") >= 0) return null;
  return path.join(DIR, base);
}

function validPhoto(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (s.indexOf("/uploads/photos/") === 0 && s.indexOf("..") < 0) return s;
  if (s.indexOf("data:image") === 0) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === "/" && s.indexOf("..") < 0) return s;
  return "";
}

function persistDataUrl(s) {
  if (!s || String(s).indexOf("data:image") !== 0) return validPhoto(s);
  const m = String(s).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!m) return "";
  let buf;
  try { buf = Buffer.from(m[2], "base64"); } catch (e) { return ""; }
  if (!buf.length || buf.length > MAX) return "";
  ensureDir();
  const kind = m[1].toLowerCase();
  const ext = kind.indexOf("png") >= 0 ? ".png" : kind.indexOf("webp") >= 0 ? ".webp" : ".jpg";
  const id = crypto.randomBytes(12).toString("hex") + ext;
  fs.writeFileSync(path.join(DIR, id), buf);
  return "/uploads/photos/" + id;
}

function persistAny(s) {
  if (!s) return "";
  if (String(s).indexOf("data:image") === 0) return persistDataUrl(s);
  return validPhoto(s);
}

function persistList(arr) {
  const out = [];
  (arr || []).forEach(function (s) {
    const u = persistAny(s);
    if (u && out.indexOf(u) < 0) out.push(u);
  });
  return out.slice(0, 4);
}

function readRaw(req, max) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let n = 0;
    req.on("data", function (c) {
      n += c.length;
      if (n > max) {
        try { req.destroy(); } catch (e) {}
        reject(new Error("Photo is too large (6 MB max)."));
        return;
      }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

async function saveFromReq(req) {
  const type = String(req.headers["content-type"] || "");
  if (type.indexOf("image/") !== 0 && type.indexOf("application/octet-stream") !== 0) {
    throw new Error("Upload a photo (jpg, png, or webp).");
  }
  let name = "";
  try { name = decodeURIComponent(String(req.headers["x-file-name"] || "photo.jpg")); } catch (e) { name = "photo.jpg"; }
  const buf = await readRaw(req, MAX);
  if (!buf.length) throw new Error("Empty photo file.");
  ensureDir();
  const id = crypto.randomBytes(12).toString("hex") + extOf(name, type);
  fs.writeFileSync(path.join(DIR, id), buf);
  return { url: "/uploads/photos/" + id, bytes: buf.length };
}

module.exports = { persistAny, persistList, persistDataUrl, saveFromReq, diskFile, mimeFor, validPhoto, MAX, DIR };
