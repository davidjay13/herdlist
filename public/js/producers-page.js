(function () {
  const COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80";
  let cache = [];
  let listingCounts = {};

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function countsFor(id) {
    return listingCounts[id] || 0;
  }
  function card(p) {
    const cover = p.cover || p.avatar || COW;
    const avatar = p.avatar || "/logo.svg?v=47";
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
  function renderGrid(list, title, sub, allHref) {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `<section class="section">
      <div class="section-head"><div><h2>${title}</h2><p class="sub">${sub}</p></div>
      ${allHref ? `<a class="btn btn-primary" href="${allHref}">View all →</a>` : ""}</div>
      <div class="cards-3">${list.length ? list.map(card).join("") : "<div class='empty'>No producers yet.</div>"}</div>
    </section>`;
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
  function page() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const path = hash.split("?")[0];
    if (path !== "/producers" && path !== "producers") return false;
    const q = (location.hash.split("?")[1] || "").toLowerCase();
    const params = new URLSearchParams(q);
    const term = (params.get("q") || "").trim().toLowerCase();
    let list = cache.slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    if (term) list = list.filter(function (p) {
      return (p.name || "").toLowerCase().indexOf(term) >= 0 || (p.location || "").toLowerCase().indexOf(term) >= 0;
    });
    const app = document.getElementById("app");
    if (!app) return true;
    app.innerHTML = `<section class="section">
      <div class="section-head"><div><h2>Producers</h2>
      <p class="sub">Search to find other producers near you</p></div></div>
      <div class="field" style="max-width:320px;margin:0 0 22px">
        <label>Search ranches</label>
        <input id="prod-q" placeholder="Name or location" value="${esc(term)}">
      </div>
      <div class="cards-3">${list.length ? list.map(card).join("") : "<div class='empty'>No producers match.</div>"}</div>
    </section>`;
    const input = document.getElementById("prod-q");
    if (input) {
      input.onkeydown = function (e) {
        if (e.key === "Enter") {
          const v = input.value.trim();
          location.hash = "#/producers" + (v ? "?q=" + encodeURIComponent(v) : "");
        }
      };
    }
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
