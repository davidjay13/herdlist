(function () {
  function section() {
    var hash = location.hash || "#/account";
    if (hash === "#/account" || hash === "#/account/") return "home";
    if (hash.indexOf("#/account/profile") === 0) return "profile";
    if (hash.indexOf("#/account/sold") === 0) return "sold";
    if (hash.indexOf("#/account/orders") === 0) return "orders";
    if (hash.indexOf("#/account/messages") === 0) return "messages";
    return "home";
  }
  function navItem(href, key, label) {
    var on = section() === key;
    return '<a href="' + href + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin:2px 8px;font-weight:560;font-size:.95rem;' +
      (on ? "background:#e6f2ea;color:#0f3f28;" : "color:#3a4a3e;") + '">' + label + '</a>';
  }
  function placeholder(title, copy) {
    return '<div class="panel"><h2 style="margin:0 0 8px">' + title + '</h2><p class="sub" style="margin:0">' + copy + '</p></div>';
  }
  function home(me, listings) {
    var name = (me.user && me.user.name) || "Producer";
    var live = (listings || []).filter(function (l) { return l.status !== "sold"; });
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px">' +
      '<div><p class="sub" style="margin:0">Dashboard</p><h2 class="page-title" style="margin:4px 0 0">Welcome, ' + name.split(" ")[0] + '</h2></div>' +
      '<a class="btn btn-primary" href="#/list">+ Create listing</a></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px">' +
      '<div class="panel"><h3 style="margin:0 0 4px">Trending listings</h3><p class="sub">Most viewed in the last 24 hours</p>' +
      (live.length ? live.slice(0, 4).map(function (l) { return '<div class="row"><span>' + (l.title || "Listing") + '</span><b>' + (l.head || 0) + ' hd</b></div>'; }).join("") : '<p class="sub" style="margin:28px 0;text-align:center">No trending listings yet</p>') +
      '</div>' +
      '<div class="panel"><h3 style="margin:0 0 4px">All views</h3><p class="sub">Listing traffic this month</p><p class="sub" style="margin:28px 0;text-align:center">Views will appear here as buyers visit your cattle</p></div></div>' +
      '<div class="panel" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">Live listings</h3><a class="btn btn-outline" href="#/list">Create new listing</a></div>' +
      (live.length ? '<div class="cards-3" style="margin-top:14px">' + live.map(function (l) {
        return '<article class="listing-card" onclick="location.hash=\'#/listing/' + l.id + '\'"><div class="thumb" style="background-image:url(\'' + (l.image || "") + '\')"></div><div class="listing-body"><b>' + (l.title || "") + '</b><div class="meta">' + (l.location || "") + '</div></div></article>';
      }).join("") + '</div>' : '<p class="sub" style="margin:20px 0 8px">No live listings</p>') +
      '</div>';
  }
  function shell(inner, me) {
    var app = document.getElementById("app");
    var foot = document.querySelector(".app-footer");
    if (foot) foot.style.display = "none";
    var email = (me.user && me.user.email) || "";
    app.innerHTML =
      '<div class="dash-shell" style="display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 64px);background:#f7f4ee">' +
      '<aside style="background:#fffcf7;border-right:1px solid #d8e0d6;padding:18px 0;display:flex;flex-direction:column">' +
      '<div style="padding:4px 20px 16px"><b>Account</b><div class="sub">' + email + '</div></div>' +
      navItem("#/account", "home", "Dashboard") +
      navItem("#/account/profile", "profile", "Profile") +
      navItem("#/account/sold", "sold", "Sold") +
      navItem("#/account/orders", "orders", "Orders") +
      navItem("#/account/messages", "messages", "Messages") +
      '<a href="#/browse" style="display:flex;padding:10px 20px;color:#3a4a3e;font-weight:560;font-size:.95rem">Browse</a>' +
      '<div style="margin-top:auto;padding:12px">' +
      '<a class="btn btn-primary btn-wide" href="#/list">+ Create listing</a>' +
      '<a class="btn btn-outline btn-wide" href="#/pricing" style="margin-top:8px">Upgrade</a></div></aside>' +
      '<section id="dash-main" style="padding:28px 28px 48px">' + inner + '</section></div>';
  }
  function load() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account") !== 0) {
      var foot = document.querySelector(".app-footer");
      if (foot) foot.style.display = "";
      return;
    }
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; })
    ]).then(function (pair) {
      var me = pair[0] || {};
      if (!me.user) { location.hash = "#/signin"; return; }
      var listings = (pair[1] && pair[1].listings) || [];
      var s = section();
      var inner = s === "home" ? home(me, listings) : s === "sold" ? placeholder("Sold", "Closed listings will show here.") : s === "orders" ? placeholder("Orders", "Buyer inquiries and deals will show here.") : s === "messages" ? placeholder("Messages", "Ranch messages will show here.") : "";
      shell(inner, me);
      if (s === "profile") setTimeout(function () { window.dispatchEvent(new Event("herd-profile-ready")); }, 10);
    });
  }
  window.addEventListener("hashchange", function () { setTimeout(load, 20); });
  setTimeout(load, 80);
})();
