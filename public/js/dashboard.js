(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }
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
  function esc(v) { return String(v || "").replace(/"/g, """); }
  function profileHtml(me, listings) {
    var user = me.user || {};
    var p = me.producer || {};
    var cover = p.cover || "";
    var avatar = p.avatar || "";
    return '<div><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">' +
      '<div><p class="sub" style="margin:0">Dashboard → Profile</p><h2 class="page-title" style="margin:4px 0 0">Profile settings</h2></div>' +
      (p.slug ? '<a class="btn btn-outline" href="#/ranch/' + p.slug + '">View public ranch page</a>' : '') +
      '</div>' +
      '<div id="cover-drop" style="border:2px dashed #1b6b45;border-radius:16px;min-height:150px;margin-bottom:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:' +
      (cover ? "#ccc url(\'' + cover + '\') center/cover no-repeat" : "#e6f2ea") + '">' +
      '<div style="text-align:center;color:#0f3f28;background:rgba(255,252,247,.82);padding:8px 14px;border-radius:999px"><b>Drop header image here</b> or click to upload</div></div>' +
      '<div class="panel" style="display:flex;gap:16px;align-items:center;margin-bottom:16px">' +
      '<button type="button" id="avatar-btn" style="width:84px;height:84px;border:0;border-radius:16px;cursor:pointer;font-size:1.8rem;color:#6b7a6e;background:#e6e2d8 center/cover no-repeat;' +
      (avatar ? "background-image:url(\'' + avatar + '\');color:transparent;" : '') + '">+</button>' +
      '<div><b style="font-size:1.2rem">' + (user.name || "Your ranch") + '</b><div class="sub">' + (user.email || "") + '</div></div></div>' +
      '<form id="dash-profile-form" class="panel"><div class="form-grid">' +
      '<div class="field"><label>Full name</label><input name="name" value="' + esc(user.name) + '"></div>' +
      '<div class="field"><label>Phone</label><input name="phone" value="' + esc(user.phone || p.phone) + '"></div>' +
      '<div class="field full"><label>Email</label><input name="email" type="email" value="' + esc(user.email) + '"></div>' +
      '<div class="field"><label>Ranch name</label><input name="ranchName" value="' + esc(p.name || user.name) + '"></div>' +
      '<div class="field"><label>Owner / operator</label><input name="owner" value="' + esc(p.owner || user.name) + '"></div>' +
      '<div class="field"><label>Location</label><input name="location" value="' + esc(p.location) + '" placeholder="City, State"></div>' +
      '<div class="field"><label>Associations</label><input name="associations" value="' + esc((p.associations || []).join(", ")) + '"></div>' +
      '<div class="field full"><label>About the ranch</label><textarea name="about" rows="4">' + (p.about || "") + '</textarea></div>' +
      '<div class="field full"><label>Operations</label><textarea name="operations" rows="4">' + (p.operations || "") + '</textarea></div></div>' +
      '<button class="btn btn-primary" style="margin-top:14px" type="submit">Save profile</button></form>' +
      '<input id="avatar-file" type="file" accept="image/*" style="display:none">' +
      '<input id="cover-file" type="file" accept="image/*" style="display:none"></div>';
  }
  function bindProfile() {
    var avatarData = null, coverData = null;
    function compress(file, max) {
      return new Promise(function (resolve) {
        if (!file || !String(file.type).startsWith("image/")) return resolve(null);
        var img = new Image(); var url = URL.createObjectURL(file);
        img.onload = function () {
          var w = img.width, h = img.height, scale = Math.min(max / w, max / h, 1);
          var c = document.createElement("canvas"); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
          resolve(c.toDataURL("image/jpeg", 0.78));
        };
        img.src = url;
      });
    }
    var av = document.getElementById("avatar-btn");
    var af = document.getElementById("avatar-file");
    var cz = document.getElementById("cover-drop");
    var cf = document.getElementById("cover-file");
    var form = document.getElementById("dash-profile-form");
    if (!form) return;
    if (av && af) {
      av.onclick = function () { af.click(); };
      af.onchange = function () {
        var f = af.files && af.files[0]; if (!f) return;
        compress(f, 600).then(function (d) { if (!d) return; avatarData = d; av.style.backgroundImage = "url(" + JSON.stringify(d) + ")"; av.style.color = "transparent"; });
      };
    }
    if (cz && cf) {
      cz.onclick = function () { cf.click(); };
      cf.onchange = function () {
        var f = cf.files && cf.files[0]; if (!f) return;
        compress(f, 1600).then(function (d) { if (!d) return; coverData = d; cz.style.background = "#ccc url(" + JSON.stringify(d) + ") center/cover no-repeat"; });
      };
      cz.addEventListener("dragover", function (e) { e.preventDefault(); });
      cz.addEventListener("drop", function (e) {
        e.preventDefault();
        var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return;
        compress(f, 1600).then(function (d) { if (!d) return; coverData = d; cz.style.background = "#ccc url(" + JSON.stringify(d) + ") center/cover no-repeat"; });
      });
    }
    form.onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(form).entries());
      if (avatarData) body.avatar = avatarData;
      if (coverData) body.cover = coverData;
      fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data.error || "Save failed"); return data; }); })
        .then(function () { toast("Profile saved."); })
        .catch(function (err) { toast(err.message); });
    };
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
      var inner = s === "home" ? home(me, listings) : s === "profile" ? profileHtml(me, listings) : s === "sold" ? placeholder("Sold", "Closed listings will show here.") : s === "orders" ? placeholder("Orders", "Buyer inquiries and deals will show here.") : placeholder("Messages", "Ranch messages will show here.");
      shell(inner, me);
      if (s === "profile") bindProfile();
    });
  }
  window.addEventListener("hashchange", function () { setTimeout(load, 20); });
  setTimeout(load, 80);
})();
