module.exports = async function newsApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie } = ctx;
  const ADMINS = ["david@davidjay.com"];
  if (!Array.isArray(db.data.news)) db.data.news = [];

  function isAdmin(u) {
    return !!(u && ADMINS.indexOf(String(u.email || "").toLowerCase()) >= 0);
  }

  function decodeEntities(s) {
    return String(s || "")
      .replace(/&/g, "&")
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); });
  }

  function metaContent(html, key) {
    const re = new RegExp(
      "<meta[^>]+(?:property|name)=[\"']" + key + "[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>|<meta[^>]+content=[\"']([^\"']+)[\"'][^>]*(?:property|name)=[\"']" + key + "[\"'][^>]*>",
      "i"
    );
    const m = String(html || "").match(re);
    return decodeEntities((m && (m[1] || m[2])) || "").trim();
  }

  function pageTitle(html) {
    const m = String(html || "").match(/<title[^>]*>([^<]+)<\/title>/i);
    return decodeEntities(m ? m[1] : "").trim();
  }

  function hostOf(link) {
    try { return new URL(link).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }

  function slimListing(l) {
    var img = l.image || "";
    if (String(img).indexOf("data:") === 0) img = "/logo.svg?v=58";
    return {
      id: l.id,
      title: l.title || "Listing",
      location: l.location || "",
      image: img,
      views: Number(l.views || 0),
      listedAt: l.listedAt || "",
      price: l.price,
      priceType: l.priceType,
      head: l.head,
      breed: l.breed || "",
      status: l.status || "active",
    };
  }

  function stateCode(loc) {
    var s = String(loc || "");
    var m = s.match(/,\s*([A-Z]{2})(?:\s|$)/);
    if (m) return m[1];
    m = s.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
    return m ? m[1] : "";
  }

  function miles(a, b) {
    if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
    var R = 3958.8;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var la1 = (a.lat * Math.PI) / 180;
    var la2 = (b.lat * Math.PI) / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function listedStamp(l) {
    if (l.listedAt) {
      var t = Date.parse(l.listedAt);
      if (!isNaN(t)) return t;
    }
    var m = String(l.id || "").match(/(\d{10,})/);
    return m ? Number(m[1]) : 0;
  }

  function publicListings() {
    return (db.data.listings || []).filter(function (l) {
      return l.status !== "sold" && !l.hidden;
    });
  }

  function seedNews() {
    if (db.data.news && db.data.news.length) return false;
    db.data.news = [
      { id: "n1", url: "https://www.drovers.com/", title: "Drovers — cattle markets and ranch news", source: "Drovers", image: "", at: Date.now() - 86400000 * 4 },
      { id: "n2", url: "https://www.beefmagazine.com/", title: "BEEF Magazine — industry headlines", source: "BEEF", image: "", at: Date.now() - 86400000 * 3 },
      { id: "n3", url: "https://www.agweb.com/livestock/cattle", title: "AgWeb Cattle — livestock and market news", source: "AgWeb", image: "", at: Date.now() - 86400000 * 2 },
      { id: "n4", url: "https://www.thefencepost.com/news/", title: "The Fence Post — western livestock news", source: "Fence Post", image: "", at: Date.now() - 86400000 },
      { id: "n5", url: "https://www.cattlebusinessweekly.com/", title: "Cattle Business Weekly", source: "CBW", image: "", at: Date.now() - 3600000 },
    ];
    return true;
  }

  async function scrape(link) {
    var html = "";
    try {
      var ac = new AbortController();
      var t = setTimeout(function () { ac.abort(); }, 8000);
      var r = await fetch(link, {
        signal: ac.signal,
        redirect: "follow",
        headers: { "User-Agent": "HerdYard/1.0 (+https://herd-yard.com)", Accept: "text/html" },
      });
      html = await r.text();
      clearTimeout(t);
    } catch (e) {
      html = "";
    }
    var title = metaContent(html, "og:title") || metaContent(html, "twitter:title") || pageTitle(html);
    var image = metaContent(html, "og:image") || metaContent(html, "twitter:image");
    var source = metaContent(html, "og:site_name") || hostOf(link);
    if (!title) title = hostOf(link) || link;
    return { title: title.slice(0, 180), image: image.slice(0, 500), source: String(source).slice(0, 60) };
  }

  if (seedNews()) {
    try { await db.save(); } catch (e) {}
  }

  if (url === "/api/news" && method === "GET") {
    var items = (db.data.news || []).slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    send(res, 200, { news: items });
    return true;
  }

  if (url === "/api/admin/news" && method === "POST") {
    var u = userFromCookie(req);
    if (!u || !isAdmin(u)) return send(res, 403, { error: "Admin only" }), true;
    var b = await readBody(req);
    var raw = String(b.urls || b.url || "").split(/\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!raw.length) return send(res, 400, { error: "Paste one or more article links." }), true;
    var added = [];
    for (var i = 0; i < raw.length && i < 20; i++) {
      var link = raw[i];
      if (!/^https?:\/\//i.test(link)) link = "https://" + link;
      try { new URL(link); } catch (e) { continue; }
      var exists = (db.data.news || []).some(function (n) { return n.url === link; });
      if (exists) continue;
      var meta = await scrape(link);
      var item = {
        id: "n" + Date.now() + "-" + i,
        url: link,
        title: String(b.title || meta.title || link),
        source: meta.source,
        image: meta.image,
        at: Date.now(),
        addedBy: u.email,
      };
      db.data.news.unshift(item);
      added.push(item);
    }
    await db.save();
    send(res, 200, { ok: true, added: added, news: db.data.news });
    return true;
  }

  var delMatch = url.match(/^\/api\/admin\/news\/([^/]+)$/);
  if (delMatch && method === "DELETE") {
    var admin = userFromCookie(req);
    if (!admin || !isAdmin(admin)) return send(res, 403, { error: "Admin only" }), true;
    var nid = decodeURIComponent(delMatch[1]);
    db.data.news = (db.data.news || []).filter(function (n) { return n.id !== nid; });
    await db.save();
    send(res, 200, { ok: true, news: db.data.news });
    return true;
  }

  var viewMatch = url.match(/^\/api\/listings\/([^/]+)\/view$/);
  if (viewMatch && method === "POST") {
    var listing = (db.data.listings || []).find(function (l) { return l.id === decodeURIComponent(viewMatch[1]); });
    if (!listing) return send(res, 404, { error: "Listing not found" }), true;
    listing.views = Number(listing.views || 0) + 1;
    try { await db.save(); } catch (e) {}
    send(res, 200, { ok: true, views: listing.views });
    return true;
  }

  if (url === "/api/dashboard" && method === "GET") {
    var user = userFromCookie(req);
    if (!user) return send(res, 401, { error: "Sign in required" }), true;
    var producer = (db.data.producers || []).find(function (p) { return p.userId === user.id; }) || null;
    var mine = (db.data.listings || []).filter(function (l) { return l.userId === user.id; }).map(slimListing);
    mine.sort(function (a, b) { return (b.views || 0) - (a.views || 0); });
    var totalViews = mine.reduce(function (n, l) { return n + (l.views || 0); }, 0);
    var live = publicListings();
    var latest = live.slice().sort(function (a, b) { return listedStamp(b) - listedStamp(a); }).slice(0, 6).map(slimListing);
    var origin = { lat: producer && producer.lat, lng: producer && producer.lng };
    var myState = stateCode((producer && producer.location) || "") || stateCode(user.location || "");
    var local = live.filter(function (l) {
      if (l.userId === user.id) return false;
      var st = stateCode(l.location || (l.producer && l.producer.location) || "");
      if (myState && st && st === myState) return true;
      var d = miles(origin, l);
      return d != null && d <= 250;
    });
    if (!local.length && myState) {
      local = live.filter(function (l) {
        return String(l.location || "").toLowerCase().indexOf(myState.toLowerCase()) >= 0;
      });
    }
    local = local.sort(function (a, b) { return listedStamp(b) - listedStamp(a); }).slice(0, 6).map(slimListing);
    var msgs = (db.data.messages || []).filter(function (m) {
      if (m.fromUser === user.id) return true;
      if (m.toUser === user.id) return true;
      if (producer && m.toProducer === producer.id) return true;
      return false;
    }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    var news = (db.data.news || []).slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    send(res, 200, {
      news: news,
      messages: msgs.slice(0, 8),
      messageCount: msgs.length,
      local: local,
      latest: latest,
      views: mine.slice(0, 8),
      totalViews: totalViews,
      myListings: mine.length,
      followers: (producer && producer.followers) || 0,
      location: (producer && producer.location) || "",
    });
    return true;
  }

  return false;
};
