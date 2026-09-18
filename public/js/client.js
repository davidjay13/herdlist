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
    $("#acct-label").textContent = state.user ? state.user.name.split(" ")[0] : "Account";
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
      <div class="plan"><h3>Single listing</h3><div class="amt">$45</div><div class="sub">one group · 60 days</div>
        <ul><li>One listing</li><li>No commission on private treaty</li><li>Nationwide network</li></ul>
        <a class="btn btn-outline btn-wide" href="#/list">List now</a></div>
      <div class="plan featured"><h3>Producer</h3><div class="amt">$432</div><div class="sub">per year · unlimited</div>
        <ul><li>Unlimited listings</li><li>Public ranch profile</li><li>Followers</li></ul>
        <a class="btn btn-light btn-wide" href="#/signup">Become a producer</a></div>
      <div class="plan"><h3>Custom</h3><div class="amt">Talk</div><div class="sub">associations</div>
        <ul><li>All producer features</li><li>Featured placement</li></ul>
        <a class="btn btn-outline btn-wide" href="#/faq">Contact us</a></div></div>`;
  }
  function home() {
    const recent = state.listings.slice(0, 6);
    app.innerHTML = `<section class="hero"><div class="hero-bg"></div><div class="hero-inner">
      <div class="kicker">Farm to farm · Private treaty</div>
      <h1>The map of American cattle</h1>
      <p class="lead">Accounts and listings are stored on the server now — the same herd on every device.</p>
      <div class="hero-cta">
        <a class="btn btn-light btn-lg" href="#/signup">Create a free account</a>
        <a class="btn btn-primary btn-lg" href="#/list">List cattle now</a>
      </div></div></section>
      <section class="section"><div class="section-head"><div><h2>Recently listed</h2>
      <p class="sub">Live from the RangeList database.</p></div>
      <a class="btn btn-primary" href="#/browse">Browse all →</a></div>
      <div class="cards-3">${recent.map(listingCard).join("")}</div></section>
      <section class="section"><div class="section-head"><div><h2>Choose a plan</h2></div></div>${plansHTML()}</section>
      <section class="section" style="text-align:center"><h2>Your herd. Your price. Your network.</h2>
      <a class="btn btn-primary btn-lg" href="#/browse">Browse listings</a></section>`;
  }
  let mapInst = null;
  function browse() {
    const params = new URLSearchParams(location.hash.split("?")[1] || "");
    const q = { category: params.get("category") || "", breed: params.get("breed") || "", klass: params.get("klass") || "", view: params.get("view") || "split" };
    const items = state.listings.filter((l) => (!q.category || l.category === q.category) && (!q.breed || l.breed === q.breed) && (!q.klass || l.klass === q.klass));
    app.innerHTML = `<div class="browse-layout"><aside class="filters"><h3>Filter listings</h3>
      <div class="field"><label>Category</label><select id="f-cat"><option value="">All</option>${RL.CATEGORIES.map((c) => `<option ${c===q.category?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Breed</label><select id="f-breed"><option value="">All breeds</option>${RL.BREEDS.map((c) => `<option ${c===q.breed?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Class</label><select id="f-klass"><option value="">All classes</option>${RL.CLASSES.map((c) => `<option ${c===q.klass?"selected":""}>${c}</option>`).join("")}</select></div>
      <button class="btn btn-primary btn-wide" id="apply-f">Apply filters</button>
      <p class="sub" style="margin-top:16px">${items.length} listings</p></aside>
      <div class="browse-main"><div class="browse-toolbar"><div><b>Nationwide inventory</b></div>
      <div class="view-toggle"><button class="btn btn-outline" data-view="split">Map + cards</button>
      <button class="btn btn-outline" data-view="map">Map</button>
      <button class="btn btn-outline" data-view="list">Cards</button></div></div>
      <div class="map-wrap ${q.view==="map"?"tall":""} ${q.view==="list"?"hidden":""}" id="map"></div>
      <div class="listings-grid ${q.view==="map"?"hidden":""}">${items.length?items.map(listingCard).join(""):"<div class='empty'>No listings match.</div>"}</div>
      </div></div>`;
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
        const next = new URLSearchParams(location.hash.split("?")[1] || "");
        next.set("view", b.dataset.view);
        location.hash = "#/browse?" + next;
      };
    });
    if (q.view !== "list" && window.L) {
      mapInst = L.map("map").setView([39.5, -98.3], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OSM" }).addTo(mapInst);
      const icon = L.divIcon({ className: "", html: `<div style="width:18px;height:18px;background:#1b6b45;border:2px solid #fff;border-radius:50%"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      items.forEach((l) => {
        if (!l.lat) return;
        L.marker([l.lat, l.lng], { icon }).addTo(mapInst).bindPopup(`<b>${priceLabel(l)}</b><br>${l.breed} · ${l.klass}<br><a href="#/listing/${l.id}">Open</a>`);
      });
      setTimeout(() => mapInst.invalidateSize(), 80);
    }
  }
  function listingView(id) {
    const l = state.listingCache[id] || state.listings.find((x) => x.id === id);
    if (!l) { app.innerHTML = `<section class="section"><h2>Listing not found</h2></section>`; return; }
    const p = l.producer || { name: "Ranch", slug: "", location: l.location, rating: "—", avatar: l.image, id: l.producerId };
    const imgs = l.images && l.images.length ? l.images : [l.image];
    app.innerHTML = `<div class="detail"><div>
      <div class="gallery" id="hero-img" style="background-image:url('${imgs[0]}')"></div>
      <div class="thumbs">${imgs.map((src,i)=>`<button class="${i===0?"on":""}" style="background-image:url('${src}')" data-src="${src}"></button>`).join("")}</div>
      <h2 style="margin-top:22px">${l.title}</h2>
      <p class="meta">${l.breed} · ${l.klass} · ${l.head} ${l.unit} · ${l.location||""}</p>
      <p>${l.description||""}</p>
      <div class="panel" style="margin-top:16px">${Object.entries(l.details||{}).map(([k,v])=>`<div class="row"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
      </div><aside class="side-card">
      <div class="label">Asking</div><div class="stat-num" style="font-size:2rem">${priceLabel(l)}</div>
      <p class="sub">${l.daysLeft} days left · listed ${l.listedAt}</p>
      <button class="btn btn-primary btn-wide btn-lg" id="contact-btn" style="margin-top:12px">${state.user?"Message the ranch":"Sign in to contact"}</button>
      <button class="btn btn-outline btn-wide" id="follow-btn" style="margin-top:8px">${state.follows.includes(p.id)?"Following ranch":"Follow ranch"}</button>
      <div class="producer-mini"><img src="${p.avatar||l.image}" alt=""><div>
      <a href="#/ranch/${p.slug||p.id}"><b>${p.name}</b></a>
      <div class="meta">${p.location||""}</div></div></div></aside></div>`;
    app.querySelectorAll(".thumbs button").forEach((b) => {
      b.onclick = () => { app.querySelectorAll(".thumbs button").forEach((x)=>x.classList.remove("on")); b.classList.add("on"); $("#hero-img").style.backgroundImage = `url('${b.dataset.src}')`; };
    });
    $("#contact-btn").onclick = async () => {
      if (!state.user) { location.hash = "#/signup"; return; }
      try { await api("/api/listings/"+l.id+"/contact", { method: "POST", body: JSON.stringify({ body: "Interested." }) }); toast("Message saved for "+p.name+"."); }
      catch (e) { toast(e.message); }
    };
    $("#follow-btn").onclick = async () => {
      if (!state.user) { location.hash = "#/signup"; return; }
      try {
        const r = await api("/api/producers/"+p.id+"/follow", { method: "POST", body: "{}" });
        state.follows = r.following ? state.follows.concat(p.id) : state.follows.filter((x)=>x!==p.id);
        $("#follow-btn").textContent = r.following ? "Following ranch" : "Follow ranch";
      } catch (e) { toast(e.message); }
    };
  }
  function ranch(slug) {
    const pack = state.ranchCache[slug];
    if (!pack) { app.innerHTML = `<section class="section"><h2>Ranch not found</h2></section>`; return; }
    const p = pack.producer; const items = pack.listings || [];
    app.innerHTML = `<div class="profile-hero" style="background-image:url('${p.cover}')"></div>
      <div class="profile-card"><img class="av" src="${p.avatar}" alt=""><div>
      <h2 style="margin:0">${p.name}</h2><p class="sub">${p.location||""} ${p.owner?"· "+p.owner:""}</p>
      <p>${p.about||""}</p></div>
      <div class="kpis"><div><b>${items.length}</b><span class="sub">Listings</span></div>
      <div><b>${p.sold||0}</b><span class="sub">Sold</span></div></div></div>
      <section class="section"><div class="section-head"><h2>Current listings</h2></div>
      <div class="cards-3">${items.map(listingCard).join("")||"<p class='sub'>No live listings.</p>"}</div></section>`;
  }
  function listCattle() {
    if (!state.user) { location.hash = "#/signup"; toast("Create an account to list cattle."); return; }
    app.innerHTML = `<div class="form-page"><h2 class="page-title">List cattle</h2>
      <p class="sub">Saved to the server. Anyone on this URL will see it.</p>
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
      <p class="sub">${signup?"Your ranch profile is created automatically.":"Sign in to message ranches."}</p>
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
        const me = await api("/api/me");
        state.producer = me.producer; state.follows = me.follows || [];
        nav(); toast("Signed in as "+state.user.name); location.hash = "#/browse";
      } catch (err) { toast(err.message); }
    };
  }
  async function account() {
    if (!state.user) { location.hash = "#/signin"; return; }
    let mine = [];
    try { mine = (await api("/api/my/listings")).listings; } catch (e) { mine = []; }
    app.innerHTML = `<section class="section"><h2>${state.user.name}</h2>
      <p class="sub">${state.user.email} · stored in the server database</p>
      <div style="margin:16px 0;display:flex;gap:8px">
      <a class="btn btn-primary" href="#/list">New listing</a>
      <button class="btn btn-outline" id="out">Sign out</button></div>
      <h3>Your listings</h3>
      <div class="cards-3">${mine.length?mine.map(listingCard).join(""):"<p class='sub'>No listings yet.</p>"}</div></section>`;
    $("#out").onclick = async () => {
      await api("/api/signout", { method:"POST", body:"{}" });
      state.user = null; state.follows = []; nav(); location.hash = "#/";
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
      try { const r = await api("/api/producers/"+parts[1]); state.ranchCache[parts[1]]=r; state.ranchCache[r.producer.slug]=r; } catch(e){}
    }
    if (!parts.length) return home();
    if (parts[0]==="browse") return browse();
    if (parts[0]==="listing") return listingView(parts[1]);
    if (parts[0]==="ranch") return ranch(parts[1]);
    if (parts[0]==="list") return listCattle();
    if (parts[0]==="signup") return auth("signup");
    if (parts[0]==="signin") return auth("signin");
    if (parts[0]==="account") return account();
    if (parts[0]==="pricing") return pricing();
    if (parts[0]==="faq") return faq();
    home();
  }
  window.addEventListener("hashchange", route);
  document.getElementById("sell-btn").onclick = () => (location.hash = "#/list");
  document.getElementById("acct-btn").onclick = () => { location.hash = state.user ? "#/account" : "#/signin"; };
  (async function boot() {
    try { const me = await api("/api/me"); state.user = me.user; state.producer = me.producer; state.follows = me.follows||[]; } catch(e){}
    try { const r = await api("/api/listings"); state.listings = r.listings; r.listings.forEach((l)=>state.listingCache[l.id]=l); }
    catch(e){ toast("Could not reach the API. Start the Node server with npm start."); }
    nav(); route();
  })();
})();
