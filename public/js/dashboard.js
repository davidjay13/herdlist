(function () {
  var avatarData = null;
  var coverData = null;
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
  function compress(file, max) {
    return new Promise(function (resolve) {
      if (!file || String(file.type).indexOf("image/") !== 0) return resolve(null);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width, h = img.height;
        var scale = Math.min(max / w, max / h, 1);
        var c = document.createElement("canvas");
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
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
      (p.slug ? "<p><a class='btn btn-outline' href='#/ranch/" + p.slug + "'>View public profile</a></p>" : "") +
      "<div id='cover-drop' style='border:2px dashed #1b6b45;border-radius:16px;min-height:160px;margin:0 0 16px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#e6f2ea'>" +
      "<div id='cover-label' style='background:#fffcf7;border-radius:999px;padding:8px 14px;font-weight:560'>Drop header image here or click to upload</div></div>" +
      "<div class='panel' style='display:flex;gap:16px;align-items:center;margin-bottom:16px'>" +
      "<button type='button' id='avatar-btn' style='width:88px;height:88px;border:0;border-radius:16px;cursor:pointer;font-size:1.8rem;color:#6b7a6e;background:#e6e2d8'>+</button>" +
      "<div><b>Profile photo</b><div class='sub'>Shown on your public profile</div></div></div>" +
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
      "<button class='btn btn-primary' style='margin-top:14px' type='submit'>Save profile</button></form>" +
      "<input id='avatar-file' type='file' accept='image/*' style='display:none'>" +
      "<input id='cover-file' type='file' accept='image/*' style='display:none'>";
  }
  function setBg(el, data) {
    if (!el || !data) return;
    el.style.backgroundImage = "url(" + JSON.stringify(data) + ")";
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.color = "transparent";
  }
  function bindProfile(me) {
    avatarData = null;
    coverData = null;
    var p = (me && me.producer) || {};
    var av = document.getElementById("avatar-btn");
    var af = document.getElementById("avatar-file");
    var cz = document.getElementById("cover-drop");
    var cf = document.getElementById("cover-file");
    var form = document.getElementById("dash-profile-form");
    if (p.avatar) setBg(av, p.avatar);
    if (p.cover) {
      setBg(cz, p.cover);
      var lab = document.getElementById("cover-label");
      if (lab) lab.textContent = "Change header image";
    }
    if (av && af) {
      av.onclick = function () { af.click(); };
      af.onchange = function () {
        var f = af.files && af.files[0];
        if (!f) return;
        compress(f, 600).then(function (d) {
          if (!d) return;
          avatarData = d;
          setBg(av, d);
        });
      };
    }
    if (cz && cf) {
      cz.onclick = function () { cf.click(); };
      cf.onchange = function () {
        var f = cf.files && cf.files[0];
        if (!f) return;
        compress(f, 1600).then(function (d) {
          if (!d) return;
          coverData = d;
          setBg(cz, d);
          var lab = document.getElementById("cover-label");
          if (lab) lab.textContent = "Change header image";
        });
      };
      cz.addEventListener("dragover", function (e) { e.preventDefault(); });
      cz.addEventListener("drop", function (e) {
        e.preventDefault();
        var f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f) return;
        compress(f, 1600).then(function (d) {
          if (!d) return;
          coverData = d;
          setBg(cz, d);
          var lab = document.getElementById("cover-label");
          if (lab) lab.textContent = "Change header image";
        });
      });
    }
    if (!form) return;
    form.onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(form).entries());
      if (avatarData) body.avatar = avatarData;
      if (coverData) body.cover = coverData;
      fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (res) { return res.json().then(function (data) { if (!res.ok) throw new Error(data.error || "Save failed"); toast("Profile saved."); }); })
        .catch(function (err) { toast(err.message); });
    };
  }
  function when(ts) {
    if (!ts) return "";
    var d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }
  function messagesHtml(pack) {
    var items = (pack && pack.messages) || [];
    var filter = "all";
    try {
      var m = (location.hash || "").match(/[?&]dir=([^&]+)/);
      if (m) filter = decodeURIComponent(m[1]);
    } catch (e) {}
    var shown = items.filter(function (msg) {
      if (filter === "sent") return msg.direction === "sent";
      if (filter === "received") return msg.direction === "received";
      return true;
    });
    function chip(key, label) {
      var on = filter === key;
      return "<a class='btn " + (on ? "btn-primary" : "btn-outline") + "' href='#/account/messages?dir=" + key + "'>" + label + "</a>";
    }
    var rows = shown.length ? shown.map(function (msg) {
      var other = msg.direction === "sent" ? (msg.toName || "Ranch") : (msg.fromName || "Buyer");
      var replyTo = msg.direction === "received" ? msg.fromUser : msg.toUser;
      return "<article class='panel' style='margin:0 0 12px;padding:14px 16px'>" +
        "<div style='display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap'>" +
        "<div><b>" + esc(other) + "</b> <span class='sub'>" + (msg.direction === "sent" ? "Sent" : "Received") + "</span></div>" +
        "<div class='sub'>" + esc(when(msg.at)) + "</div></div>" +
        "<div class='sub' style='margin:4px 0 8px'><a href='#/listing/" + esc(msg.listingId) + "'>" + esc(msg.listingTitle) + "</a></div>" +
        "<p style='margin:0;white-space:pre-wrap'>" + esc(msg.body) + "</p>" +
        "<form class='msg-reply' data-listing='" + esc(msg.listingId) + "' data-to='" + esc(replyTo || "") + "' style='margin-top:10px;display:flex;gap:8px;flex-wrap:wrap'>" +
        "<input name='body' placeholder='Reply...' style='flex:1;min-width:180px'>" +
        "<button class='btn btn-outline' type='submit'>Reply</button></form>" +
        "</article>";
    }).join("") : "<p class='sub'>No messages yet. When a buyer messages a ranch, it will show up here.</p>";
    return "<h2 class='page-title'>Messages</h2>" +
      "<p class='sub'>Sent and received notes about listings.</p>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 18px'>" +
      chip("all", "All") + chip("received", "Received") + chip("sent", "Sent") +
      "</div><div>" + rows + "</div>";
  }
  function bindMessages() {
    document.querySelectorAll("form.msg-reply").forEach(function (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        var input = form.querySelector("input[name=body]");
        var body = input ? String(input.value || "").trim() : "";
        if (!body) { toast("Write a reply first."); return; }
        var payload = { listingId: form.getAttribute("data-listing"), toUser: form.getAttribute("data-to"), body: body };
        fetch("/api/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Could not send"); return d; }); })
          .then(function () { toast("Reply sent."); load(); })
          .catch(function (err) { toast(err.message); });
      };
    });
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
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; }),
      fetch("/api/messages", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { messages: [] }; })
    ]).then(function (pair) {
      var me = pair[0] || {};
      if (!me.user) { location.hash = "#/signin"; return; }
      var listings = (pair[1] && pair[1].listings) || [];
      var inbox = pair[2] || { messages: [] };
      var s = section();
      var inner = s === "profile" ? profileHtml(me) : s === "home" ? home(me, listings) : s === "messages" ? messagesHtml(inbox) : "<div class='panel'><h2>" + s + "</h2><p class='sub'>Coming next.</p></div>";
      shellNow(inner, me.user.email || "");
      if (s === "profile") bindProfile(me);
      if (s === "messages") bindMessages();
    }).catch(function () { shellNow("<p>Could not load account.</p>", ""); });
  }
  window.addEventListener("hashchange", load);
  setTimeout(load, 0);
  setTimeout(load, 400);
})();
