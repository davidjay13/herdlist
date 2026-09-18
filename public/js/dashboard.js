(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }
  function section() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account/profile") === 0) return "profile";
    if (hash.indexOf("#/account/sold") === 0) return "sold";
    if (hash.indexOf("#/account/orders") === 0) return "orders";
    if (hash.indexOf("#/account/messages") === 0) return "messages";
    return "home";
  }
  function esc(v) {
    return String(v || "").split("<").join(" ");
  }
  function navItem(href, key, label) {
    var on = section() === key;
    var bg = on ? "#e6f2ea" : "transparent";
    var color = on ? "#0f3f28" : "#3a4a3e";
    return "<a href='" + href + "' style='display:block;padding:10px 12px;border-radius:10px;margin:2px 8px;font-weight:560;background:" + bg + ";color:" + color + ";'>" + label + "</a>";
  }
  function shellNow(inner, email) {
    var app = document.getElementById("app");
    if (!app) return;
    app.innerHTML =
      "<div class='dash-shell' style='display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 64px);background:#f7f4ee'>" +
      "<aside style='background:#fffcf7;border-right:1px solid #d8e0d6;padding:18px 0;display:flex;flex-direction:column'>" +
      "<div style='padding:4px 20px 16px'><b>Account</b><div class='sub'>" + esc(email) + "</div></div>" +
      navItem("#/account", "home", "Dashboard") +
      navItem("#/account/profile", "profile", "Profile") +
      navItem("#/account/sold", "sold", "Sold") +
      navItem("#/account/orders", "orders", "Orders") +
      navItem("#/account/messages", "messages", "Messages") +
      "<a href='#/browse' style='display:block;padding:10px 20px;color:#3a4a3e;font-weight:560'>Browse</a>" +
      "<div style='margin-top:auto;padding:12px'><a class='btn btn-primary btn-wide' href='#/list'>+ Create listing</a>" +
      "<a class='btn btn-outline btn-wide' href='#/pricing' style='margin-top:8px'>Upgrade</a></div></aside>" +
      "<section id='dash-main' style='padding:28px'>" + (inner || "<p class='sub'>Loading...</p>") + "</section></div>";
  }
  function profileHtml(me) {
    var user = me.user || {};
    var p = me.producer || {};
    return "<h2 class='page-title'>Profile settings</h2>" +
      (p.slug ? "<p><a class='btn btn-outline' href='#/ranch/" + p.slug + "'>View public ranch page</a></p>" : "") +
      "<form id='dash-profile-form' class='panel'><div class='form-grid'>" +
      "<div class='field'><label>Full name</label><input name='name' value='" + esc(user.name) + "'></div>" +
      "<div class='field'><label>Phone</label><input name='phone' value='" + esc(user.phone || p.phone) + "'></div>" +
      "<div class='field full'><label>Email</label><input name='email' value='" + esc(user.email) + "'></div>" +
      "<div class='field'><label>Ranch name</label><input name='ranchName' value='" + esc(p.name || user.name) + "'></div>" +
      "<div class='field'><label>Owner</label><input name='owner' value='" + esc(p.owner || user.name) + "'></div>" +
      "<div class='field'><label>Location</label><input name='location' value='" + esc(p.location) + "'></div>" +
      "<div class='field'><label>Associations</label><input name='associations' value='" + esc((p.associations || []).join(", ")) + "'></div>" +
      "<div class='field full'><label>About</label><textarea name='about' rows='4'>" + (p.about || "") + "</textarea></div>" +
      "<div class='field full'><label>Operations</label><textarea name='operations' rows='4'>" + (p.operations || "") + "</textarea></div></div>" +
      "<button class='btn btn-primary' style='margin-top:14px' type='submit'>Save profile</button></form>";
  }
  function home(me, listings) {
    var name = ((me.user && me.user.name) || "Producer").split(" ")[0];
    var live = listings || [];
    var rows = live.length ? live.map(function (l) {
      return "<div class='row'><span>" + esc(l.title) + "</span><a href='#/listing/" + l.id + "'>Open</a></div>";
    }).join("") : "<p class='sub'>No live listings</p>";
    return "<h2 class='page-title'>Welcome, " + esc(name) + "</h2><p class='sub'>This is your ranch dashboard.</p>" +
      "<div class='panel' style='margin-top:16px'><h3>Live listings</h3>" + rows + "</div>";
  }
  function load() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account") !== 0) return;
    shellNow("<p class='sub'>Loading dashboard...</p>", "");
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; })
    ]).then(function (pair) {
      var me = pair[0] || {};
      if (!me.user) { location.hash = "#/signin"; return; }
      var listings = (pair[1] && pair[1].listings) || [];
      var s = section();
      var inner = s === "profile" ? profileHtml(me) : s === "home" ? home(me, listings) : "<div class='panel'><h2>" + s + "</h2><p class='sub'>Coming next.</p></div>";
      shellNow(inner, me.user.email || "");
      var form = document.getElementById("dash-profile-form");
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          var body = Object.fromEntries(new FormData(form).entries());
          fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data.error || "Save failed"); toast("Profile saved."); }); })
            .catch(function (err) { toast(err.message); });
        };
      }
    }).catch(function () { shellNow("<p>Could not load account.</p>", ""); });
  }
  window.addEventListener("hashchange", load);
  setTimeout(load, 0);
  setTimeout(load, 400);
})();
