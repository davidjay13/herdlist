(function () {
  const COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80";
  const STATE_XY = { AL:[32.6,-86.7], AK:[64.2,-153.4], AZ:[34.3,-111.7], AR:[34.9,-92.4], CA:[36.8,-119.4], CO:[39.0,-105.5], CT:[41.6,-72.7], DE:[39.0,-75.5], FL:[27.8,-81.7], GA:[32.6,-83.4], HI:[20.8,-156.3], ID:[44.4,-114.6], IL:[40.0,-89.3], IN:[39.8,-86.3], IA:[42.0,-93.5], KS:[38.5,-98.3], KY:[37.5,-85.3], LA:[31.0,-92.0], ME:[45.3,-69.2], MD:[39.0,-76.8], MA:[42.2,-71.5], MI:[43.7,-84.5], MN:[46.3,-94.3], MS:[32.7,-89.7], MO:[38.4,-92.5], MT:[47.0,-110.4], NE:[41.5,-99.8], NV:[39.3,-116.6], NH:[43.7,-71.6], NJ:[40.2,-74.6], NM:[34.4,-106.1], NY:[42.9,-75.5], NC:[35.6,-79.4], ND:[47.4,-100.5], OH:[40.3,-82.8], OK:[35.6,-97.5], OR:[44.0,-120.5], PA:[40.9,-77.8], RI:[41.7,-71.5], SC:[33.9,-80.9], SD:[44.4,-100.2], TN:[35.9,-86.3], TX:[31.5,-99.3], UT:[39.3,-111.7], VT:[44.0,-72.7], VA:[37.5,-78.6], WA:[47.4,-120.5], WV:[38.6,-80.6], WI:[44.3,-89.8], WY:[43.0,-107.6] };
  let cache = [];
  let listingCounts = {};
  let prodMap = null;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;")
      .replace(/'/g, "&#39;");
  }
  function countsFor(id) {
    return listingCounts[id] || 0;
  }
  function producerCoords(p) {
    var lat = Number(p.lat), lng = Number(p.lng);
    if (lat && lng && !(Math.abs(lat - 39.8) < 0.05 && Math.abs(lng + 98.5) < 0.2)) return [lat, lng];
    var loc = String(p.location || "");
    var m = loc.match(/,\s*([A-Z]{2})\b/);
    var st = m ? m[1] : "";
    var base = STATE_XY[st];
    if (!base) return null;
    var key = loc.toLowerCase();
    var h = 0;
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return [base[0] + ((h % 80) - 40) / 140, base[1] + (((h >> 8) % 80) - 40) / 90];
  }
  function dropMap() {
    if (prodMap) {
      try { prodMap.remove(); } catch (e) {}
      prodMap = null;
    }
  }
  function card(p) {
    const cover = p.cover || p.avatar || COW;
    const avatar = p.avatar || "/cowboy.svg?v=1";
    const slug = p.slug || p.id;
    const n = countsFor(p.id);
    return `<article class="listing-card" onclick="location.hash='#/ranch/${esc(slug)}'">
      <div class="thumb" style="background-image:url('${esc(cover)}')">
        <span class="badge">${esc(p.name || "Ranch")}</span>
      </div>
      <div class="listing-body">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <img src="${esc(avatar)}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#fff;border:1px solid #d8e0d6">
          <div>
            <div class="price" style="font-size:1rem;margin:0">${esc(p.name || "Ranch")}</div>
            <div class="meta">${esc(p.location || "")}</div>
          </div>
        </div>
        <div class="meta"><span>${n} listing${n===1?"":"s"}</span><span>${p.sold || 0} sold</span><span>${p.followers || 0} followers</span></div>
      </div></article>`;
  }
  function injectHome() {
    const hash = location.hash.replace(/^#/, "") || "/";
    if (hash !== "/" && hash !== "") return;
    if (document.getElementById("producers-home")) return;
    const sections = document.querySelectorAll("#app .section");
    if (!sections.length) return;
    const preview = cache.slice().sort(function (a, b) {
      return countsFor(b.id) - countsFor(a.id);
    }).slice(0, 6);
    const wrap = document.createElement("section");
    wrap.className = "section";
    wrap.id = "producers-home";
    wrap.innerHTML = `<div class="section-head"><div><h2>Producers</h2>
      <p class="sub">Ranches and cattle operations on Herd Yard.</p></div>
      <a class="btn btn-primary" href="#/producers">View all producers →</a></div>
      <div class="cards-3">${preview.map(card).join("")}</div>`;
    const first = sections[0];
    if (first && first.parentNode) first.parentNode.insertBefore(wrap, first.nextSibling);
  }
  function paintMap(list) {
    if (!window.L) return;
    dropMap();
    var el = document.getElementById("producers-map");
    if (!el) return;
    var USA = [[24.5, -125.0], [49.4, -66.9]];
    prodMap = L.map("producers-map", { scrollWheelZoom: true, worldCopyJump: false, minZoom: 3, maxZoom: 12 });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxZoom: 16
    }).addTo(prodMap);
    var icon = L.divIcon({ className: "hy-pin", html: '<div class="hy-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
    var bounds = [];
    list.forEach(function (p) {
      var xy = producerCoords(p);
      if (!xy || xy[0] < 18 || xy[0] > 72 || xy[1] < -170 || xy[1] > -60) return;
      bounds.push(xy);
      var n = countsFor(p.id);
      var slug = p.slug || p.id;
      L.marker(xy, { icon: icon }).addTo(prodMap).bindPopup(
        "<b>" + esc(p.name || "Ranch") + "</b><br>" + esc(p.location || "") +
        "<br>" + n + " listing" + (n === 1 ? "" : "s") +
        "<br><a href='#/ranch/" + esc(slug) + "'>View ranch</a>"
      );
    });
    function refit() {
      if (!prodMap) return;
      prodMap.invalidateSize();
      prodMap.fitBounds(USA, { padding: [16, 16], maxZoom: 5, animate: false });
    }
    refit();
    setTimeout(refit, 80);
    setTimeout(refit, 350);
  }
  function page() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const path = hash.split("?")[0];
    if (path !== "/producers" && path !== "producers") {
      dropMap();
      return false;
    }
    const q = (location.hash.split("?")[1] || "");
    const params = new URLSearchParams(q);
    const term = (params.get("q") || "").trim().toLowerCase();
    const view = params.get("view") === "map" ? "map" : "list";
    let list = cache.slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    if (term) list = list.filter(function (p) {
      return (p.name || "").toLowerCase().indexOf(term) >= 0 || (p.location || "").toLowerCase().indexOf(term) >= 0;
    });
    const app = document.getElementById("app");
    if (!app) return true;
    dropMap();
    function nextHash(extra) {
      var next = new URLSearchParams(location.hash.split("?")[1] || "");
      Object.keys(extra).forEach(function (k) {
        if (extra[k] == null || extra[k] === "") next.delete(k);
        else next.set(k, extra[k]);
      });
      var s = next.toString();
      location.hash = "#/producers" + (s ? "?" + s : "");
    }
    var toggle = view === "map"
      ? '<button class="btn btn-outline" type="button" id="prod-view">View as cards</button>'
      : '<button class="btn btn-primary" type="button" id="prod-view">View on map</button>';
    var body = view === "map"
      ? '<div class="producers-map map-wrap" id="producers-map"></div>'
      : '<div class="cards-3">' + (list.length ? list.map(card).join("") : "<div class='empty'>No producers match.</div>") + "</div>";
    app.innerHTML = `<section class="section">
      <div class="section-head"><div><h2>Producers</h2>
      <p class="sub">Search to find other producers near you</p></div>${toggle}</div>
      <div class="field" style="max-width:320px;margin:0 0 22px">
        <label>Search ranches</label>
        <input id="prod-q" placeholder="Name or location" value="${esc(term)}">
      </div>
      ${body}
    </section>`;
    const input = document.getElementById("prod-q");
    if (input) {
      input.onkeydown = function (e) {
        if (e.key === "Enter") {
          const v = input.value.trim();
          nextHash({ q: v || null });
        }
      };
    }
    const btn = document.getElementById("prod-view");
    if (btn) {
      btn.onclick = function () {
        nextHash({ view: view === "map" ? "" : "map" });
      };
    }
    if (view === "map") setTimeout(function () { paintMap(list); }, 40);
    return true;
  }
  async function load() {
    try {
      const r = await fetch("/api/producers", { credentials: "include" });
      const data = await r.json();
      cache = Array.isArray(data.producers) ? data.producers : [];
    } catch (e) { cache = []; }
    try {
      const r = await fetch("/api/listings", { credentials: "include" });
      const data = await r.json();
      listingCounts = {};
      (data.listings || []).forEach(function (l) {
        if (!l || l.hidden || l.status === "sold") return;
        listingCounts[l.producerId] = (listingCounts[l.producerId] || 0) + 1;
      });
    } catch (e) {}
  }
  function tick() {
    if (page()) return;
    injectHome();
  }
  window.addEventListener("hashchange", function () { setTimeout(tick, 40); });
  load().then(function () {
    setTimeout(tick, 60);
    setTimeout(tick, 400);
  });
})();
