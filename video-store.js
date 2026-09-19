const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(__dirname, "data", "uploads", "videos");
const MAX = 40 * 1024 * 1024;

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function validVideo(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (s.indexOf("/uploads/videos/") === 0 && s.indexOf("..") < 0) return s;
  if (!/^https?:\/\//i.test(s)) return "";
  if (/(youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)|\.webm($|\?)|\.mov($|\?))/i.test(s)) return s;
  return "";
}

function extOf(name, type) {
  const n = String(name || "").toLowerCase();
  const t = String(type || "").toLowerCase();
  if (n.endsWith(".webm") || t.indexOf("webm") >= 0) return ".webm";
  if (n.endsWith(".mov") || t.indexOf("quicktime") >= 0) return ".mov";
  return ".mp4";
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}

function diskFile(urlPath) {
  const raw = decodeURIComponent(String(urlPath || "").split("?")[0]);
  if (raw.indexOf("/uploads/videos/") !== 0) return null;
  const base = path.basename(raw);
  if (!base || base.indexOf("..") >= 0) return null;
  return path.join(DIR, base);
}

function readRaw(req, max) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let n = 0;
    req.on("data", function (c) {
      n += c.length;
      if (n > max) {
        try { req.destroy(); } catch (e) {}
        reject(new Error("Video is too large (40 MB max)."));
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
  if (type.indexOf("video/") !== 0 && type.indexOf("application/octet-stream") !== 0) {
    throw new Error("Upload a video file (mp4, webm, or mov).");
  }
  let name = "";
  try { name = decodeURIComponent(String(req.headers["x-file-name"] || "clip.mp4")); } catch (e) { name = "clip.mp4"; }
  const buf = await readRaw(req, MAX);
  if (!buf.length) throw new Error("Empty video file.");
  ensureDir();
  const id = crypto.randomBytes(12).toString("hex") + extOf(name, type);
  fs.writeFileSync(path.join(DIR, id), buf);
  return { url: "/uploads/videos/" + id, bytes: buf.length };
}

module.exports = { validVideo, saveFromReq, diskFile, mimeFor, MAX, DIR };
