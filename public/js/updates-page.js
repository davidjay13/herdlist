(function () {
  const UPDATES = [
    {
      v: "0.5.5",
      date: "Sep 18, 2026",
      items: [
        "Account dashboard rebuilt as tiles: stats, Messages, Listing views, Local listings, Latest listings.",
        "Industry news ticker at the top of the dashboard. Admins paste article links under Account → News; headlines are pulled from the page.",
        "Herd Yard podcasts row under the ticker, showing the latest long episodes from youtube.com/@herdyard_USA.",
        "Messages tile groups by conversation (one row per person, latest note) and uses their profile photo."
      ]
    },
    {
      v: "0.5.4",
      date: "Sep 18, 2026",
      items: [
        "Message the ranch opens a compose box plus the ranch phone and email so buyers can write in-app or call.",
        "Account → Messages is a Messenger-style inbox: conversation list on the left, chat bubbles on the right.",
        "Chat avatars use ranch/buyer profile photos instead of initials.",
        "Sent and received notes both show in the inbox, with replies staying on the thread."
      ]
    },
    {
      v: "0.5.3",
      date: "Sep 18, 2026",
      items: [
        "Header and favicon switched to the single-color geometric bull mark (transparent SVG).",
        "Logo cache-bust so browsers stop showing the old map-pin."
      ]
    },
    {
      v: "0.5.2",
      date: "Sep 18, 2026",
      items: [
        "Imported catalog listings no longer appear under a personal My listings page; they stay in admin.",
        "Hidden chip removed from listing manage.",
        "#/updates no longer flashes and then dumps you back on the homepage."
      ]
    },
    {
      v: "0.5.1",
      date: "Sep 18, 2026",
      items: [
        "Homepage headline set to Zillow For Cattle.",
        "Mobile hamburger menu in the upper right with the same links as desktop."
      ]
    },
    {
      v: "0.4.6",
      date: "Sep 18, 2026",
      items: [
        "Hidden Updates page at #/updates listing shipped features (no nav link)."
      ]
    },
    {
      v: "0.4.5",
      date: "Sep 18, 2026",
      items: [
        "Public Producers directory at #/producers with ranch grid, search, listing counts.",
        "Homepage Producers preview (six ranch cards) and View all producers.",
        "Producers link added to the main nav."
      ]
    },
    {
      v: "0.4.4",
      date: "Sep 18, 2026",
      items: [
        "Restored the original green map-pin bull as the site logo."
      ]
    },
    {
      v: "0.4.3",
      date: "Sep 18, 2026",
      items: [
        "Map + cards split view uses a 2-column card grid.",
        "Listing price, breed, class, head count, and location show under each card photo.",
        "Header logo switched to SVG so a broken PNG cannot corrupt the mark."
      ]
    },
    {
      v: "0.4.2",
      date: "Sep 18, 2026",
      items: [
        "Browse defaults to map + cards.",
        "Map centered on the continental USA and kept above the fold.",
        "Listings on the right paginated (9 per page).",
        "Carto tiles replaced with Esri World Light Gray after Carto began requiring an API key."
      ]
    },
    {
      v: "0.4.1",
      date: "Sep 18, 2026",
      items: [
        "Admin dashboard: Global Listings, Producers, and Accounts tabs.",
        "Fix for partial admin nav on refresh (links baked into the shell).",
        "Listing photo can be edited from admin / listing manage."
      ]
    },
    {
      v: "0.4.0",
      date: "Sep 18, 2026",
      items: [
        "Public ranch profiles at #/ranch/{slug}.",
        "Logo used as the default avatar when a ranch has no photo.",
        "Version number added to the site footer."
      ]
    },
    {
      v: "0.3.x",
      date: "Sep 2026",
      items: [
        "Account system with signup, sign-in, and sessions.",
        "Producer dashboard with left nav and editable ranch profile.",
        "Drag-and-drop photo uploads for listings and ranch cover/avatar.",
        "Create, edit, and hide listings; sold status.",
        "Admin-only controls for david@davidjay.com.",
        "Homepage hero, plans, FAQ, and List Cattle flow.",
        "Browse page with breed/class/category filters."
      ]
    },
    {
      v: "0.2.x",
      date: "Sep 2026",
      items: [
        "Static SPA with hash routing.",
        "Node HTTP server and Postgres JSONB persistence on DigitalOcean.",
        "Seed listings and producer records."
      ]
    },
    {
      v: "0.1.x",
      date: "Sep 2026",
      items: [
        "First localStorage prototype: listings, cards, and ranch pages."
      ]
    }
  ];

  function page() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const path = hash.split("?")[0].replace(/^\//, "");
    if (path !== "updates") return false;
    const app = document.getElementById("app");
    if (!app) return true;
    const blocks = UPDATES.map(function (u) {
      return `<article class="panel" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap">
          <h3 style="margin:0;font-size:1.05rem">v${u.v}</h3>
          <div class="meta">${u.date}</div>
        </div>
        <ul style="margin:12px 0 0;padding-left:18px">
          ${u.items.map(function (it) { return `<li style="margin:6px 0">${it}</li>`; }).join("")}
        </ul>
      </article>`;
    }).join("");
    app.innerHTML = `<section class="section" style="max-width:760px">
      <h2>Updates</h2>
      <p class="sub">Shipped features on this Herd Yard build. This page is unlisted.</p>
      <div style="margin-top:22px">${blocks}</div>
    </section>`;
    return true;
  }

  window.addEventListener("hashchange", function () { setTimeout(page, 30); });
  setTimeout(page, 60);
  setTimeout(page, 400);
})();
