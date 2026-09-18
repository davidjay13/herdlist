const https = require("https");

function getJson(url) {
  return new Promise(function (resolve, reject) {
    const req = https.get(
      url,
      {
        headers: {
          "X-Inertia": "true",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
          "User-Agent": "herd-yard-importer/1.0",
        },
      },
      function (res) {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", function (c) {
          raw += c;
        });
        res.on("end", function () {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(25000, function () {
      req.destroy(new Error("timeout"));
    });
  });
}

function slugify(s) {
  return String(s || "ranch")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ranch";
}

function strip(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImg(L) {
  const imgs = L.images || [];
  for (let i = 0; i < imgs.length; i++) {
    const im = imgs[i];
    if (typeof im === "string" && im.indexOf("http") === 0) return im;
    if (im && (im.url || im.src || im.md)) return im.url || im.src || im.md;
  }
  if (typeof L.thumbnail === "string" && L.thumbnail.indexOf("http") === 0) return L.thumbnail;
  return null;
}

module.exports = async function fetchHyRows() {
  const data = await getJson("https://herdyard.com/browse");
  const props = (data && data.props) || {};
  const profiles = props.profiles || [];
  const listings = props.listings || [];
  const byUser = {};
  listings.forEach(function (L) {
    const uid = L.userId;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push(L);
  });
  return profiles.map(function (p) {
    const name = p.ranchName || p.fullName || "Ranch";
    const ls = (byUser[p.userId] || []).map(function (L) {
      const breed = (L.breed && L.breed.name) || "";
      const klass = (L.class && L.class.name) || "";
      const cat = (L.category && L.category.name) || "Cattle";
      return {
        hyListingId: L.id,
        title: (L.head ? L.head + " Head " : "") + (breed ? breed + " " : "") + (klass || "Listing"),
        breed: breed,
        klass: klass,
        category: cat,
        head: L.head || 1,
        price: L.price,
        location: L.location || p.address || "",
        image: firstImg(L),
        listedAt: String(L.publishedAt || L.createdAt || "").slice(0, 10),
        status: L.soldAt ? "sold" : "active",
      };
    });
    return {
      hyId: p.userId || p.id,
      slug: slugify(name),
      name: name,
      owner: p.fullName || name,
      email: String(p.email || "").trim(),
      phone: String(p.phone || "").trim(),
      website: p.website || "",
      location: p.address || "",
      lat: p.lat ? Number(p.lat) : null,
      lng: p.lng ? Number(p.lng) : null,
      sold: ls.filter(function (x) { return x.status === "sold"; }).length,
      rating: 5,
      reviews: 0,
      followers: 0,
      about: strip(p.about).slice(0, 600),
      cover: p.bannerImage || "",
      avatar: p.profileImage || "",
      listings: ls,
    };
  });
};
