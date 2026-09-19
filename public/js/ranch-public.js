(function () {
  function money(n) {
    if (n == null) return "Contact for Price";
    return "$" + Number(n).toLocaleString("en-US");
  }
  function priceLabel(l) {
    if (l.priceType === "contact" || l.price == null) return "Contact for Price";
    return money(l.price) + " / " + (l.unit === "Units" ? "Unit" : "Head");
  }
  function card(l) {
    var p = l.producer;
    var img = l.image || (l.images && l.images[0]) || "";
    return '<article class="listing-card" onclick="location.hash=\'#/listing/' + l.id + '\'">' +
      '<div class="thumb"><img src="' + img + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' +
      '<span class="badge">' + (p && p.name ? p.name : "Ranch") + '</span>' +
      '<span class="days">' + (Number(l.daysLeft) > 0 ? (l.daysLeft + "d left") : "listed") + '</span>' +
      (l.video ? '<span class="play-badge">Video</span>' : "") + '</div>' +
      '<div class="listing-body"><div class="price">' + priceLabel(l) + '</div>' +
      '<div class="meta"><span>' + (l.breed || "") + '</span><span>' + (l.klass || "") + '</span><span>' + (l.head || "") + ' ' + (l.unit || "") + '</span></div>' +
      '<div class="meta" style="margin-top:4px">' + (l.location || "") + '</div></div></article>';
  }
  function stat(label, value, extra) {
    return '<div style="flex:1;min-width:0;text-align:center;padding:10px 6px">' +
      '<div style="font-size:0.68rem;letter-spacing:.08em;text-transform:uppercase;color:#6b7a6e">' + label + '</div>' +
      '<div style="font-family:Fraunces,Georgia,serif;font-size:1.35rem;line-height:1.2;margin-top:2px">' + value + '</div>' +
      (extra ? '<div class="sub" style="font-size:.75rem">' + extra + '</div>' : '') +
      '</div>';
  }
  function contactLine(label, value, href) {
    if (!value) return "";
    var inner = href ? '<a href="' + href + '" style="color:#0f3f28">' + value + '</a>' : value;
    return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #e6eee8">' +
      '<span class="sub" style="min-width:78px">' + label + '</span><span>' + inner + '</span></div>';
  }
  function render(pack) {
    var app = document.getElementById("app");
    if (!app) return;
    var p = pack.producer;
    var items = (pack.listings || []).filter(function (l) { return l.status !== "sold" && !l.hidden; });
    var assoc = p.associations || [];
    var contactHtml = contactLine("Phone", p.phone, p.phone ? "tel:" + String(p.phone).replace(/[^\d+]/g, "") : "") +
      contactLine("Email", p.email, p.email ? "mailto:" + p.email : "") +
      contactLine("Website", p.website, p.website) +
      contactLine("Owner", p.owner);
    if (!contactHtml) contactHtml = "<p class='sub'>This ranch has not published contact details yet.</p>";
    if (window.HerdSeo && p) {
      window.HerdSeo.apply("ranch", {
        title: (p.name || "Ranch") + " | Herd Yard",
        desc: String(p.about || ((p.name || "This ranch") + (p.location ? " in " + p.location : "") + " lists private-treaty cattle on Herd Yard.")).replace(/\s+/g, " ").trim().slice(0, 180),
        image: p.cover || p.avatar,
        path: "/ranch/" + (p.slug || p.id || ""),
        imageAlt: p.name || "Ranch"
      });
    }
    var cover = String(p.cover || p.avatar || "").replace(/'/g, "%27");
    var video = String(p.coverVideo || ((p.slug === "abn-ranch" || p.id === "hy26") ? "/abn-header.mp4?v=2" : "")).replace(/"/g, "");
    var banner = video
      ? '<div class="ranch-banner ranch-banner-video" style="background-image:url(\'/abn-header.jpg?v=2\')">' +
        '<video autoplay muted loop playsinline poster="/abn-header.jpg?v=2"><source src="' + video + '" type="video/mp4"></video></div>'
      : '<div class="ranch-banner" style="background-image:url(\'' + cover + '\')"></div>';
    app.innerHTML =
      '<div class="ranch-page" style="max-width:1200px;margin:0 auto;padding:12px 20px 72px">' +
      banner +
      '<div style="margin-top:16px">' +
      '<div class="panel" style="display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center">' +
      '<img class="av" src="' + (p.avatar || "/cowboy.svg?v=2") + '" alt="" style="width:112px;height:112px;border-radius:22px;object-fit:cover;border:4px solid #fffcf7;background:#d6dbd4">' +
      '<div><div class="kicker" style="color:#1b6b45">Public ranch profile</div>' +
      '<h1 style="font-family:Fraunces,Georgia,serif;font-size:clamp(2rem,4vw,3rem);margin:4px 0 6px;letter-spacing:-.03em">' + (p.name || "Ranch") + '</h1>' +
      '<p class="sub" style="margin:0">' + (p.location || "") + (p.owner ? " \u00b7 " + p.owner : "") + '</p>' +
      (assoc.length ? '<p class="meta" style="margin:8px 0 0">' + assoc.join(" \u00b7 ") + '</p>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;min-width:160px">' +
      '<button class="btn btn-primary" id="pub-msg">Message ranch</button>' +
      '<button class="btn btn-outline" id="pub-follow">Follow ranch</button>' +
      '<button class="btn btn-ghost" id="pub-share">Copy profile link</button>' +
      '</div></div>' +
      '<div class="panel" style="margin-top:14px;display:flex;align-items:center;padding:8px 10px">' +
      stat("Listings", items.length) +
      stat("Sold", p.sold || 0) +
      stat("Rating", p.rating || "\u2014", (p.reviews || 0) + " reviews") +
      stat("Followers", p.followers || 0) +
      '</div>' +
      '<div class="stats-grid" style="margin-top:18px;gap:18px">' +
      '<div class="panel"><h2 style="margin:0 0 10px">About the ranch</h2><p style="margin:0;white-space:pre-wrap">' + (p.about || "This producer has not added an about section yet.") + '</p></div>' +
      '<div class="panel"><h2 style="margin:0 0 10px">Contact</h2>' + contactHtml + '</div></div>' +
      '<section style="margin-top:28px"><div class="section-head"><div><h2>Current listings</h2><p class="sub">Live groups from this ranch.</p></div></div>' +
      '<div class="cards-3">' + (items.length ? items.map(card).join("") : "<p class='sub'>No active listings.</p>") + '</div></section></div></div>';
    document.getElementById("pub-msg").onclick = function () {
      if (items[0]) location.hash = "#/listing/" + items[0].id;
      else location.hash = "#/signin";
    };
    document.getElementById("pub-follow").onclick = function () {
      fetch("/api/producers/" + p.id + "/follow", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Sign in to follow"); return d; }); })
        .then(function (d) { document.getElementById("pub-follow").textContent = d.following ? "Following ranch" : "Follow ranch"; })
        .catch(function (e) {
          var t = document.getElementById("toast");
          if (t) { t.textContent = e.message; t.style.display = "block"; setTimeout(function () { t.style.display = "none"; }, 2400); }
        });
    };
    document.getElementById("pub-share").onclick = function () {
      var url = location.origin + "/#/ranch/" + (p.slug || p.id);
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      var t = document.getElementById("toast");
      if (t) { t.textContent = "Profile link copied"; t.style.display = "block"; setTimeout(function () { t.style.display = "none"; }, 2000); }
    };
  }
  function load() {
    var raw = (location.hash || "").replace(/^#/, "");
    var parts = raw.split("?")[0].split("/").filter(Boolean);
    if (parts[0] !== "ranch" || !parts[1]) return;
    fetch("/api/producers/" + encodeURIComponent(decodeURIComponent(parts[1])), { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (pack) { if (pack.producer) render(pack); })
      .catch(function () {});
  }
  window.addEventListener("hashchange", function () { setTimeout(load, 50); });
  setTimeout(load, 280);
})();
