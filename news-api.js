module.exports = async function newsApi(ctx) {
  const { url, method, req, res, db, send, readBody, userFromCookie } = ctx;
  const ADMINS = ["david@davidjay.com"];
  if (!Array.isArray(db.data.news)) db.data.news = [];

  const LOGO = "/cowboy.svg?v=2";
  function isPlaceholder(v) {
    if (!v) return true;
    var s = String(v);
    if (s.indexOf("unsplash.com") >= 0) return true;
    if (/logo\.(svg|png)/i.test(s)) return true;
    return false;
  }
  function userName(id) {
    const user = (db.data.users || []).find((x) => x.id === id);
    if (user) return user.name || user.email || "Member";
    return "Member";
  }
  function avatarForUser(id) {
    const producer = (db.data.producers || []).find((p) => p.userId === id);
    if (producer && !isPlaceholder(producer.avatar)) return producer.avatar;
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
    return {
      id: m.id || null,
      listingId: m.listingId,
      listingTitle: listing ? listing.title : "Listing",
      fromUser: m.fromUser,
      fromName: userName(m.fromUser),
      fromAvatar: avatarForUser(m.fromUser),
      toUser: m.toUser || (producer && producer.userId) || null,
      toName: producer ? producer.name : userName(m.toUser),
      toAvatar: producer ? avatarForProducer(producer.id) : avatarForUser(m.toUser),
      toProducer: m.toProducer || (listing && listing.producerId) || null,
      body: m.body || "",
      at: m.at || 0,
      direction: sent ? "sent" : "received",
    };
  }


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
      { id: "n1", url: "https://www.drovers.com/", title: "Drovers — cattle markets and ranch news", source: "Drovers", subtext: "Cattle markets and ranch news", image: "", at: Date.now() - 86400000 * 4 },
      { id: "n2", url: "https://www.beefmagazine.com/", title: "BEEF Magazine — industry headlines", source: "BEEF", subtext: "Industry headlines", image: "", at: Date.now() - 86400000 * 3 },
      { id: "n3", url: "https://www.agweb.com/livestock/cattle", title: "AgWeb Cattle — livestock and market news", source: "AgWeb", subtext: "Livestock and market news", image: "", at: Date.now() - 86400000 * 2 },
      { id: "n4", url: "https://www.thefencepost.com/news/", title: "The Fence Post — western livestock news", source: "Fence Post", subtext: "Western livestock news", image: "", at: Date.now() - 86400000 },
      { id: "n5", url: "https://www.cattlebusinessweekly.com/", title: "Cattle Business Weekly", source: "CBW", subtext: "Weekly cattle business news", image: "", at: Date.now() - 3600000 },
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
    var desc = metaContent(html, "og:description") || metaContent(html, "description");
    if (!title) title = hostOf(link) || link;
    return {
      title: title.slice(0, 180),
      image: image.slice(0, 500),
      source: String(source).slice(0, 60),
      subtext: String(desc || source || "").slice(0, 180)
    };
  }


  const YT_CHANNEL = "UCj-YoVb91TazVAySJeTJ4Hg";
  const YT_HANDLE = "herdyard_USA";
  const YT_FALLBACK = [
    { id: "hVlTd874LuM", title: "Great Life, Tough Business: Kerr Taylor - Old Three Wagyu", duration: "35:03" },
    { id: "_-r4aw0TXa4", title: "Building Better Wagyu : Sandhill Performance Wagyu", duration: "36:38" },
    { id: "vh95RfvE7gU", title: "Ranching at 8,000 Feet: How Circle C Is Building for the Future", duration: "22:59" }
  ].map(function (v) {
    return {
      id: v.id,
      title: v.title,
      duration: v.duration,
      url: "https://www.youtube.com/watch?v=" + v.id,
      thumb: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg",
      channel: "https://www.youtube.com/@" + YT_HANDLE
    };
  });

  function durationSeconds(d) {
    var p = String(d || "").split(":").map(Number);
    if (p.some(function (n) { return isNaN(n); })) return 0;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
  }

  function normalizePodcast(v) {
    return {
      id: v.id,
      title: v.title,
      duration: v.duration || "",
      url: "https://www.youtube.com/watch?v=" + v.id,
      thumb: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg",
      channel: "https://www.youtube.com/@" + YT_HANDLE
    };
  }

  function pickPodcasts(list) {
    var long = (list || []).filter(function (v) { return durationSeconds(v.duration) >= 8 * 60; });
    var chosen = (long.length >= 2 ? long : list || []).slice(0, 3);
    return chosen.map(normalizePodcast);
  }

  async function scrapeYoutubeVideos() {
    var ac = new AbortController();
    var timer = setTimeout(function () { ac.abort(); }, 7000);
    var html = "";
    try {
      var r = await fetch("https://www.youtube.com/@" + YT_HANDLE + "/videos", {
        signal: ac.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HerdYard/1.0; +https://herd-yard.com)",
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html"
        }
      });
      html = await r.text();
    } catch (e) {
      html = "";
    }
    clearTimeout(timer);
    var m = html.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/);
    if (!m) return [];
    var data;
    try { data = JSON.parse(m[1]); } catch (e) { return []; }
    var lockups = [];
    function walk(o) {
      if (!o) return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (typeof o !== "object") return;
      if (o.lockupViewModel) lockups.push(o.lockupViewModel);
      Object.keys(o).forEach(function (k) { walk(o[k]); });
    }
    walk(data);
    var seen = {};
    var out = [];
    lockups.forEach(function (lu) {
      var id = "";
      try { id = lu.rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId; } catch (e) {}
      if (!id || seen[id]) return;
      var title = "";
      try { title = lu.metadata.lockupMetadataViewModel.title.content; } catch (e) {}
      var duration = "";
      try {
        duration = lu.contentImage.thumbnailViewModel.overlays[0].thumbnailBottomOverlayViewModel.badges[0].thumbnailBadgeViewModel.text;
      } catch (e) {}
      if (!title) return;
      seen[id] = true;
      out.push({ id: id, title: title, duration: duration });
    });
    return out;
  }

  async function latestPodcasts() {
    var cache = db.data.podcasts;
    var fresh = cache && cache.at && (Date.now() - cache.at < 30 * 60 * 1000) && Array.isArray(cache.items) && cache.items.length;
    if (fresh) return cache.items;
    var scraped = [];
    try { scraped = await scrapeYoutubeVideos(); } catch (e) { scraped = []; }
    var items = pickPodcasts(scraped);
    if (!items.length) items = (cache && cache.items && cache.items.length) ? cache.items : YT_FALLBACK;
    db.data.podcasts = { at: Date.now(), items: items };
    try { await db.save(); } catch (e) {}
    return items;
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
    var added = [];
    if (!raw.length) {
      var headline = String(b.title || b.headline || "").trim();
      if (!headline) return send(res, 400, { error: "Paste a link or enter a headline." }), true;
      var item = {
        id: "n" + Date.now(),
        url: String(b.link || "").trim(),
        title: headline.slice(0, 180),
        source: String(b.source || "News").slice(0, 60),
        subtext: String(b.subtext || b.source || "").slice(0, 180),
        image: "",
        at: Date.now(),
        addedBy: u.email,
      };
      db.data.news.unshift(item);
      added.push(item);
    } else {
      for (var i = 0; i < raw.length && i < 20; i++) {
        var link = raw[i];
        if (!/^https?:\/\//i.test(link)) link = "https://" + link;
        try { new URL(link); } catch (e) { continue; }
        var exists = (db.data.news || []).some(function (row) { return row.url === link; });
        if (exists) continue;
        var meta = await scrape(link);
        var item = {
          id: "n" + Date.now() + "-" + i,
          url: link,
          title: String(b.title || b.headline || meta.title || link).slice(0, 180),
          source: meta.source,
          subtext: String(b.subtext || meta.subtext || meta.source || "").slice(0, 180),
          image: meta.image,
          at: Date.now(),
          addedBy: u.email,
        };
        db.data.news.unshift(item);
        added.push(item);
      }
    }
    await db.save();
    send(res, 200, { ok: true, added: added, news: db.data.news });
    return true;
  }

  var delMatch = url.match(/^\/api\/admin\/news\/([^/]+)$/);
  if (delMatch && (method === "DELETE" || method === "POST")) {
    var admin = userFromCookie(req);
    if (!admin || !isAdmin(admin)) return send(res, 403, { error: "Admin only" }), true;
    var nid = decodeURIComponent(delMatch[1]);
    if (method === "DELETE") {
      db.data.news = (db.data.news || []).filter(function (row) { return row.id !== nid; });
      await db.save();
      send(res, 200, { ok: true, news: db.data.news });
      return true;
    }
    var item = (db.data.news || []).find(function (row) { return row.id === nid; });
    if (!item) return send(res, 404, { error: "Story not found" }), true;
    var body = await readBody(req);
    if (body.title !== undefined || body.headline !== undefined) item.title = String(body.title || body.headline || "").slice(0, 180);
    if (body.subtext !== undefined) item.subtext = String(body.subtext || "").slice(0, 180);
    if (body.source !== undefined) item.source = String(body.source || "").slice(0, 60);
    if (body.url !== undefined) item.url = String(body.url || "").trim();
    await db.save();
    send(res, 200, { ok: true, news: db.data.news, item: item });
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
    var podcasts = await latestPodcasts();
    send(res, 200, {
      news: news,
      podcasts: podcasts,
      messages: msgs.slice(0, 40).map(function (m) { return decorateMessage(m, user); }),
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
