(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");
  const toastEl = $("#toast");

  const store = {
    get user() {
      try {
        return JSON.parse(localStorage.getItem("rl_user") || "null");
      } catch {
        return null;
      }
    },
    set user(v) {
      if (v) localStorage.setItem("rl_user", JSON.stringify(v));
      else localStorage.removeItem("rl_user");
    },
    get listings() {
      const extra = JSON.parse(localStorage.getItem("rl_listings") || "[]");
      return [...extra, ...RL.LISTINGS];
    },
    addListing(l) {
      const extra = JSON.parse(localStorage.getItem("rl_listings") || "[]");
      extra.unshift(l);
      localStorage.setItem("rl_listings", JSON.stringify(extra));
    },
    get follows() {
      return JSON.parse(localStorage.getItem("rl_follows") || "[]");
    },
    toggleFollow(id) {
      const f = this.follows;
      const i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1);
      else f.push(id);
      localStorage.setItem("rl_follows", JSON.stringify(f));
      return f.includes(id);
    },
  };

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    setTimeout(() => (toastEl.style.display = "none"), 2400);
  }

  function money(n) {
    if (n == null) return "Contact for Price";
    return (
      "$" +
      Number(n).toLocaleString("en-US") +
      (arguments[1] === false ? "" : "")
    );
  }

  function priceLabel(l) {
    if (l.priceType === "contact" || l.price == null) return "Contact for Price";
    return `${money(l.price)} / ${l.unit === "Units" ? "Unit" : "Head"}`;
  }

  function producer(id) {
    return RL.PRODUCERS.find((p) => p.id === id);
  }

  function listing(id) {
    return store.listings.find((l) => l.id === id);
  }

  function nav() {
    const u = store.user;
    $("#acct-label").textContent = u ? u.name.split(" ")[0] : "Account";
    $("#sell-btn").textContent = "List Cattle";
  }

  function listingCard(l) {
    const p = producer(l.producerId);
    return `
      <article class="listing-card" onclick="location.hash='#/listing/${l.id}'">
        <div class="thumb" style="background-image:url('${l.image}')">
          <span class="badge">${p ? p.name : "Ranch"}</span>
          <span class="days">${l.daysLeft}d left</span>
        </div>
        <div class="listing-body">
          <div class="price">${priceLabel(l)}</div>
          <div class="meta">
            <span>${l.breed}</span><span>${l.klass}</span><span>${l.head} ${l.unit}</span>
          </div>
          <div class="meta" style="margin-top:4px">${l.location}</div>
        </div>
      </article>`;
  }

  /* ---------- views ---------- */
  function home() {
    const recent = store.listings.slice(0, 6);
    app.innerHTML = `
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-inner">
          <div class="kicker">Farm to farm · Private treaty</div>
          <h1>The map of American cattle</h1>
          <p class="lead">List your herd. Find the next load. Sell off the ranch — no commission on private-treaty cattle.</p>
          <div class="hero-cta">
            <a class="btn btn-light btn-lg" href="#/signup">Create a free buyer account</a>
            <a class="btn btn-primary btn-lg" href="#/list">List cattle now</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Recently listed</h2>
            <p class="sub">Fresh groups from ranches across the country.</p>
          </div>
          <a class="btn btn-primary" href="#/browse">Browse all →</a>
        </div>
        <div class="cards-3">${recent.map(listingCard).join("")}</div>
      </section>

      <div class="band">
        <section class="section">
          <div class="section-head" style="justify-content:center;text-align:center;flex-direction:column;align-items:center">
            <h2>Helping you sell cattle for top prices</h2>
            <p class="sub">Demo numbers modeled on a live marketplace launched ${RL.STATS.launched}.</p>
          </div>
          <div class="stats-grid">
            <div class="panel">
              <div class="label">All-time head listed</div>
              <div class="stat-num">${RL.STATS.head.toLocaleString()}</div>
              <div class="label">Top breeds</div>
              ${RL.STATS.breeds.map(([n, c]) => `<div class="row"><span>${n}</span><b>${c.toLocaleString()}</b></div>`).join("")}
              <div class="label" style="margin-top:14px">Top classes</div>
              ${RL.STATS.classes.map(([n, c]) => `<div class="row"><span>${n}</span><b>${c.toLocaleString()}</b></div>`).join("")}
            </div>
            <div class="panel">
              <div class="label">All-time listing value</div>
              <div class="stat-num">$${RL.STATS.value.toLocaleString()}</div>
              <p class="sub">Direct connections keep sale-barn commissions in the producer’s pocket. Membership is the only cattle fee.</p>
              <div style="margin-top:22px">
                <a class="btn btn-primary" href="#/pricing">See producer plans</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Choose a plan</h2>
            <p class="sub">Pay to list. Never pay a cut of the herd.</p>
          </div>
        </div>
        ${plansHTML()}
      </section>

      <div class="band">
        <section class="section">
          <h2 style="text-align:center;margin-bottom:24px">Trusted by working ranches</h2>
          <div class="quotes">
            ${RL.TESTIMONIALS.map(
              (t) => `<div class="quote"><p>“${t.quote}”</p><div class="who"><b>${t.name}</b><br>${t.role}</div></div>`
            ).join("")}
          </div>
        </section>
      </div>

      <section class="section" style="text-align:center">
        <h2>Your herd. Your price. Your network.</h2>
        <p class="sub" style="margin-bottom:20px">Browse the map or put a group in front of serious buyers today.</p>
        <a class="btn btn-primary btn-lg" href="#/browse">Browse listings</a>
      </section>
    `;
  }

  function plansHTML() {
    return `
      <div class="plans">
        <div class="plan">
          <h3>Single listing</h3>
          <div class="amt">$45</div>
          <div class="sub">one group · 60 days</div>
          <ul>
            <li>One cattle or genetics listing</li>
            <li>No commission on private treaty</li>
            <li>Nationwide buyer network</li>
            <li>Free extensions until sold</li>
          </ul>
          <a class="btn btn-outline btn-wide" href="#/list">List now</a>
        </div>
        <div class="plan featured">
          <h3>Producer</h3>
          <div class="amt">$432</div>
          <div class="sub">per year · unlimited</div>
          <ul>
            <li>Unlimited listings</li>
            <li>Public ranch profile</li>
            <li>No commission on cattle sales</li>
            <li>Followers &amp; relist tools</li>
            <li>Optional genetics checkout (7% fee)</li>
          </ul>
          <a class="btn btn-light btn-wide" href="#/signup">Become a producer</a>
        </div>
        <div class="plan">
          <h3>Custom</h3>
          <div class="amt">Talk</div>
          <div class="sub">associations &amp; order buyers</div>
          <ul>
            <li>All producer features</li>
            <li>Multi-ranch seating</li>
            <li>Association discounts</li>
            <li>Featured placement</li>
          </ul>
          <a class="btn btn-outline btn-wide" href="#/faq">Contact us</a>
        </div>
      </div>`;
  }

  let mapInst = null;

  function browse() {
    const params = new URLSearchParams(location.hash.split("?")[1] || "");
    const q = {
      category: params.get("category") || "",
      breed: params.get("breed") || "",
      klass: params.get("klass") || "",
      view: params.get("view") || "split",
    };
    const items = store.listings.filter((l) => {
      if (q.category && l.category !== q.category) return false;
      if (q.breed && l.breed !== q.breed) return false;
      if (q.klass && l.klass !== q.klass) return false;
      return true;
    });

    app.innerHTML = `
      <div class="browse-layout">
        <aside class="filters">
          <h3>Filter listings</h3>
          <div class="field">
            <label>Category</label>
            <select id="f-cat">
              <option value="">All</option>
              ${RL.CATEGORIES.map((c) => `<option ${c === q.category ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Breed</label>
            <select id="f-breed">
              <option value="">All breeds</option>
              ${RL.BREEDS.map((c) => `<option ${c === q.breed ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Class</label>
            <select id="f-klass">
              <option value="">All classes</option>
              ${RL.CLASSES.map((c) => `<option ${c === q.klass ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <button class="btn btn-primary btn-wide" id="apply-f">Apply filters</button>
          <p class="sub" style="margin-top:16px">${items.length} listing${items.length === 1 ? "" : "s"} on the map</p>
        </aside>
        <div class="browse-main">
          <div class="browse-toolbar">
            <div><b>Nationwide inventory</b> · private treaty</div>
            <div class="view-toggle">
              <button class="btn btn-outline" data-view="split">Map + cards</button>
              <button class="btn btn-outline" data-view="map">Map</button>
              <button class="btn btn-outline" data-view="list">Cards</button>
            </div>
          </div>
          <div class="map-wrap ${q.view === "map" ? "tall" : ""} ${q.view === "list" ? "hidden" : ""}" id="map"></div>
          <div class="listings-grid ${q.view === "map" ? "hidden" : ""}">
            ${items.length ? items.map(listingCard).join("") : `<div class="empty">No listings match those filters.</div>`}
          </div>
        </div>
      </div>`;

    $("#apply-f").onclick = () => {
      const next = new URLSearchParams();
      const cat = $("#f-cat").value;
      const breed = $("#f-breed").value;
      const klass = $("#f-klass").value;
      if (cat) next.set("category", cat);
      if (breed) next.set("breed", breed);
      if (klass) next.set("klass", klass);
      if (q.view !== "split") next.set("view", q.view);
      location.hash = "#/browse" + (next.toString() ? "?" + next : "");
    };
    app.querySelectorAll("[data-view]").forEach((b) => {
      b.onclick = () => {
        const next = new URLSearchParams(location.hash.split("?")[1] || "");
        next.set("view", b.dataset.view);
        location.hash = "#/browse?" + next.toString();
      };
    });

    if (q.view !== "list" && window.L) {
      mapInst = L.map("map").setView([39.5, -98.3], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapInst);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;background:#1b6b45;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      items.forEach((l) => {
        if (!l.lat) return;
        L.marker([l.lat, l.lng], { icon })
          .addTo(mapInst)
          .bindPopup(
            `<b>${priceLabel(l)}</b><br>${l.breed} · ${l.klass}<br>${l.head} ${l.unit}<br><a href="#/listing/${l.id}">Open listing</a>`
          );
      });
      setTimeout(() => mapInst.invalidateSize(), 80);
    }
  }

  function listingView(id) {
    const l = listing(id);
    if (!l) {
      app.innerHTML = `<section class="section"><h2>Listing not found</h2></section>`;
      return;
    }
    const p = producer(l.producerId) || {
      name: "Independent producer",
      slug: "",
      location: l.location,
      rating: "—",
      reviews: 0,
      avatar: l.image,
      id: l.producerId,
    };
    const signed = !!store.user;
    app.innerHTML = `
      <div class="detail">
        <div>
          <div class="gallery" id="hero-img" style="background-image:url('${l.images[0]}')"></div>
          <div class="thumbs">
            ${l.images
              .map(
                (src, i) =>
                  `<button class="${i === 0 ? "on" : ""}" style="background-image:url('${src}')" data-src="${src}"></button>`
              )
              .join("")}
          </div>
          <h2 style="margin-top:22px">${l.title}</h2>
          <p class="meta">${l.breed} · ${l.klass} · ${l.head} ${l.unit} · ${l.location}</p>
          <p>${l.description}</p>
          <div class="panel" style="margin-top:16px">
            ${Object.entries(l.details || {})
              .map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`)
              .join("")}
          </div>
        </div>
        <aside class="side-card">
          <div class="label">Asking</div>
          <div class="stat-num" style="font-size:2rem">${priceLabel(l)}</div>
          <p class="sub">${l.daysLeft} days left · listed ${l.listedAt}</p>
          <button class="btn btn-primary btn-wide btn-lg" id="contact-btn" style="margin-top:12px">
            ${signed ? "Message the ranch" : "Sign in to contact"}
          </button>
          <button class="btn btn-outline btn-wide" id="follow-btn" style="margin-top:8px">
            ${store.follows.includes(p.id) ? "Following ranch" : "Follow ranch"}
          </button>
          <div class="producer-mini">
            <img src="${p.avatar}" alt="">
            <div>
              <a href="#/ranch/${p.slug || p.id}"><b>${p.name}</b></a>
              <div class="meta">${p.location}${p.rating ? " · " + p.rating + "★" : ""}</div>
            </div>
          </div>
        </aside>
      </div>`;

    app.querySelectorAll(".thumbs button").forEach((b) => {
      b.onclick = () => {
        app.querySelectorAll(".thumbs button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        $("#hero-img").style.backgroundImage = `url('${b.dataset.src}')`;
      };
    });
    $("#contact-btn").onclick = () => {
      if (!store.user) {
        location.hash = "#/signup";
        toast("Create an account to message producers.");
        return;
      }
      toast("Message sent to " + p.name + " (demo).");
    };
    $("#follow-btn").onclick = () => {
      if (!store.user) {
        location.hash = "#/signup";
        return;
      }
      const on = store.toggleFollow(p.id);
      $("#follow-btn").textContent = on ? "Following ranch" : "Follow ranch";
      toast(on ? "You’ll hear when they list again." : "Unfollowed.");
    };
  }

  function ranch(slug) {
    const p = RL.PRODUCERS.find((x) => x.slug === slug || x.id === slug);
    if (!p) {
      app.innerHTML = `<section class="section"><h2>Ranch not found</h2></section>`;
      return;
    }
    const items = store.listings.filter((l) => l.producerId === p.id);
    app.innerHTML = `
      <div class="profile-hero" style="background-image:url('${p.cover}')"></div>
      <div class="profile-card">
        <img class="av" src="${p.avatar}" alt="">
        <div>
          <h2 style="margin:0">${p.name}</h2>
          <p class="sub">${p.location} · Est. ${p.founded} · ${p.owner}</p>
          <p style="margin:8px 0 0">${p.about}</p>
          <p class="meta">${p.associations.join(" · ")}</p>
        </div>
        <div class="kpis">
          <div><b>${items.length}</b><span class="sub">Listings</span></div>
          <div><b>${p.sold}</b><span class="sub">Sold</span></div>
          <div><b>${p.rating}</b><span class="sub">${p.reviews} reviews</span></div>
        </div>
      </div>
      <section class="section">
        <div class="section-head"><h2>Current listings</h2></div>
        <div class="cards-3">${items.map(listingCard).join("") || "<p class='sub'>No live listings.</p>"}</div>
      </section>`;
  }

  function listCattle() {
    app.innerHTML = `
      <div class="form-page">
        <div class="kicker">Sell off the ranch</div>
        <h2 class="page-title">List cattle</h2>
        <p class="sub">This demo saves the listing in your browser. No payment is collected.</p>
        <form id="list-form" class="panel" style="margin-top:18px">
          <div class="form-grid">
            <div class="field full">
              <label>Title</label>
              <input name="title" required placeholder="Bred Angus pairs — foothills">
            </div>
            <div class="field">
              <label>Breed</label>
              <select name="breed">${RL.BREEDS.map((b) => `<option>${b}</option>`).join("")}</select>
            </div>
            <div class="field">
              <label>Class</label>
              <select name="klass">${RL.CLASSES.map((b) => `<option>${b}</option>`).join("")}</select>
            </div>
            <div class="field">
              <label>Head / units</label>
              <input name="head" type="number" min="1" value="25" required>
            </div>
            <div class="field">
              <label>Price per head (blank = contact)</label>
              <input name="price" type="number" min="0" placeholder="4250">
            </div>
            <div class="field">
              <label>City, State</label>
              <input name="location" required placeholder="Shingle Springs, CA">
            </div>
            <div class="field">
              <label>Category</label>
              <select name="category">${RL.CATEGORIES.map((b) => `<option>${b}</option>`).join("")}</select>
            </div>
            <div class="field full">
              <label>Description</label>
              <textarea name="description" rows="5" required placeholder="Age, breeding, vaccinations, delivery..."></textarea>
            </div>
          </div>
          <button class="btn btn-primary btn-lg" style="margin-top:16px">Publish listing</button>
        </form>
      </div>`;
    $("#list-form").onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const user = store.user || { name: "Guest Ranch", id: "guest" };
      const id = "u" + Date.now();
      store.addListing({
        id,
        producerId: "p1",
        title: fd.get("title"),
        breed: fd.get("breed"),
        klass: fd.get("klass"),
        category: fd.get("category"),
        head: Number(fd.get("head")),
        unit: fd.get("category") === "Genetics" ? "Units" : "Head",
        price: fd.get("price") ? Number(fd.get("price")) : null,
        priceType: fd.get("price") ? "per_head" : "contact",
        daysLeft: 60,
        listedAt: new Date().toISOString().slice(0, 10),
        location: fd.get("location"),
        lat: 38.6657,
        lng: -120.9263,
        status: "active",
        image:
          "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1400&q=80",
        ],
        description: fd.get("description"),
        details: { ListedBy: user.name },
      });
      toast("Listing published to the map.");
      location.hash = "#/listing/" + id;
    };
  }

  function auth(mode) {
    const signup = mode === "signup";
    app.innerHTML = `
      <div class="auth-box">
        <h2>${signup ? "Create an account" : "Welcome back"}</h2>
        <p class="sub">${signup ? "Buyers are free. Selling uses a listing or producer plan." : "Sign in to message ranches and manage listings."}</p>
        <form id="auth-form" style="margin-top:16px">
          ${signup ? `<div class="field"><label>Name / ranch</label><input name="name" required placeholder="Sutter Ridge Cattle"></div>` : ""}
          <div class="field"><label>Email</label><input name="email" type="email" required placeholder="you@ranch.com"></div>
          <div class="field"><label>Password</label><input name="password" type="password" required minlength="4"></div>
          <button class="btn btn-primary btn-wide btn-lg" style="margin-top:8px">${signup ? "Create account" : "Sign in"}</button>
        </form>
        <p class="sub" style="margin-top:14px">
          ${signup ? `Already listed? <a href="#/signin">Sign in</a>` : `New here? <a href="#/signup">Create an account</a>`}
        </p>
      </div>`;
    $("#auth-form").onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.user = {
        name: fd.get("name") || fd.get("email").split("@")[0],
        email: fd.get("email"),
      };
      nav();
      toast("Signed in as " + store.user.name);
      location.hash = "#/browse";
    };
  }

  function account() {
    const u = store.user;
    if (!u) {
      location.hash = "#/signin";
      return;
    }
    const mine = store.listings.filter((l) => l.id.startsWith("u"));
    app.innerHTML = `
      <section class="section">
        <h2>${u.name}</h2>
        <p class="sub">${u.email} · demo account stored only in this browser</p>
        <div style="margin:16px 0;display:flex;gap:8px">
          <a class="btn btn-primary" href="#/list">New listing</a>
          <button class="btn btn-outline" id="out">Sign out</button>
        </div>
        <h3>Your listings</h3>
        <div class="cards-3">${mine.length ? mine.map(listingCard).join("") : "<p class='sub'>You haven’t listed cattle yet.</p>"}</div>
      </section>`;
    $("#out").onclick = () => {
      store.user = null;
      nav();
      location.hash = "#/";
    };
  }

  function pricing() {
    app.innerHTML = `<section class="section"><h2>Producer plans</h2><p class="sub" style="margin-bottom:24px">Membership keeps the marketplace clean. Cattle sales stay private treaty.</p>${plansHTML()}</section>`;
  }

  function faq() {
    app.innerHTML = `
      <section class="section faq" style="max-width:760px">
        <h2>Frequently asked</h2>
        <p class="sub" style="margin-bottom:18px">How farm-to-farm cattle sales work on RangeList.</p>
        ${RL.FAQS.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}
        <div class="panel" style="margin-top:22px">
          <b>Need a custom plan?</b>
          <p class="sub">This is a demo app inspired by marketplaces like Herd Yard. In production you’d wire this form to email or Stripe.</p>
          <p>hello@rangelist.demo</p>
        </div>
      </section>`;
  }

  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    nav();
    if (mapInst) {
      mapInst.remove();
      mapInst = null;
    }
    if (!parts.length) return home();
    if (parts[0] === "browse") return browse();
    if (parts[0] === "listing") return listingView(parts[1]);
    if (parts[0] === "ranch") return ranch(parts[1]);
    if (parts[0] === "list") return listCattle();
    if (parts[0] === "signup") return auth("signup");
    if (parts[0] === "signin") return auth("signin");
    if (parts[0] === "account") return account();
    if (parts[0] === "pricing") return pricing();
    if (parts[0] === "faq") return faq();
    home();
  }

  window.addEventListener("hashchange", route);
  document.getElementById("sell-btn").onclick = () => (location.hash = "#/list");
  document.getElementById("acct-btn").onclick = () => {
    location.hash = store.user ? "#/account" : "#/signin";
  };
  route();
})();
