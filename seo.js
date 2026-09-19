const SITE = "https://herd-yard.com";

const PAGES = {
  home: {
    key: "home",
    path: "/",
    title: "Herd Yard — Zillow For Cattle",
    desc: "Herd Yard is the marketplace for private-treaty cattle. Connecting buyers and sellers nationwide. No commission.",
    image: "/og/home.jpg",
    imageAlt: "Herd Yard — Zillow For Cattle",
    robots: "index,follow"
  },
  browse: {
    key: "browse",
    path: "/browse",
    title: "Browse cattle listings | Herd Yard",
    desc: "Browse private-treaty cattle for sale nationwide. Filter by breed, class, and category. Map and listing cards on one page.",
    image: "/og/browse.jpg",
    imageAlt: "Browse cattle listings on Herd Yard",
    robots: "index,follow"
  },
  producers: {
    key: "producers",
    path: "/producers",
    title: "Cattle producers and ranches | Herd Yard",
    desc: "Search Herd Yard producers. Find ranches near you, see who is listing cattle, and open a public ranch profile.",
    image: "/og/producers.jpg",
    imageAlt: "Find cattle producers on Herd Yard",
    robots: "index,follow"
  },
  pricing: {
    key: "pricing",
    path: "/pricing",
    title: "Producer plans and pricing | Herd Yard",
    desc: "List one group or unlimited cattle. Public ranch profile, no commission on private treaty. See Herd Yard producer plans.",
    image: "/og/pricing.jpg",
    imageAlt: "Herd Yard producer plans",
    robots: "index,follow"
  },
  faq: {
    key: "faq",
    path: "/faq",
    title: "FAQ | Herd Yard",
    desc: "How Herd Yard works for buyers and sellers of private-treaty cattle. Listings, messaging, plans, and ranch profiles.",
    image: "/og/faq.jpg",
    imageAlt: "Herd Yard frequently asked questions",
    robots: "index,follow"
  },
  list: {
    key: "list",
    path: "/list",
    title: "List cattle for sale | Herd Yard",
    desc: "Publish a private-treaty cattle listing on Herd Yard. Buyers can message the ranch in-app, by email, or by phone. No commission.",
    image: "/og/list.jpg",
    imageAlt: "List cattle on Herd Yard",
    robots: "noindex,follow"
  },
  updates: {
    key: "updates",
    path: "/updates",
    title: "Latest updates | Herd Yard",
    desc: "What just shipped on Herd Yard: dashboard, maps, messaging, producers, and more.",
    image: "/og/updates.jpg",
    imageAlt: "Latest Herd Yard product updates",
    robots: "index,follow"
  },
  signin: {
    key: "signin",
    path: "/signin",
    title: "Sign in | Herd Yard",
    desc: "Sign in to your Herd Yard account to manage listings, messages, and your ranch profile.",
    image: "/og/signin.jpg",
    imageAlt: "Sign in to Herd Yard",
    robots: "noindex,follow"
  },
  signup: {
    key: "signup",
    path: "/signup",
    title: "Create a free account | Herd Yard",
    desc: "Join Herd Yard to list cattle, follow ranches, and message producers nationwide. Free to create an account.",
    image: "/og/signup.jpg",
    imageAlt: "Create a Herd Yard account",
    robots: "noindex,follow"
  },
  listing: {
    key: "listing",
    path: "/listing",
    title: "Cattle listing | Herd Yard",
    desc: "View this private-treaty cattle listing on Herd Yard. Breed, class, location, and contact the ranch.",
    image: "/og/listing.jpg",
    imageAlt: "Cattle listing on Herd Yard",
    robots: "index,follow"
  },
  ranch: {
    key: "ranch",
    path: "/ranch",
    title: "Ranch profile | Herd Yard",
    desc: "Public ranch profile on Herd Yard with current cattle listings and a way to follow this producer.",
    image: "/og/ranch.jpg",
    imageAlt: "Ranch profile on Herd Yard",
    robots: "index,follow"
  },
  account: {
    key: "account",
    path: "/account",
    title: "Account | Herd Yard",
    desc: "Your Herd Yard ranch desk.",
    image: "/og/signin.jpg",
    imageAlt: "Herd Yard account",
    robots: "noindex,nofollow"
  },
  bugs: {
    key: "bugs",
    path: "/bugs",
    title: "Bug squash report | Herd Yard",
    desc: "Bugs found and fixed on this Herd Yard build.",
    image: "/og/updates.jpg",
    imageAlt: "Herd Yard bug squash report",
    robots: "noindex,follow"
  }
};

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&" + "amp;")
    .replace(/"/g, "&" + "quot;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;");
}

function abs(u, fallback) {
  if (!u) return SITE + (fallback || "/og/home.jpg");
  const s = String(u);
  if (s.indexOf("data:") === 0) return SITE + (fallback || "/og/home.jpg");
  if (/cowboy\.svg|logo\.(svg|png)/i.test(s)) return SITE + (fallback || "/og/home.jpg");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === "/") return SITE + s;
  return SITE + (fallback || "/og/home.jpg");
}

function parsePath(urlPath) {
  let p = String(urlPath || "/").split("?")[0];
  if (p === "/index.html") p = "/";
  const parts = p.split("/").filter(Boolean);
  return { p: p || "/", parts: parts };
}

function forRequest(urlPath, db) {
  const { p, parts } = parsePath(urlPath);
  if (!parts.length) return Object.assign({}, PAGES.home);
  const key = parts[0];
  if (key === "listing" && parts[1] && db && db.data) {
    const l = (db.data.listings || []).find(function (x) { return String(x.id) === String(parts[1]); });
    if (l && l.status !== "sold" && !l.hidden) {
      const bits = [l.breed, l.klass, l.head ? l.head + " " + (l.unit || "head") : "", l.location].filter(Boolean).join(" · ");
      const desc = (l.description || bits || PAGES.listing.desc).replace(/\s+/g, " ").trim().slice(0, 180);
      return {
        key: "listing",
        path: "/listing/" + parts[1],
        title: (l.title || "Cattle listing") + " | Herd Yard",
        desc: desc,
        image: abs(l.image, "/og/listing.jpg"),
        imageAlt: l.title || "Cattle listing",
        robots: "index,follow",
        listing: l
      };
    }
  }
  if (key === "ranch" && parts[1] && db && db.data) {
    const prod = (db.data.producers || []).find(function (x) {
      return String(x.slug) === String(parts[1]) || String(x.id) === String(parts[1]);
    });
    if (prod) {
      const loc = prod.location ? " in " + prod.location : "";
      return {
        key: "ranch",
        path: "/ranch/" + (prod.slug || parts[1]),
        title: (prod.name || "Ranch") + " | Herd Yard",
        desc: (prod.about || (prod.name || "This ranch") + loc + " lists private-treaty cattle on Herd Yard.").replace(/\s+/g, " ").trim().slice(0, 180),
        image: abs(prod.cover || prod.avatar, "/og/ranch.jpg"),
        imageAlt: (prod.name || "Ranch") + " on Herd Yard",
        robots: "index,follow",
        producer: prod
      };
    }
  }
  if (key === "account") return Object.assign({}, PAGES.account);
  if (PAGES[key]) {
    const page = Object.assign({}, PAGES[key]);
    if (parts[1] && (key === "listing" || key === "ranch")) page.path = "/" + key + "/" + parts[1];
    return page;
  }
  return Object.assign({}, PAGES.home);
}

function jsonLd(seo, db) {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Herd Yard",
    url: SITE + "/",
    logo: SITE + "/logo.svg",
    description: PAGES.home.desc,
    sameAs: [
      "https://www.instagram.com/herdyard/",
      "https://www.youtube.com/@herdyard_USA",
      "https://www.facebook.com/herdyard"
    ]
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Herd Yard",
    url: SITE + "/",
    description: PAGES.home.desc,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: SITE + "/browse?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
  if (seo.key === "home") return [site, org];
  if (seo.key === "listing" && seo.listing) {
    const l = seo.listing;
    const offer = {
      "@type": "Offer",
      url: SITE + seo.path,
      availability: "https://schema.org/InStock",
      priceCurrency: "USD"
    };
    const price = Number(l.price);
    if (price > 0) offer.price = String(price);
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title || seo.title,
      description: seo.desc,
      image: abs(seo.image),
      brand: { "@type": "Organization", name: "Herd Yard" },
      offers: offer
    };
  }
  if (seo.key === "ranch" && seo.producer) {
    const p = seo.producer;
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: p.name || "Ranch",
      url: SITE + seo.path,
      description: seo.desc,
      image: abs(seo.image),
      address: p.location ? { "@type": "PostalAddress", addressLocality: p.location } : undefined
    };
  }
  if (seo.key === "faq") {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(function (f) {
        return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } };
      })
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title,
    description: seo.desc,
    url: SITE + seo.path,
    image: abs(seo.image),
    isPartOf: { "@type": "WebSite", name: "Herd Yard", url: SITE + "/" }
  };
}

const FAQS = [
  { q: "What is Herd Yard?", a: "Herd Yard is a farm-to-farm marketplace for cattle and livestock genetics. Producers list animals on a map. Buyers search by breed, class, and location, then contact the ranch directly to close a private-treaty sale." },
  { q: "Is this an auction?", a: "No. There is no bidding clock and no sale barn. You set the price — or list as contact-for-price — and negotiate off the farm." },
  { q: "Does Herd Yard take a commission on cattle?", a: "Not on private-treaty cattle sales. You pay a listing or membership fee. Optional e-commerce for semen and embryos carries a platform fee when payment runs through the site." },
  { q: "How long does a listing stay up?", a: "Sixty days. If it hasn't sold, you can extend it at no extra cost until it does." },
  { q: "Who can see my phone number?", a: "Only signed-in buyers. Guest visitors can browse listings and the map, but contact details stay gated so you are not flooded with junk messages." },
  { q: "Can I list just one group of cattle?", a: "Yes. Single Listing is $45. If you sell throughout the year, Producer membership is $432 and includes unlimited listings plus a public ranch profile." }
];

function isTestListing(l) {
  const t = String((l && l.title) || "").trim().toLowerCase();
  if (!t) return false;
  if (t === "test" || t === "testing" || t === "test listing") return true;
  if (/^test(\s|[-:#./])/.test(t)) return true;
  return false;
}

function liveListings(db) {
  return ((db && db.data && db.data.listings) || []).filter(function (l) {
    return l && !l.hidden && l.status !== "sold" && !isTestListing(l);
  });
}

function crawlerCard(l) {
  const img = esc(String(l.image || "/og/listing.jpg").split("'").join(""));
  const bits = [l.breed, l.klass, l.head ? l.head + " " + (l.unit || "head") : ""].filter(Boolean).join(" · ");
  const price = l.price ? "$" + Number(l.price).toLocaleString() + " / head" : "Contact for price";
  return (
    '<a class="listing-card" href="/listing/' + esc(l.id) + '">' +
    '<div class="thumb" style="background-image:url(\'' + img + '\')"></div>' +
    '<div class="listing-body"><div class="price">' + esc(price) + "</div>" +
    '<div class="meta">' + esc(bits) + "</div>" +
    '<div class="meta" style="margin-top:4px">' + esc(l.location || "") + "</div>" +
    "<h3 class=\"listing-title\">" + esc(l.title || "Cattle listing") + "</h3></div></a>"
  );
}

function crawlerHtml(seo, db) {
  const listings = liveListings(db).slice(0, 12);
  const cards = listings.map(crawlerCard).join("");
  if (seo.key === "listing" && seo.listing) {
    const l = seo.listing;
    const img = esc(String(l.image || "/og/listing.jpg").split("'").join(""));
    return (
      '<article class="section" style="max-width:860px">' +
      "<h1>" + esc(l.title || "Cattle listing") + "</h1>" +
      '<p class="lead">' + esc(seo.desc) + "</p>" +
      '<img src="' + img + '" alt="' + esc(l.title || "Cattle") + '" style="width:100%;max-height:420px;object-fit:cover;border-radius:16px" />' +
      "<p>" + esc([l.breed, l.klass, l.head, l.location].filter(Boolean).join(" · ")) + "</p>" +
      "<p>" + esc((l.description || "").slice(0, 600)) + "</p>" +
      '<p><a class="btn btn-primary" href="/browse">Browse more listings</a></p></article>'
    );
  }
  if (seo.key === "ranch" && seo.producer) {
    const p = seo.producer;
    return (
      '<section class="section"><h1>' + esc(p.name || "Ranch") + "</h1>" +
      '<p class="lead">' + esc(seo.desc) + "</p>" +
      "<p>" + esc(p.location || "") + "</p>" +
      '<div class="cards-3">' + cards + "</div></section>"
    );
  }
  if (seo.key === "browse") {
    return (
      '<section class="section"><h1>Browse cattle listings</h1>' +
      '<p class="lead">' + esc(PAGES.browse.desc) + "</p>" +
      '<div class="cards-3">' + cards + "</div></section>"
    );
  }
  if (seo.key === "producers") {
    const ranches = ((db && db.data && db.data.producers) || []).slice(0, 12);
    const html = ranches.map(function (p) {
      return '<a class="listing-card" href="/ranch/' + esc(p.slug || p.id) + '"><div class="listing-body"><h3>' + esc(p.name || "Ranch") + "</h3><p class=\"meta\">" + esc(p.location || "") + "</p></div></a>";
    }).join("");
    return '<section class="section"><h1>Cattle producers and ranches</h1><p class="lead">' + esc(PAGES.producers.desc) + '</p><div class="cards-3">' + html + "</div></section>";
  }
  if (seo.key === "faq") {
    const items = FAQS.map(function (f) {
      return "<details open><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
    }).join("");
    return '<section class="section faq" style="max-width:760px"><h1>Frequently asked</h1>' + items + "</section>";
  }
  if (seo.key === "pricing") {
    return '<section class="section"><h1>Producer plans</h1><p class="lead">' + esc(PAGES.pricing.desc) + "</p><p>Single listing $45 · Producer $432/year · no commission on private-treaty cattle.</p></section>";
  }
  return (
    '<section class="hero"><div class="hero-bg"></div><div class="hero-inner">' +
    '<div class="kicker">Farm to farm · Private treaty</div>' +
    "<h1>Zillow For Cattle</h1>" +
    '<p class="lead">Connecting buyers and sellers nationwide. No commission on private-treaty cattle.</p>' +
    '<div class="hero-cta"><a class="btn btn-light btn-lg" href="/signup">Create a free account</a>' +
    '<a class="btn btn-primary btn-lg" href="/list">List cattle now</a></div></div></section>' +
    '<section class="section"><div class="section-head"><div><h2>Recently listed</h2>' +
    '<p class="sub">Private treaty cattle from ranches nationwide.</p></div>' +
    '<a class="btn btn-primary" href="/browse">Browse all →</a></div>' +
    '<div class="cards-3">' + cards + "</div></section>"
  );
}

function inject(html, seo, db) {
  const img = abs(seo.image);
  const url = SITE + (seo.path || "/");
  const title = seo.title;
  const desc = seo.desc;
  html = html.replace(/<title>[^<]*<\/title>/, "<title>" + esc(title) + "</title>");
  html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="' + esc(desc) + '"');
  html = html.replace(/<link rel="canonical" href="[^"]*"/, '<link rel="canonical" href="' + esc(url) + '"');
  html = html.replace(/<meta property="og:title" content="[^"]*"/, '<meta property="og:title" content="' + esc(title) + '"');
  html = html.replace(/<meta property="og:description" content="[^"]*"/, '<meta property="og:description" content="' + esc(desc) + '"');
  html = html.replace(/<meta property="og:url" content="[^"]*"/, '<meta property="og:url" content="' + esc(url) + '"');
  html = html.replace(/<meta property="og:image" content="[^"]*"/g, '<meta property="og:image" content="' + esc(img) + '"');
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"/, '<meta property="og:image:secure_url" content="' + esc(img) + '"');
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"/, '<meta property="og:image:alt" content="' + esc(seo.imageAlt || title) + '"');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, '<meta name="twitter:title" content="' + esc(title) + '"');
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, '<meta name="twitter:description" content="' + esc(desc) + '"');
  html = html.replace(/<meta name="twitter:image" content="[^"]*"/, '<meta name="twitter:image" content="' + esc(img) + '"');
  html = html.replace(/<link rel="image_src" href="[^"]*"/, '<link rel="image_src" href="' + esc(img) + '"');
  if (/name="robots"/.test(html)) {
    html = html.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="' + esc(seo.robots || "index,follow") + '"');
  } else {
    html = html.replace("</title>", "</title>\n    <meta name=\"robots\" content=\"" + esc(seo.robots || "index,follow") + "\" />");
  }
  const ld = "<script type=\"application/ld+json\">" + JSON.stringify(jsonLd(seo, db)) + "</script>";
  if (/application\/ld\+json/.test(html)) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld);
  } else {
    html = html.replace("</head>", "    " + ld + "\n  </head>");
  }
  if (seo.key === "home") {
    if (!/rel="preload"[^>]+og\/home/.test(html)) {
      html = html.replace("</head>", '    <link rel="preload" as="image" href="/hero.jpg" />\n  </head>');
    }
  }
  const inner = crawlerHtml(seo, db);
  html = html.replace(/<main id="app"><\/main>/, '<main id="app">' + inner + "</main>");
  return html;
}

function isSpaPath(urlPath) {
  const p = String(urlPath || "/").split("?")[0];
  if (p === "/" || p === "/index.html") return true;
  if (/^\/(browse|producers|pricing|faq|list|updates|signin|signup|bugs)\/?$/.test(p)) return true;
  if (/^\/listing\/[^/]+\/?$/.test(p)) return true;
  if (/^\/ranch\/[^/]+\/?$/.test(p)) return true;
  if (/^\/account(\/.*)?$/.test(p)) return true;
  return false;
}

function sitemapXml(db) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ["/", "1.0", "daily"],
    ["/browse", "0.9", "daily"],
    ["/producers", "0.9", "daily"],
    ["/pricing", "0.6", "weekly"],
    ["/faq", "0.7", "monthly"],
    ["/updates", "0.3", "weekly"]
  ];
  liveListings(db).forEach(function (l) {
    urls.push(["/listing/" + l.id, "0.8", "weekly"]);
  });
  ((db && db.data && db.data.producers) || []).forEach(function (p) {
    if (!p || !(p.slug || p.id)) return;
    urls.push(["/ranch/" + (p.slug || p.id), "0.7", "weekly"]);
  });
  const body = urls.map(function (row) {
    return "  <url><loc>" + SITE + row[0] + "</loc><lastmod>" + today + "</lastmod><changefreq>" + row[2] + "</changefreq><priority>" + row[1] + "</priority></url>";
  }).join("\n");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + body + "\n</urlset>\n";
}

function robotsTxt() {
  return "User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /signin\nDisallow: /list\nDisallow: /bugs\nSitemap: " + SITE + "/sitemap.xml\n";
}

module.exports = { PAGES, SITE, forRequest, inject, isSpaPath, sitemapXml, robotsTxt, abs, isTestListing };
