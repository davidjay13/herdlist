(function () {
  // Add a new version block at the top of UPDATES in the same commit as every user-facing deploy.
  const UPDATES = [
    {
      v: "0.5.28",
      date: "Sep 19, 2026",
      items: [
        "ABN Ranch public profile header plays the same looping pasture video."
      ]
    },
    {
      v: "0.5.27",
      date: "Sep 19, 2026",
      items: [
        "ABN Ranch featured profile on the homepage now has a looping pasture video in the header."
      ]
    },
    {
      v: "0.5.26",
      date: "Sep 19, 2026",
      items: [
        "Homepage adds Trusted by Producers Nationwide and Why Herd Yard from herdyard.com."
      ]
    },
    {
      v: "0.5.25",
      date: "Sep 19, 2026",
      items: [
        "Homepage adds Helping You Sell Your Cattle for Top Prices and Build Your Producer Profile, matching the herdyard.com sections."
      ]
    },
    {
      v: "0.5.24",
      date: "Sep 19, 2026",
      items: [
        "Ranch header photos use the same 250× / 400px frame as herdyard.com on the public profile and in Profile settings, so imported covers crop correctly."
      ]
    },
    {
      v: "0.5.23",
      date: "Sep 19, 2026",
      items: [
        "Homepage hero uses a full-bleed cattle photo again, not the share-card thumbnail."
      ]
    },
    {
      v: "0.5.22",
      date: "Sep 19, 2026",
      items: [
        "www.herd-yard.com and herdyard.com redirect to herd-yard.com when pointed at this app.",
        "Admin Traffic page counts page views. Browse has a search box. Listing photos upload as files with alt text. Test listings stay out of the public site and sitemap. Fonts are hosted on Herd Yard instead of Google."
      ]
    },
    {
      v: "0.5.21",
      date: "Sep 19, 2026",
      items: [
        "Public pages now include real headings and listing cards in the first HTML so search engines can read the site without running the app.",
        "Maps load only on Browse and Producers. Homepage hero uses a local photo. CSS and JS cache longer; security headers added."
      ]
    },
    {
      v: "0.5.20",
      date: "Sep 19, 2026",
      items: [
        "List cattle photo and video boxes stay as drop zones on phones — no native file picker chrome."
      ]
    },
    {
      v: "0.5.19",
      date: "Sep 19, 2026",
      items: [
        "Homepage hero buttons stack vertically so the hero reads taller."
      ]
    },
    {
      v: "0.5.18",
      date: "Sep 19, 2026",
      items: [
        "Photo and video upload now render in the List cattle form on phones, with a visible file picker."
      ]
    },
    {
      v: "0.5.17",
      date: "Sep 19, 2026",
      items: [
        "Photo and video upload sits under the listing title on phones, with large tap targets that open the camera roll."
      ]
    },
    {
      v: "0.5.16",
      date: "Sep 19, 2026",
      items: [
        "Listings can include a video: upload mp4/webm/mov (40 MB max) or paste a YouTube/Vimeo link. It plays on the listing page."
      ]
    },
    {
      v: "0.5.15",
      date: "Sep 19, 2026",
      items: [
        "Browse cards no longer crop the price, breed, class, and location — the photo stays on top and the text sits fully under it."
      ]
    },
    {
      v: "0.5.14",
      date: "Sep 19, 2026",
      items: [
        "Bug squash pass: Message the ranch no longer auto-sends Interested; profile associations and login email save; days left counts down; sold listings stay off ranch pages; ranch phone/email stay off public browse JSON.",
        "Bug report at /bugs with every item found and fixed on this pass."
      ]
    },
    {
      v: "0.5.13",
      date: "Sep 19, 2026",
      items: [
        "Updates page is kept current with each deploy — latest ship notes land here the same day they go live.",
        "Admin → Emails can send a test welcome and send the weekly stats recap immediately.",
        "Weekly Account Stats recap is live through Postmark (sample sent). Opt in on Profile to receive it Mondays."
      ]
    },
    {
      v: "0.5.12",
      date: "Sep 19, 2026",
      items: [
        "Profile email opt-ins: Weekly Account Stats, Herd Yard Updates, and Partner Opportunities.",
        "Monday weekly recap email for opted-in accounts: views, messages, new listings, followers, plus three Herd Yard highlights."
      ]
    },
    {
      v: "0.5.11",
      date: "Sep 19, 2026",
      items: [
        "Admin → Emails lists every outbound message: recipient, subject, status, and time, with search for typo addresses."
      ]
    },
    {
      v: "0.5.10",
      date: "Sep 19, 2026",
      items: [
        "Transactional email: welcome when you create an account, a note when your listing goes live, an email when someone messages you, and a note when someone follows your ranch.",
        "David also gets a copy when a new account is created."
      ]
    },
    {
      v: "0.5.9",
      date: "Sep 19, 2026",
      items: [
        "Unique title, description, and social thumbnail for each public page (home, browse, producers, listing, ranch, plans, FAQ, list, updates).",
        "Listing and ranch pages use the cattle photo or ranch name in the preview card when shared.",
        "Sitemap at /sitemap.xml and robots.txt. Account pages are noindex."
      ]
    },
    {
      v: "0.5.8",
      date: "Sep 19, 2026",
      items: [
        "Mobile dashboard: Welcome at the top, horizontal account pills, sidebar no longer stacks over the tiles.",
        "Dashboard stats are four compact squares on one row.",
        "Mobile Browse drops the view toggles and always shows the map with listing cards underneath.",
        "Category, Breed, and Class filters sit on one compact row and apply as you change them.",
        "Mobile inbox is list-first, then a full-screen thread with a back control.",
        "Homepage Browse all button stays on one line.",
        "Tighter top padding on mobile so Producers and other pages sit under the header."
      ]
    },
    {
      v: "0.5.7",
      date: "Sep 19, 2026",
      items: [
        "Header: Account removed from the main nav. After login, List Cattle is replaced by My Account, which opens the dashboard.",
        "Industry news ticker scrolls left to right (slower). Admins can edit each story's headline and subtext.",
        "Missing profile photos use the cowboy hat silhouette instead of the Herd Yard bull."
      ]
    },
    {
      v: "0.5.6",
      date: "Sep 18, 2026",
      items: [
        "Producers directory has View on map, with a pin per ranch.",
        "Admin Producers uses the same tiles as the public directory, with View and Edit. Admins can change ranch photos, contact, and about.",
        "Latest Updates link added to the footer.",
        "FAQ copy says Herd Yard. Producers subtitle is Search to find other producers near you."
      ]
    },
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
    if (window.HerdSeo) window.HerdSeo.apply("updates");
    app.innerHTML = `<section class="section" style="max-width:760px">
      <h2>Updates</h2>
      <p class="sub">Shipped features on this Herd Yard build.</p>
      <div style="margin-top:22px">${blocks}</div>
    </section>`;
    return true;
  }

  window.addEventListener("hashchange", function () { setTimeout(page, 30); });
  setTimeout(page, 60);
  setTimeout(page, 400);
})();
