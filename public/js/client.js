(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");
  const toastEl = $("#toast");
  const state = { user: null, producer: null, follows: [], listings: [], listingCache: {}, ranchCache: {} };

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: "include",
      headers: opts.body instanceof FormData ? {} : { "Content-Type": "application/json" },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    setTimeout(() => (toastEl.style.display = "none"), 2400);
  }
  function money(n) {
    if (n == null) return "Contact for Price";
    return "$" + Number(n).toLocaleString("en-US");
  }
  function priceLabel(l) {
    if (l.priceType === "contact" || l.price == null) return "Contact for Price";
    return money(l.price) + " / " + (l.unit === "Units" ? "Unit" : "Head");
  }
  function nav() {
    var logged = !!state.user;
    var label = document.getElementById("acct-label");
    if (label) label.textContent = logged ? "My Account" : "Log in";
    var sell = document.getElementById("sell-btn");
    if (sell) sell.style.display = logged ? "none" : "";
    var mobileLogin = document.getElementById("mobile-login");
    if (mobileLogin) {
      mobileLogin.textContent = logged ? "My Account" : "Log in";
      mobileLogin.setAttribute("href", logged ? "#/account" : "#/signin");
    }
    var cta = document.querySelector(".mobile-menu .menu-cta");
    if (cta) cta.style.display = logged ? "none" : "";
  }
  function listingCard(l) {
    const p = l.producer;
    return `<article class="listing-card" onclick="location.hash='#/listing/${l.id}'">
      <div class="thumb" style="background-image:url('${l.image}')">
        <span class="badge">${p ? p.name : "Ranch"}</span>
        <span class="days">${l.daysLeft}d left</span>
      </div>
      <div class="listing-body">
        <div class="price">${priceLabel(l)}</div>
        <div class="meta"><span>${l.breed}</span><span>${l.klass}</span><span>${l.head} ${l.unit}</span></div>
        <div class="meta" style="margin-top:4px">${l.location || ""}</div>
      </div></article>`;
  }
  function plansHTML() {
    return `<div class="plans">
      <div class="plan"><h3>Single listing</h3><div class="amt">$45</div><div class="sub">one group \u00b7 60 days</div>
        <ul><li>One listing</li><li>No commission on private treaty</li><li>Nationwide network</li></ul>
        <a class="btn btn-outline btn-wide" href="#/list">List now</a></div>
      <div class="plan featured"><h3>Producer</h3><div class="amt">$432</div><div class="sub">per year \u00b7 unlimited</div>
        <ul><li>Unlimited listings</li><li>Public ranch profile</li><li>Followers</li></ul>
        <a class="btn btn-light btn-wide" href="#/signup">Become a producer</a></div>
      <div class="plan"><h3>Custom</h3><div class="amt">Talk</div><div class="sub">associations</div>
        <ul><li>All producer features</li><li>Featured placement</li></ul>
        <a class="btn btn-outline btn-wide" href="#/faq">Contact us</a></div></div>`;
  }
  function home() {
    const recent = state.listings.slice(0, 6);
    app.innerHTML = `<section class="hero"><div class="hero-bg"></div><div class="hero-inner">
      <div class="kicker">Farm to farm \u00b7 Private treaty</div>
      <h1>Zillow For Cattle</h1>
      <p class="lead">Connecting buyers and sellers nationwide. No commission on private-treaty cattle.</p>
      <div class="hero-cta">
        <a class="btn btn-light btn-lg" href="#/signup">Create a free account</a>
        <a class="btn btn-primary btn-lg" href="#/list">List cattle now</a>
      </div></div></section>
      <section class="section"><div class="section-head"><div><h2>Recently listed</h2>
      <p class="sub">Private treaty cattle from ranches nationwide.</p></div>
      <a class="btn btn-primary" href="#/browse">Browse all \u2192</a></div>
      <div class="cards-3">${recent.map(listingCard).join("")}</div></section>
      <section class="section"><div class="section-head"><div><h2>Choose a plan</h2></div></div>${plansHTML()}</section>`;
  }
  let mapInst = null;
  const STATE_XY = { AL:[32.6,-86.7], AK:[64.2,-153.4], AZ:[34.3,-111.7], AR:[34.9,-92.4], CA:[36.8,-119.4], CO:[39.0,-105.5], CT:[41.6,-72.7], DE:[39.0,-75.5], FL:[27.8,-81.7], GA:[32.6,-83.4], HI:[20.8,-156.3], ID:[44.4,-114.6], IL:[40.0,-89.3], IN:[39.8,-86.3], IA:[42.0,-93.5], KS:[38.5,-98.3], KY:[37.5,-85.3], LA:[31.0,-92.0], ME:[45.3,-69.2], MD:[39.0,-76.8], MA:[42.2,-71.5], MI:[43.7,-84.5], MN:[46.3,-94.3], MS:[32.7,-89.7], MO:[38.4,-92.5], MT:[47.0,-110.4], NE:[41.5,-99.8], NV:[39.3,-116.6], NH:[43.7,-71.6], NJ:[40.2,-74.6], NM:[34.4,-106.1], NY:[42.9,-75.5], NC:[35.6,-79.4], ND:[47.4,-100.5], OH:[40.3,-82.8], OK:[35.6,-97.5], OR:[44.0,-120.5], PA:[40.9,-77.8], RI:[41.7,-71.5], SC:[33.9,-80.9], SD:[44.4,-100.2], TN:[35.9,-86.3], TX:[31.5,-99.3], UT:[39.3,-111.7], VT:[44.0,-72.7], VA:[37.5,-78.6], WA:[47.4,-120.5], WV:[38.6,-80.6], WI:[44.3,-89.8], WY:[43.0,-107.6] };
  const CITY_XY = { "fallbrook, ca":[33.376,-117.251], "auburn, ca":[38.8966,-121.077], "linton, nd":[46.2666,-100.2329], "ivanhoe, tx":[33.4371,-96.1389], "napoleon, nd":[46.5047,-99.7696], "nelson, ne":[40.2017,-98.0678], "marfa, tx":[30.3072,-104.0245], "shingle springs, ca":[38.6657,-120.9263], "wilton, nd":[47.1586,-100.7837], "walters, ok":[34.36,-98.31], "jerico springs, mo":[37.62,-94.01], "imperial, ne":[40.52,-101.64] };
  function listingCoords(l) {
    const loc = String(l.location || "").toLowerCase().replace(/\s+\d{5}.*$/, "").replace(/,?\s*usa$/, "").trim();
    if (CITY_XY[loc]) return CITY_XY[loc];
    const lat = Number(l.lat), lng = Number(l.lng);
    if (lat && lng && !(Math.abs(lat-39.8)<0.05 && Math.abs(lng+98.5)<0.2 && /fallbrook/i.test(loc))) return [lat, lng];
    const m = String(l.location || "").match(/,\s*([A-Z]{2})\b/);
    const st = m ? m[1] : "";
    const base = STATE_XY[st] || [39.5, -98.3];
    let h = 0; for (let i=0;i<loc.length;i++) h = (h*31 + loc.charCodeAt(i)) >>> 0;
    return [base[0] + ((h % 80)-40)/120, base[1] + (((h>>8)%80)-40)/80];
  }
  function browse() {
    const params = new URLSearchParams(location.hash.split("?")[1] || "");
    const q = { category: params.get("category") || "", breed: params.get("breed") || "", klass: params.get("klass") || "", view: params.get("view") || "split" };
    const items = state.listings.filter((l) => (!q.category || l.category === q.category) && (!q.breed || l.breed === q.breed) && (!q.klass || l.klass === q.klass));
    const PAGE = 9;
    const pages = Math.max(1, Math.ceil(items.length / PAGE));
    let page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
    if (page > pages) page = pages;
    const slice = items.slice((page - 1) * PAGE, page * PAGE);
    function browseHash(extra) {
      const next = new URLSearchParams(location.hash.split("?")[1] || "");
      Object.keys(extra || {}).forEach((k) => {
        if (extra[k] == null || extra[k] === "") next.delete(k);
        else next.set(k, extra[k]);
      });
      const s = next.toString();
      location.hash = "#/browse" + (s ? "?" + s : "");
    }
    const viewCls = q.view === "map" ? "view-map" : q.view === "list" ? "view-list" : "view-split";
    app.innerHTML = `<div class="browse-layout ${viewCls}"><aside class="filters"><h3>Filter listings</h3>
      <div class="field"><label>Category</label><select id="f-cat"><option value="">All</option>${RL.CATEGORIES.map((c) => `<option ${c===q.category?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Breed</label><select id="f-breed"><option value="">All breeds</option>${RL.BREEDS.map((c) => `<option ${c===q.breed?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Class</label><select id="f-klass"><option value="">All classes</option>${RL.CLASSES.map((c) => `<option ${c===q.klass?"selected":""}>${c}</option>`).join("")}</select></div>
      <button class="btn btn-primary btn-wide" id="apply-f">Apply filters</button>
      <p class="sub" style="margin-top:16px">${items.length} listings</p></aside>
      <div class="browse-main"><div class="browse-toolbar"><div><b>Nationwide inventory</b></div>
      <div class="view-toggle">
        <button class="btn ${q.view==="split"?"btn-primary":"btn-outline"}" data-view="split">Map + cards</button>
        <button class="btn ${q.view==="map"?"btn-primary":"btn-outline"}" data-view="map">Map</button>
        <button class="btn ${q.view==="list"?"btn-primary":"btn-outline"}" data-view="list">Cards</button>
      </div></div>
      <div class="browse-stage">
        <div class="map-wrap" id="map"></div>
        <div class="listings-col">
          <div class="listings-grid">${slice.length?slice.map(listingCard).join(""):"<div class='empty'>No listings match.</div>"}</div>
          <div class="pager">
            <button type="button" class="btn btn-outline" id="pg-prev"${page<=1?" disabled":""}>Prev</button>
            <div class="pages">Page ${page} of ${pages}</div>
            <button type="button" class="btn btn-outline" id="pg-next"${page>=pages?" disabled":""}>Next</button>
          </div>
        </div>
      </div>
      </div></div>`;
    const prev = document.getElementById("pg-prev");
    const nxt = document.getElementById("pg-next");
    if (prev) prev.onclick = () => { if (page > 1) browseHash({ page: String(page - 1) }); };
    if (nxt) nxt.onclick = () => { if (page < pages) browseHash({ page: String(page + 1) }); };
    $("#apply-f").onclick = () => {
      const next = new URLSearchParams();
      if ($("#f-cat").value) next.set("category", $("#f-cat").value);
      if ($("#f-breed").value) next.set("breed", $("#f-breed").value);
      if ($("#f-klass").value) next.set("klass", $("#f-klass").value);
      if (q.view !== "split") next.set("view", q.view);
      location.hash = "#/browse" + (next.toString() ? "?" + next : "");
    };
    app.querySelectorAll("[data-view]").forEach((b) => {
      b.onclick = () => {
        browseHash({ view: b.dataset.view, page: "1" });
      };
    });
    if (q.view !== "list" && window.L) {
      const USA = [[24.5, -125.0], [49.4, -66.9]];
      mapInst = L.map("map", { scrollWheelZoom: true, worldCopyJump: false, minZoom: 3, maxZoom: 12 });
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 16
      }).addTo(mapInst);
      const icon = L.divIcon({ className: "hy-pin", html: `<div class="hy-dot"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
      items.forEach((l) => {
        const xy = listingCoords(l);
        if (!xy || xy[0] < 18 || xy[0] > 72 || xy[1] < -170 || xy[1] > -60) return;
        L.marker(xy, { icon }).addTo(mapInst).bindPopup(`<b>${priceLabel(l)}</b><br>${l.breed || ""} · ${l.klass || ""}<br>${l.location || ""}<br><a href="#/listing/${l.id}">Open listing</a>`);
      });
      function refit() {
        if (!mapInst) return;
        mapInst.invalidateSize();
        mapInst.fitBounds(USA, { padding: [12, 12], maxZoom: 5, animate: false });
      }
      refit();
      setTimeout(refit, 80);
      setTimeout(refit, 350);
    }
  }
  function listingView(id) {
    const l = state.listingCache[id] || state.listings.find((x) => x.id === id);
    if (!l) { app.innerHTML = `<section class="section"><h2>Listing not found</h2></section>`; return; }
    const p = l.producer || { name: "Ranch", slug: "", location: l.location, rating: "\u2014", avatar: l.image, id: l.producerId };
    const imgs = l.images && l.images.length ? l.images : [l.image];
    app.innerHTML = `<div class="detail"><div>
      <div class="gallery" id="hero-img" style="background-image:url('${imgs[0]}')"></div>
      <div class="thumbs">${imgs.map((src,i)=>`<button class="${i===0?"on":""}" style="background-image:url('${src}')" data-src="${src}"></button>`).join("")}</div>
      <h2 style="margin-top:22px">${l.title}</h2>
      <p class="meta">${l.breed} \u00b7 ${l.klass} \u00b7 ${l.head} ${l.unit} \u00b7 ${l.location||""}</p>
      <p>${l.description||""}</p>
      </div><aside class="side-card">
      <div class="label">Asking</div><div class="stat-num" style="font-size:2rem">${priceLabel(l)}</div>
      <p class="sub">${l.daysLeft} days left \u00b7 listed ${l.listedAt}</p>
      <button class="btn btn-primary btn-wide btn-lg" id="contact-btn" style="margin-top:12px">${state.user?"Message the ranch":"Sign in to contact"}</button>
      <button class="btn btn-outline btn-wide" id="follow-btn" style="margin-top:8px">Follow ranch</button>
      <div class="producer-mini"><img src="${p.avatar||l.image}" alt=""><div>
      <a href="#/ranch/${p.slug||p.id}"><b>${p.name}</b></a>
      <div class="meta">${p.location||""}</div></div></div></aside></div>`;
    try { fetch("/api/listings/"+id+"/view", { method: "POST", credentials: "include" }); } catch (e) {}
    app.querySelectorAll(".thumbs button").forEach((b) => {
      b.onclick = () => { app.querySelectorAll(".thumbs button").forEach((x)=>x.classList.remove("on")); b.classList.add("on"); $("#hero-img").style.backgroundImage = `url('${b.dataset.src}')`; };
    });
    $("#contact-btn").onclick = async () => {
      if (!state.user) { location.hash = "#/signup"; return; }
      try { await api("/api/listings/"+l.id+"/contact", { method: "POST", body: JSON.stringify({ body: "Interested." }) }); toast("Message saved."); }
      catch (e) { toast(e.message); }
    };
    $("#follow-btn").onclick = async () => {
      if (!state.user) { location.hash = "#/signup"; return; }
      try {
        const r = await api("/api/producers/"+p.id+"/follow", { method: "POST", body: "{}" });
        $("#follow-btn").textContent = r.following ? "Following ranch" : "Follow ranch";
      } catch (e) { toast(e.message); }
    };
  }
  function ranch(slug) { }
  function listCattle() {
    if (!state.user) { location.hash = "#/signup"; toast("Create an account to list cattle."); return; }
    app.innerHTML = `<div class="form-page"><h2 class="page-title">List cattle</h2>
      <form id="list-form" class="panel" style="margin-top:18px"><div class="form-grid">
      <div class="field full"><label>Title</label><input name="title" required></div>
      <div class="field"><label>Breed</label><select name="breed">${RL.BREEDS.map((b)=>`<option>${b}</option>`).join("")}</select></div>
      <div class="field"><label>Class</label><select name="klass">${RL.CLASSES.map((b)=>`<option>${b}</option>`).join("")}</select></div>
      <div class="field"><label>Head</label><input name="head" type="number" min="1" value="25" required></div>
      <div class="field"><label>Price per head (blank = contact)</label><input name="price" type="number" min="0"></div>
      <div class="field"><label>City, State</label><input name="location" required></div>
      <div class="field"><label>Category</label><select name="category">${RL.CATEGORIES.map((b)=>`<option>${b}</option>`).join("")}</select></div>
      <div class="field full"><label>Description</label><textarea name="description" rows="5" required></textarea></div>
      </div><button class="btn btn-primary btn-lg" style="margin-top:16px">Publish listing</button></form></div>`;
    $("#list-form").onsubmit = async (e) => {
      e.preventDefault();
      try {
        const body = Object.fromEntries(new FormData(e.target).entries());
        const r = await api("/api/listings", { method: "POST", body: JSON.stringify(body) });
        state.listings.unshift(r.listing); state.listingCache[r.listing.id] = r.listing;
        toast("Listing published."); location.hash = "#/listing/"+r.listing.id;
      } catch (err) { toast(err.message); }
    };
  }
  function auth(mode) {
    const signup = mode === "signup";
    app.innerHTML = `<div class="auth-box"><h2>${signup?"Create an account":"Welcome back"}</h2>
      <form id="auth-form" style="margin-top:16px">
      ${signup?`<div class="field"><label>Name / ranch</label><input name="name" required></div>`:""}
      <div class="field"><label>Email</label><input name="email" type="email" required></div>
      <div class="field"><label>Password</label><input name="password" type="password" required minlength="4"></div>
      <button class="btn btn-primary btn-wide btn-lg" style="margin-top:8px">${signup?"Create account":"Sign in"}</button></form>
      <p class="sub" style="margin-top:14px">${signup?`Already listed? <a href="#/signin">Sign in</a>`:`New here? <a href="#/signup">Create an account</a>`}</p></div>`;
    $("#auth-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const r = await api(signup?"/api/signup":"/api/signin", { method:"POST", body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") }) });
        state.user = r.user;
        nav(); toast("Signed in as "+state.user.name); location.hash = "#/account";
      } catch (err) { toast(err.message); }
    };
  }
  function pricing() { app.innerHTML = `<section class="section"><h2>Producer plans</h2>${plansHTML()}</section>`; }
  function faq() {
    app.innerHTML = `<section class="section faq" style="max-width:760px"><h2>Frequently asked</h2>
      ${RL.FAQS.map((f)=>`<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</section>`;
  }
  async function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const parts = raw.split("?")[0].split("/").filter(Boolean);
    nav();
    if (mapInst) { mapInst.remove(); mapInst = null; }
    if (parts[0]==="listing" && parts[1] && !state.listingCache[parts[1]]) {
      try { const r = await api("/api/listings/"+parts[1]); state.listingCache[r.listing.id]=r.listing; } catch(e){}
    }
    if (parts[0]==="ranch" && parts[1] && !state.ranchCache[parts[1]]) {
      try { const r = await api("/api/producers/"+parts[1]); state.ranchCache[parts[1]]=r; } catch(e){}
    }
    if (!parts.length) return home();
    if (parts[0]==="browse") return browse();
    if (parts[0]==="listing") return listingView(parts[1]);
    if (parts[0]==="ranch") return;
    if (parts[0]==="list") return listCattle();
    if (parts[0]==="signup") return auth("signup");
    if (parts[0]==="signin") return auth("signin");
    if (parts[0]==="account") return;
    if (parts[0]==="pricing") return pricing();
    if (parts[0]==="faq") return faq();
    if (parts[0]==="updates") return;
    if (parts[0]==="producers") return;
    home();
  }
  window.addEventListener("hashchange", route);
  document.getElementById("sell-btn").onclick = () => (location.hash = "#/list");
  document.getElementById("acct-btn").onclick = () => { location.hash = state.user ? "#/account" : "#/signin"; };
  (async function boot() {
    try { const me = await api("/api/me"); state.user = me.user; state.producer = me.producer; state.follows = me.follows||[]; } catch(e){}
    try { const r = await api("/api/listings"); state.listings = r.listings; r.listings.forEach((l)=>state.listingCache[l.id]=l); }
    catch(e){ toast("Could not reach the API."); }
    nav(); route();
  })();
})();
