const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DIR = path.join(__dirname, "public", "og", "ranch");
const FALLBACK = path.join(__dirname, "public", "og", "ranch.jpg");
const PY = path.join(__dirname, "og-ranch-card.py");

function slugOf(p) {
  return String((p && (p.slug || p.id)) || "ranch")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ranch";
}

function hasVideo(p) {
  if (!p) return false;
  if (p.coverVideo) return true;
  const slug = String(p.slug || "");
  const id = String(p.id || "");
  return slug === "abn-ranch" || id === "hy26";
}

function thumbPath(p) {
  return "/og/ranch/" + slugOf(p) + (hasVideo(p) ? ".gif" : ".jpg");
}

function coverSrc(p) {
  const c = String((p && (p.cover || p.avatar)) || "");
  if (!c || c.indexOf("data:") === 0) return "-";
  if (c.indexOf("/uploads/photos/") === 0) {
    const disk = path.join(__dirname, "data", "uploads", "photos", path.basename(c.split("?")[0]));
    if (fs.existsSync(disk)) return disk;
  }
  if (c.charAt(0) === "/" && c.indexOf("..") < 0) {
    const disk = path.join(__dirname, "public", c.split("?")[0].replace(/^\//, ""));
    if (fs.existsSync(disk)) return disk;
  }
  return c;
}

function videoSrc(p) {
  const v = String((p && p.coverVideo) || (hasVideo(p) ? "/abn-header.mp4" : "")).split("?")[0];
  if (!v) return "";
  if (v.charAt(0) === "/") {
    const disk = path.join(__dirname, "public", v.replace(/^\//, ""));
    if (fs.existsSync(disk)) return disk;
  }
  return "";
}

function ensureJpg(p) {
  fs.mkdirSync(DIR, { recursive: true });
  const out = path.join(DIR, slugOf(p) + ".jpg");
  if (fs.existsSync(out) && fs.statSync(out).size > 4000) return out;
  const r = spawnSync("python3", [PY, coverSrc(p), String(p.name || "Ranch"), String(p.location || ""), out], {
    timeout: 18000,
    encoding: "utf8"
  });
  if (r.status !== 0) {
    console.error("[og-ranch] jpg", slugOf(p), r.stderr || r.error);
  }
  if (fs.existsSync(out) && fs.statSync(out).size > 4000) return out;
  return FALLBACK;
}

function ensureGif(p) {
  fs.mkdirSync(DIR, { recursive: true });
  const out = path.join(DIR, slugOf(p) + ".gif");
  if (fs.existsSync(out) && fs.statSync(out).size > 4000) return out;
  const src = videoSrc(p);
  if (!src) return ensureJpg(p);
  const r = spawnSync("ffmpeg", [
    "-y", "-i", src, "-t", "2.0",
    "-vf", "fps=8,scale=800:418:force_original_aspect_ratio=increase,crop=800:418:exact=1,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=single[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
    "-loop", "0", out
  ], { timeout: 40000, encoding: "utf8" });
  if (r.status !== 0) {
    console.error("[og-ranch] gif", slugOf(p), r.stderr && r.stderr.slice(-400));
  }
  if (fs.existsSync(out) && fs.statSync(out).size > 4000) return out;
  return ensureJpg(p);
}

function findProducer(db, slug) {
  const want = String(slug || "");
  return ((db && db.data && db.data.producers) || []).find(function (x) {
    return slugOf(x) === want || String(x.slug) === want || String(x.id) === want;
  }) || null;
}

function serve(req, res, slug, ext, db, headers) {
  const p = findProducer(db, slug);
  let file = FALLBACK;
  let type = "image/jpeg";
  if (p && (ext === "gif" || hasVideo(p))) {
    file = ensureGif(p);
    type = String(file).toLowerCase().endsWith(".gif") ? "image/gif" : "image/jpeg";
  } else if (p) {
    file = ensureJpg(p);
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  const buf = fs.readFileSync(file);
  res.writeHead(200, headers({
    "Content-Type": type,
    "Content-Length": buf.length,
    "Cache-Control": "public, max-age=86400"
  }));
  res.end(buf);
}

module.exports = { slugOf, hasVideo, thumbPath, ensureJpg, ensureGif, serve, findProducer };
