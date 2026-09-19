(function () {
  var avatarData = null;
  var coverData = null;
  var lastMe = null;
  var dashPack = null;
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
    if (hash.indexOf("#/account/news") === 0) return "admin";
    if (hash.indexOf("#/account/producers") === 0) return "admin";
    if (hash.indexOf("#/account/accounts") === 0) return "admin";
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
      ((lastMe && lastMe.admin) ? "<div id='admin-controls'></div>" : "") +
      "<div style='margin-top:auto;padding:12px'><a class='btn btn-primary btn-wide' href='#/list'>+ Create listing</a>" +
      "<a class='btn btn-outline btn-wide' href='#/pricing' style='margin-top:8px'>Upgrade</a></div></aside>" +
      "<section id='dash-main' style='padding:" + (section() === "messages" ? "0" : "28px") + ";min-height:calc(100vh - 64px)'>" + (inner || "<p class='sub'>Loading...</p>") + "</section></div>";
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
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function initials(name) {
    var parts = String(name || "HY").trim().split(/\s+/);
    var a = (parts[0] || "H").charAt(0);
    var b = (parts[1] || parts[0] || "Y").charAt(0);
    return (a + b).toUpperCase();
  }
  function photoSrc(src) {
    if (!src) return "";
    var s = String(src);
    if (s.indexOf("unsplash.com") >= 0) return "";
    return s;
  }
  function avatarHtml(src, name, size) {
    size = size || 40;
    var url = photoSrc(src);
    if (url) {
      return "<img src='" + String(url).split("'").join("") + "' alt='' style='width:" + size + "px;height:" + size + "px;border-radius:50%;object-fit:cover;background:#e6f2ea;flex:none'>";
    }
    return "<div style='width:" + size + "px;height:" + size + "px;border-radius:50%;background:#1b6b45;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;font-size:" + Math.max(11, size / 2.4) + "px'>" + esc(initials(name)) + "</div>";
  }
  function threadKey(msg) {
    var other = msg.direction === "sent" ? (msg.toUser || msg.toProducer || "ranch") : (msg.fromUser || "buyer");
    return String(msg.listingId || "x") + "::" + String(other);
  }
  function otherOf(msg) {
    if (msg.direction === "sent") return { id: msg.toUser || msg.toProducer, name: msg.toName || "Ranch", avatar: msg.toAvatar };
    return { id: msg.fromUser, name: msg.fromName || "Buyer", avatar: msg.fromAvatar };
  }
  function groupThreads(items) {
    var map = {};
    (items || []).forEach(function (msg) {
      var key = threadKey(msg);
      var other = otherOf(msg);
      if (!map[key]) {
        map[key] = {
          key: key,
          listingId: msg.listingId,
          listingTitle: msg.listingTitle || "Listing",
          otherId: other.id,
          otherName: other.name,
          otherAvatar: other.avatar,
          messages: []
        };
      }
      map[key].messages.push(msg);
      if (!map[key].otherAvatar && other.avatar) map[key].otherAvatar = other.avatar;
    });
    return Object.keys(map).map(function (k) {
      var th = map[k];
      th.messages.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
      th.last = th.messages[th.messages.length - 1];
      return th;
    }).sort(function (a, b) { return ((b.last && b.last.at) || 0) - ((a.last && a.last.at) || 0); });
  }
  function messagesHtml(pack) {
    var items = (pack && pack.messages) || [];
    var threads = groupThreads(items);
    var active = "";
    try {
      var m = (location.hash || "").match(/[?&]t=([^&]+)/);
      if (m) active = decodeURIComponent(m[1]);
    } catch (e) {}
    if (!active && threads[0]) active = threads[0].key;
    var current = null;
    threads.forEach(function (th) { if (th.key === active) current = th; });
    var list = threads.length ? threads.map(function (th) {
      var on = th.key === active;
      var preview = th.last ? th.last.body : "";
      if (preview.length > 52) preview = preview.slice(0, 50) + "...";
      return "<button type='button' class='chat-row' data-thread='" + esc(th.key) + "' style='" +
        "display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:0;cursor:pointer;" +
        "padding:10px 12px;background:" + (on ? "#e7f0ea" : "transparent") + "'>" +
        avatarHtml(th.otherAvatar, th.otherName, 40) +
        "<div style='min-width:0;flex:1'><div style='display:flex;justify-content:space-between;gap:8px'><b style='font-size:.95rem;color:#0f3f28'>" + esc(th.otherName) + "</b>" +
        "<span class='sub' style='font-size:.75rem;white-space:nowrap'>" + esc(when(th.last && th.last.at)) + "</span></div>" +
        "<div class='sub' style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>" + esc(preview) + "</div></div></button>";
    }).join("") : "<p class='sub' style='padding:16px'>No chats yet.</p>";
    var bubbles = "";
    if (current) {
      var lastDay = "";
      bubbles = current.messages.map(function (msg) {
        var sent = msg.direction === "sent";
        var day = "";
        try { day = new Date(Number(msg.at)).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); } catch (e) {}
        var stamp = "";
        if (day && day !== lastDay) {
          lastDay = day;
          stamp = "<div style='text-align:center;color:#8a968d;font-size:.75rem;margin:14px 0 8px'>" + esc(day) + "</div>";
        }
        return stamp +
          "<div style='display:flex;justify-content:" + (sent ? "flex-end" : "flex-start") + ";margin:4px 0'>" +
          "<div style='max-width:72%;padding:8px 12px;border-radius:18px;white-space:pre-wrap;line-height:1.35;" +
          (sent ? "background:#1b6b45;color:#fff;border-bottom-right-radius:4px" : "background:#e4e6eb;color:#050505;border-bottom-left-radius:4px") +
          "'>" + esc(msg.body) +
          "<div style='font-size:.68rem;opacity:.75;margin-top:4px'>" + esc(when(msg.at)) + "</div></div></div>";
      }).join("");
    } else {
      bubbles = "<div style='margin:auto;color:#6b7a6e;text-align:center'>Select a conversation</div>";
    }
    var header = current
      ? "<div style='display:flex;align-items:center;gap:10px'>" + avatarHtml(current.otherAvatar, current.otherName, 36) +
        "<div><b>" + esc(current.otherName) + "</b><div class='sub'><a href='#/listing/" + esc(current.listingId) + "'>" + esc(current.listingTitle) + "</a></div></div></div>"
      : "<b>Messages</b>";
    var composer = current
      ? "<form id='chat-compose' data-listing='" + esc(current.listingId) + "' data-to='" + esc(current.otherId || "") + "' style='display:flex;gap:8px;align-items:center'>" +
        "<input id='chat-input' name='body' placeholder='Aa' autocomplete='off' style='flex:1;border:1px solid #d8e0d6;background:#f0f2f5;border-radius:20px;padding:10px 14px;font:inherit'>" +
        "<button class='btn btn-primary' type='submit' style='border-radius:20px'>Send</button></form>"
      : "";
    return "<div style='display:grid;grid-template-columns:280px 1fr;height:calc(100vh - 64px);background:#fff;border-left:1px solid #e6eee8'>" +
      "<aside style='border-right:1px solid #e6eee8;display:flex;flex-direction:column;background:#fffcf7'>" +
      "<div style='padding:16px 16px 10px'><b style='font-size:1.2rem'>Chats</b></div>" +
      "<div style='overflow:auto;flex:1'>" + list + "</div></aside>" +
      "<section style='display:flex;flex-direction:column;min-width:0'>" +
      "<header style='padding:12px 16px;border-bottom:1px solid #e6eee8'>" + header + "</header>" +
      "<div id='chat-thread' style='flex:1;overflow:auto;padding:16px 18px;background:#fff;display:flex;flex-direction:column'>" + bubbles + "</div>" +
      "<div style='padding:10px 14px;border-top:1px solid #e6eee8;background:#fffcf7'>" + composer + "</div>" +
      "</section></div>";
  }
  function bindMessages() {
    document.querySelectorAll(".chat-row").forEach(function (btn) {
      btn.onclick = function () {
        location.hash = "#/account/messages?t=" + encodeURIComponent(btn.getAttribute("data-thread") || "");
      };
    });
    var thread = document.getElementById("chat-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
    var form = document.getElementById("chat-compose");
    if (!form) return;
    var input = document.getElementById("chat-input");
    if (input) input.focus();
    form.onsubmit = function (e) {
      e.preventDefault();
      var body = input ? String(input.value || "").trim() : "";
      if (!body) return;
      var payload = { listingId: form.getAttribute("data-listing"), toUser: form.getAttribute("data-to"), body: body };
      input.value = "";
      fetch("/api/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Could not send"); return d; }); })
        .then(function () { load(); })
        .catch(function (err) { toast(err.message); });
    };
  }
  function money(l) {
    if (l && l.price != null && l.price !== "") return "$" + Number(l.price).toLocaleString();
    return "Contact";
  }
  function miniRow(l) {
    var img = l.image || "/logo.svg?v=58";
    return "<a class='dash-mini' href='#/listing/" + esc(l.id) + "'>" +
      "<img src='" + String(img).split("'").join("") + "' alt=''>" +
      "<div class='grow'><b>" + esc(l.title) + "</b><div class='sub'>" + esc(l.location || l.breed || "") +
      (l.views != null ? " · " + l.views + " views" : "") + "</div></div>" +
      "<div class='sub'>" + esc(money(l)) + "</div></a>";
  }
  function newsRibbon(items) {
    var list = items || [];
    if (!list.length) {
      return "<div class='news-ribbon'><div class='news-kicker'>Industry news</div>" +
        "<div class='news-item'>Headlines will appear here after an admin pastes article links.</div></div>";
    }
    var doubled = list.concat(list);
    var rows = doubled.map(function (n) {
      return "<a class='news-item' href='" + String(n.url || "#").split("'").join("") + "' target='_blank' rel='noopener'>" +
        "<span class='src'>" + esc(n.source || "News") + "</span>" +
        "<span style='overflow:hidden;text-overflow:ellipsis'>" + esc(n.title) + "</span></a>";
    }).join("");
    return "<div class='news-ribbon'><div class='news-kicker'>Industry news</div><div class='news-window'><div class='news-track'>" + rows + "</div></div></div>";
  }
  function home(me, listings, pack) {
    var name = ((me.user && me.user.name) || "Producer").split(" ")[0];
    pack = pack || {};
    var msgs = pack.messages || [];
    var msgRows = msgs.length ? msgs.slice(0, 5).map(function (m) {
      var sent = m.fromUser === ((me.user && me.user.id) || -1);
      var who = sent ? (m.toName || "Ranch") : (m.fromName || "Buyer");
      var body = String(m.body || "");
      if (body.length > 70) body = body.slice(0, 68) + "…";
      return "<a class='dash-mini' href='#/account/messages'>" +
        "<div style='width:46px;height:46px;border-radius:10px;background:#1b6b45;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none'>" +
        esc((who || "HY").slice(0, 2).toUpperCase()) + "</div>" +
        "<div class='grow'><b>" + esc(who) + "</b><div class='sub'>" + esc(body) + "</div></div></a>";
    }).join("") : "<div class='dash-empty'>No messages yet. Buyers can write you from a listing.</div>";
    var local = pack.local || [];
    var latest = pack.latest || [];
    var views = pack.views || [];
    var viewRows = views.length ? views.slice(0, 5).map(function (l) {
      return "<a class='dash-mini' href='#/listing/" + esc(l.id) + "'>" +
        "<div class='grow'><b>" + esc(l.title) + "</b><div class='sub'>" + esc(l.location || "") + "</div></div>" +
        "<b>" + Number(l.views || 0).toLocaleString() + "</b></a>";
    }).join("") : "<div class='dash-empty'>Views show up as people open your listings.</div>";
    return "<h2 class='page-title'>Welcome, " + esc(name) + "</h2>" +
      "<p class='sub'>Your ranch desk — news, messages, and cattle nearby.</p>" +
      newsRibbon(pack.news) +
      "<div class='dash-kpis'>" +
      "<div class='dash-kpi'><b>" + Number(pack.myListings || (listings || []).length) + "</b><span>Your listings</span></div>" +
      "<div class='dash-kpi'><b>" + Number(pack.totalViews || 0).toLocaleString() + "</b><span>Listing views</span></div>" +
      "<div class='dash-kpi'><b>" + Number(pack.messageCount || msgs.length) + "</b><span>Messages</span></div>" +
      "<div class='dash-kpi'><b>" + Number(pack.followers || 0) + "</b><span>Followers</span></div></div>" +
      "<div class='dash-tiles'>" +
      "<section class='dash-tile'><h3>Messages <a href='#/account/messages'>Open inbox</a></h3>" + msgRows + "</section>" +
      "<section class='dash-tile'><h3>Listing views</h3>" + viewRows + "</section>" +
      "<section class='dash-tile'><h3>Local listings <a href='#/browse'>Browse</a></h3>" +
      (local.length ? local.slice(0, 5).map(miniRow).join("") : "<div class='dash-empty'>No nearby listings yet. Add a location on your profile to match cattle in your area.</div>") +
      "</section>" +
      "<section class='dash-tile'><h3>Latest listings <a href='#/browse'>See all</a></h3>" +
      (latest.length ? latest.slice(0, 5).map(miniRow).join("") : "<div class='dash-empty'>New cattle will show up here as they list.</div>") +
      "</section></div>";
  }
  function load() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account") !== 0) return;
    shellNow("<p class='sub'>Loading dashboard...</p>", "");
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; }),
      fetch("/api/messages", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { messages: [] }; }),
      fetch("/api/dashboard", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return {}; })
    ]).then(function (pair) {
      var me = pair[0] || {};
      lastMe = me;
      if (!me.user) { location.hash = "#/signin"; return; }
      var listings = (pair[1] && pair[1].listings) || [];
      var inbox = pair[2] || { messages: [] };
      dashPack = pair[3] || {};
      var s = section();
      var inner = s === "profile" ? profileHtml(me) : s === "home" ? home(me, listings, dashPack) : s === "messages" ? messagesHtml(inbox) : s === "admin" ? "<p class='sub'>Loading admin…</p>" : "<div class='panel'><h2>" + s + "</h2><p class='sub'>Coming next.</p></div>";
      shellNow(inner, me.user.email || "");
      if (s === "profile") bindProfile(me);
      if (s === "messages") bindMessages();
    }).catch(function () { shellNow("<p>Could not load account.</p>", ""); });
  }
  window.addEventListener("hashchange", load);
  setTimeout(load, 0);
  setTimeout(load, 400);
})();
