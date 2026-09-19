(function () {
  var SITE = "https://herd-yard.com";
  var PAGES = {
    home: { title: "Herd Yard — Zillow For Cattle", desc: "Herd Yard is the marketplace for private-treaty cattle. Connecting buyers and sellers nationwide. No commission.", image: "/og/home.jpg", path: "/", robots: "index,follow" },
    browse: { title: "Browse cattle listings | Herd Yard", desc: "Browse private-treaty cattle for sale nationwide. Filter by breed, class, and category.", image: "/og/browse.jpg", path: "/browse", robots: "index,follow" },
    producers: { title: "Cattle producers and ranches | Herd Yard", desc: "Search Herd Yard producers. Find ranches near you and open a public ranch profile.", image: "/og/producers.jpg", path: "/producers", robots: "index,follow" },
    pricing: { title: "Producer plans and pricing | Herd Yard", desc: "List one group or unlimited cattle. Public ranch profile, no commission on private treaty.", image: "/og/pricing.jpg", path: "/pricing", robots: "index,follow" },
    faq: { title: "FAQ | Herd Yard", desc: "How Herd Yard works for buyers and sellers of private-treaty cattle.", image: "/og/faq.jpg", path: "/faq", robots: "index,follow" },
    list: { title: "List cattle for sale | Herd Yard", desc: "Publish a private-treaty cattle listing on Herd Yard. No commission.", image: "/og/list.jpg", path: "/list", robots: "index,follow" },
    updates: { title: "Latest updates | Herd Yard", desc: "What just shipped on Herd Yard: dashboard, maps, messaging, producers, and more.", image: "/og/updates.jpg", path: "/updates", robots: "index,follow" },
    signin: { title: "Sign in | Herd Yard", desc: "Sign in to your Herd Yard account to manage listings, messages, and your ranch profile.", image: "/og/signin.jpg", path: "/signin", robots: "noindex,follow" },
    signup: { title: "Create a free account | Herd Yard", desc: "Join Herd Yard to list cattle, follow ranches, and message producers nationwide.", image: "/og/signup.jpg", path: "/signup", robots: "index,follow" },
    listing: { title: "Cattle listing | Herd Yard", desc: "View this private-treaty cattle listing on Herd Yard.", image: "/og/listing.jpg", path: "/listing", robots: "index,follow" },
    ranch: { title: "Ranch profile | Herd Yard", desc: "Public ranch profile on Herd Yard with current cattle listings.", image: "/og/ranch.jpg", path: "/ranch", robots: "index,follow" },
    account: { title: "Account | Herd Yard", desc: "Your Herd Yard ranch desk.", image: "/og/signin.jpg", path: "/account", robots: "noindex,nofollow" },
    bugs: { title: "Bug squash report | Herd Yard", desc: "Bugs found and fixed on this Herd Yard build.", image: "/og/updates.jpg", path: "/bugs", robots: "noindex,follow" }
  };

  function abs(u, fallback) {
    if (!u) return SITE + (fallback || "/og/home.jpg");
    var s = String(u);
    if (s.indexOf("data:") === 0) return SITE + (fallback || "/og/home.jpg");
    if (/cowboy\.svg|logo\.(svg|png)/i.test(s)) return SITE + (fallback || "/og/home.jpg");
    if (/^https?:\/\//i.test(s)) return s;
    if (s.charAt(0) === "/") return SITE + s;
    return SITE + (fallback || "/og/home.jpg");
  }
  function setAttr(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }
  function apply(key, extra) {
    var page = Object.assign({}, PAGES[key] || PAGES.home, extra || {});
    var title = page.title;
    var desc = page.desc;
    var img = abs(page.image, PAGES[key] ? PAGES[key].image : "/og/home.jpg");
    var url = SITE + (page.path || "/");
    document.title = title;
    setAttr('meta[name="description"]', "content", desc);
    setAttr('meta[name="robots"]', "content", page.robots || "index,follow");
    setAttr('link[rel="canonical"]', "href", url);
    setAttr('meta[property="og:title"]', "content", title);
    setAttr('meta[property="og:description"]', "content", desc);
    setAttr('meta[property="og:url"]', "content", url);
    setAttr('meta[property="og:image"]', "content", img);
    setAttr('meta[property="og:image:secure_url"]', "content", img);
    setAttr('meta[property="og:image:alt"]', "content", page.imageAlt || title);
    var typeEl = document.querySelector('meta[property="og:image:type"]');
    if (typeEl) typeEl.setAttribute("content", /\.gif(\?|$)/i.test(page.image || img) ? "image/gif" : "image/jpeg");
    setAttr('meta[name="twitter:title"]', "content", title);
    setAttr('meta[name="twitter:description"]', "content", desc);
    setAttr('meta[name="twitter:image"]', "content", img);
    setAttr('link[rel="image_src"]', "href", img);
  }
  function fromHash() {
    var raw = (location.hash || "#/").replace(/^#/, "") || "/";
    var parts = raw.split("?")[0].split("/").filter(Boolean);
    if (!parts.length) return apply("home");
    if (parts[0] === "listing") return apply("listing", { path: "/listing/" + (parts[1] || "") });
    if (parts[0] === "ranch") return apply("ranch", { path: "/ranch/" + (parts[1] || "") });
    if (parts[0] === "account") return apply("account", { path: "/account" });
    apply(parts[0]);
  }

  window.HerdSeo = { apply: apply, fromHash: fromHash, abs: abs, PAGES: PAGES };
  window.addEventListener("hashchange", fromHash);
})();
