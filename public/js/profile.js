(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }
  function compressImage(file, max) {
    max = max || 900;
    return new Promise(function (resolve, reject) {
      if (!file || !String(file.type).startsWith("image/")) return resolve(null);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > max || h > max) {
          var scale = Math.min(max / w, max / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read photo")); };
      img.src = url;
    });
  }
  function field(label, name, value, extra) {
    extra = extra || "";
    return '<div class="field"><label>' + label + '</label><input name="' + name + '" value="' + String(value || "").replace(/"/g, """) + '" ' + extra + '></div>';
  }
  function render(pack) {
    var app = document.getElementById("dash-main") || document.getElementById("app");
    if (!app) return;
    var user = pack.user || {};
    var p = pack.producer || {};
    var listings = pack.listings || [];
    var avatar = p.avatar || "";
    var cover = p.cover || "";
    app.innerHTML =
      '<div class="form-page" style="max-width:980px;padding:0">' +
      '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px">' +
      '<div><p class="sub">Dashboard → Profile</p><h2 class="page-title" style="margin-top:4px">Profile</h2></div>' +
      (p.slug ? '<a class="btn btn-outline" href="#/ranch/' + p.slug + '">View public ranch page</a>' : '') +
      '</div>' +
      '<div id="cover-drop" style="border:2px dashed #1b6b45;background:' + (cover ? "url('" + cover + '") center/cover no-repeat" : "#e6f2ea") + ';border-radius:16px;min-height:160px;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;margin-bottom:16px;position:relative">' +
      '<div id="cover-hint" style="' + (cover ? "display:none;" : "") + 'color:#0f3f28"><strong style="display:block;font-size:1.05rem">Drop header image here</strong><span style="font-size:.88rem">or click to upload a cover photo</span></div>' +
      '<div id="cover-change" style="' + (cover ? "" : "display:none;") + 'position:absolute;bottom:10px;right:10px;background:rgba(255,252,247,.92);border-radius:999px;padding:6px 12px;font-size:.82rem;font-weight:600">Change header</div>' +
      '</div>' +
      '<div class="panel" style="display:flex;gap:18px;align-items:center;margin-bottom:18px">' +
      '<button type="button" id="avatar-btn" style="width:92px;height:92px;border:0;border-radius:16px;background:#e6e2d8 center/cover no-repeat;cursor:pointer;font-size:2rem;color:#6b7a6e;' +
      (avatar ? "background-image:url('" + avatar + "');color:transparent;" : '') +
      '">+</button>' +
      '<div><b style="font-size:1.25rem">' + (user.name || "Your ranch") + '</b><div class="sub">' + (user.email || "") + '</div></div></div>' +
      '<form id="profile-form"><div class="form-grid">' +
      field("Full name", "name", user.name) +
      field("Phone number", "phone", user.phone || p.phone || "") +
      '<div class="field full">' + field("Email", "email", user.email, 'type="email"').replace('class="field"', 'class="field" style="margin:0"') + '</div>' +
      field("Ranch name", "ranchName", p.name || user.name) +
      field("Owner / operator", "owner", p.owner || user.name) +
      field("Ranch location", "location", p.location, 'placeholder="City, State"') +
      field("Associations", "associations", (p.associations || []).join(", "), 'placeholder="ACA, NCBA"') +
      '<div class="field full"><label>About the ranch</label><textarea name="about" rows="4">' + (p.about || "") + '</textarea></div>' +
      '<div class="field full"><label>Operations</label><textarea name="operations" rows="4">' + (p.operations || "") + '</textarea></div>' +
      '</div>' +
      '<div style="margin-top:22px"><h3 style="margin:0 0 4px">Email preferences</h3>' +
      '<p class="sub">Opt in to what Herd Yard can send you.</p>' +
      '<label style="display:flex;gap:12px;padding:12px 0;border-top:1px solid #e6eee8"><input type="checkbox" name="emailWeeklyStats"' + (user.emailWeeklyStats ? " checked" : "") + '><span><b>Weekly Account Stats</b><div class="sub">Monday recap of views, messages, listings, and followers.</div></span></label>' +
      '<label style="display:flex;gap:12px;padding:12px 0;border-top:1px solid #e6eee8"><input type="checkbox" name="emailUpdates"' + (user.emailUpdates ? " checked" : "") + '><span><b>Herd Yard Updates</b><div class="sub">Product news when we ship something useful.</div></span></label>' +
      '<label style="display:flex;gap:12px;padding:12px 0;border-top:1px solid #e6eee8"><input type="checkbox" name="emailPartners"' + (user.emailPartners ? " checked" : "") + '><span><b>Partner Opportunities</b><div class="sub">Occasional offers from livestock partners.</div></span></label>' +
      '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" type="submit">Save profile</button>' +
      '<a class="btn btn-outline" href="#/list">Create listing</a>' +
      '<button class="btn btn-ghost" type="button" id="out-btn">Sign out</button></div></form>' +
      '<div class="panel" style="margin-top:22px"><h3 style="margin:0 0 12px">Account</h3>' +
      '<div class="row"><span>Listings</span><b>' + listings.length + '</b></div>' +
      '<div class="row"><span>Subscription</span><b>No subscription \u00b7 current</b></div>' +
      '<div class="row"><span>Plan available</span><b>Producer</b></div></div>' +
      '<form id="pw-form" class="panel" style="margin-top:16px"><h3 style="margin:0 0 12px">Update password</h3>' +
      '<div class="form-grid"><div class="field"><label>Current password</label><input name="current" type="password" required></div>' +
      '<div class="field"><label>New password</label><input name="next" type="password" required minlength="4"></div></div>' +
      '<button class="btn btn-outline" style="margin-top:12px" type="submit">Update password</button></form>' +
      '<input id="avatar-file" type="file" accept="image/*" style="display:none">' +
      '<input id="cover-file" type="file" accept="image/*" style="display:none"></div>';
    var avatarData = null;
    var coverData = null;
    document.getElementById("avatar-btn").onclick = function () { document.getElementById("avatar-file").click(); };
    document.getElementById("avatar-file").onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      compressImage(f, 600).then(function (data) {
        if (!data) return;
        avatarData = data;
        var btn = document.getElementById("avatar-btn");
        btn.style.backgroundImage = "url('" + data + "')";
        btn.style.color = "transparent";
      });
    };
    function setCover(data) {
      coverData = data;
      var zone = document.getElementById("cover-drop");
      zone.style.background = "url('" + data + "') center/cover no-repeat";
      document.getElementById("cover-hint").style.display = "none";
      document.getElementById("cover-change").style.display = "block";
    }
    var coverZone = document.getElementById("cover-drop");
    coverZone.onclick = function () { document.getElementById("cover-file").click(); };
    document.getElementById("cover-file").onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      compressImage(f, 1600).then(function (data) { if (data) setCover(data); });
    };
    ["dragenter", "dragover"].forEach(function (evt) {
      coverZone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); coverZone.style.borderColor = "#0f3f28"; });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      coverZone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); coverZone.style.borderColor = "#1b6b45"; });
    });
    coverZone.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      compressImage(f, 1600).then(function (data) { if (data) setCover(data); });
    });
    document.getElementById("profile-form").onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(e.target).entries());
      body.emailWeeklyStats = !!(e.target.querySelector("[name=emailWeeklyStats]") && e.target.querySelector("[name=emailWeeklyStats]").checked);
      body.emailUpdates = !!(e.target.querySelector("[name=emailUpdates]") && e.target.querySelector("[name=emailUpdates]").checked);
      body.emailPartners = !!(e.target.querySelector("[name=emailPartners]") && e.target.querySelector("[name=emailPartners]").checked);
      if (avatarData) body.avatar = avatarData;
      if (coverData) body.cover = coverData;
      fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data.error || "Save failed"); return data; }); })
        .then(function () { toast("Profile saved."); })
        .catch(function (err) { toast(err.message); });
    };
    document.getElementById("pw-form").onsubmit = function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      fetch("/api/password", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: fd.get("current"), next: fd.get("next") }) })
        .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data.error || "Could not update password"); return data; }); })
        .then(function () { toast("Password updated."); e.target.reset(); })
        .catch(function (err) { toast(err.message); });
    };
    document.getElementById("out-btn").onclick = function () {
      fetch("/api/signout", { method: "POST", credentials: "include", body: "{}", headers: { "Content-Type": "application/json" } }).then(function () { location.hash = "#/"; location.reload(); });
    };
  }
  function load() {
    if ((location.hash || "") !== "#/account/profile") return;
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; })
    ]).then(function (pair) {
      var me = pair[0];
      if (!me.user) { location.hash = "#/signin"; return; }
      render({ user: me.user, producer: me.producer, listings: (pair[1] && pair[1].listings) || [] });
    });
  }
  window.addEventListener("hashchange", function () { setTimeout(load, 40); });
  window.addEventListener("herd-profile-ready", function () { setTimeout(load, 10); });
  setTimeout(load, 250);
})();
