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
    return '<article class="listing-card" onclick="location.hash=\'#/listing/' + l.id + '\'">' +
      '<div class="thumb" style="background-image:url(\'' + (l.image || "") + '\')">' +
      '<span class="badge">' + (p && p.name ? p.name : "Ranch") + '</span>' +
      '<span class="days">' + (l.daysLeft || 0) + 'd left</span></div>' +
      '<div class="listing-body"><div class="price">' + priceLabel(l) + '</div>' +
      '<div class="meta"><span>' + (l.breed || "") + '</span><span>' + (l.klass || "") + '</span><span>' + (l.head || "") + ' ' + (l.unit || "") + '</span></div>' +
      '<div class="meta" style="margin-top:4px">' + (l.location || "") + '</div></div></article>';
  }
  function render(pack) {
    var app = document.getElementById("app");
    if (!app) return;
    var p = pack.producer;
    var items = pack.listings || [];
    var assoc = p.associations || [];
    app.innerHTML =
      '<div class="profile-hero" style="height:340px;background-image:url(\'' + (p.cover || p.avatar || "") + '\')"></div>' +
      '<div style="max-width:1100px;margin:-110px auto 0;padding:0 20px 72px;position:relative">' +
      '<div class="panel" style="display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center">' +
      '<img class="av" src="' + (p.avatar || "") + '" alt="" style="width:112px;height:112px;border-radius:22px;object-fit:cover;border:4px solid #fffcf7">' +
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
      '<div class="stats-grid" style="margin-top:18px">' +
      '<div class="panel"><div class="label">Listings</div><div class="stat-num">' + items.length + '</div></div>' +
      '<div class="panel"><div class="label">Sold</div><div class="stat-num">' + (p.sold || 0) + '</div></div>' +
      '<div class="panel"><div class="label">Rating</div><div class="stat-num">' + (p.rating || "\u2014") + '</div><div class="sub">' + (p.reviews || 0) + ' reviews</div></div>' +
      '<div class="panel"><div class="label">Followers</div><div class="stat-num">' + (p.followers || 0) + '</div></div></div>' +
      '<div class="stats-grid" style="margin-top:18px">' +
      '<div class="panel"><h2 style="margin:0 0 10px">About the ranch</h2><p style="margin:0;white-space:pre-wrap">' + (p.about || "This producer has not added an about section yet.") + '</p></div>' +
      '<div class="panel"><h2 style="margin:0 0 10px">Operations</h2><p style="margin:0;white-space:pre-wrap">' + (p.operations || "Herd size, grazing program, and how they work with buyers will show here.") + '</p></div></div>' +
      '<section style="margin-top:28px"><div class="section-head"><div><h2>Current listings</h2><p class="sub">Live groups from this ranch.</p></div></div>' +
      '<div class="cards-3">' + (items.length ? items.map(card).join("") : "<p class='sub'>No active listings.</p>") + '</div></section></div>';
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
