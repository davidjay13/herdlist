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
    robots: "index,follow"
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
    robots: "index,follow"
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
        robots: "index,follow"
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
        robots: "index,follow"
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

function jsonLd(seo) {
  const base = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Herd Yard",
    url: SITE + "/",
    description: PAGES.home.desc,
    potentialAction: {
      "@type": "SearchAction",
      target: SITE + "/browse",
      "query-input": "required name=search_term_string"
    }
  };
  if (seo.key === "home") {
    return [
      base,
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Herd Yard",
        url: SITE + "/",
        logo: SITE + "/logo.svg",
        description: PAGES.home.desc
      }
    ];
  }
  return {
    "@context": "https://schema.org",
    "@type": seo.key === "listing" ? "Offer" : seo.key === "ranch" ? "Organization" : "WebPage",
    name: seo.title,
    description: seo.desc,
    url: SITE + seo.path,
    image: abs(seo.image)
  };
}

function inject(html, seo) {
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
  const ld = "<script type=\"application/ld+json\">" + JSON.stringify(jsonLd(seo)) + "</script>";
  if (/application\/ld\+json/.test(html)) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld);
  } else {
    html = html.replace("</head>", "    " + ld + "\n  </head>");
  }
  return html;
}

function isSpaPath(urlPath) {
  const p = String(urlPath || "/").split("?")[0];
  if (p === "/" || p === "/index.html") return true;
  if (/^\/(browse|producers|pricing|faq|list|updates|signin|signup)\/?$/.test(p)) return true;
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
    ["/faq", "0.5", "monthly"],
    ["/list", "0.7", "weekly"],
    ["/updates", "0.4", "weekly"],
    ["/signup", "0.5", "monthly"]
  ];
  (db && db.data && db.data.listings || []).forEach(function (l) {
    if (!l || l.hidden || l.status === "sold") return;
    urls.push(["/listing/" + l.id, "0.8", "weekly"]);
  });
  (db && db.data && db.data.producers || []).forEach(function (p) {
    if (!p || !(p.slug || p.id)) return;
    urls.push(["/ranch/" + (p.slug || p.id), "0.7", "weekly"]);
  });
  const body = urls.map(function (row) {
    return "  <url><loc>" + SITE + row[0] + "</loc><lastmod>" + today + "</lastmod><changefreq>" + row[2] + "</changefreq><priority>" + row[1] + "</priority></url>";
  }).join("\n");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + body + "\n</urlset>\n";
}

function robotsTxt() {
  return "User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /signin\nSitemap: " + SITE + "/sitemap.xml\n";
}

module.exports = { PAGES, SITE, forRequest, inject, isSpaPath, sitemapXml, robotsTxt, abs };
