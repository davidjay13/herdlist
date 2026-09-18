(function () {
  function esc(v) { return String(v || "").split("<").join(" "); }
  function hash() { return location.hash || ""; }

  function ensureLink() {
    var box = document.getElementById("admin-controls");
    if (!box) return;
    if (!document.getElementById("nav-producers")) {
      var a = document.createElement("a");
      a.id = "nav-producers";
      a.href = "#/account/producers";
      a.textContent = "Producers";
      a.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
      box.appendChild(a);
    }
    if (!document.getElementById("nav-accounts")) {
      var b = document.createElement("a");
      b.id = "nav-accounts";
      b.href = "#/account/accounts";
      b.textContent = "Accounts";
      b.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
      box.appendChild(b);
    }
  }

  function mark() {
    [["nav-producers", "#/account/producers"], ["nav-accounts", "#/account/accounts"]].forEach(function (pair) {
      var a = document.getElementById(pair[0]);
      if (!a) return;
      var on = hash().indexOf(pair[1]) === 0;
      a.style.background = on ? "#d7eadc" : "transparent";
      a.style.color = on ? "#0f3f28" : "#3a4a3e";
    });
  }

  function paintProducers(producers) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var rows = (producers || []).slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    main.innerHTML =
      "<h2 class='page-title'>Producers</h2>" +
      "<p class='sub'>" + rows.length + " ranch profiles</p>" +
      "<div class='panel' style='margin-top:16px'>" +
      (rows.length ? rows.map(function (p) {
        var img = p.avatar || "/logo.svg?v=24";
        var contact = [p.phone, p.email].filter(Boolean).join(" \u00b7 ");
        return "<div class='row' style='align-items:center;gap:12px'>" +
          (img ? "<img src='" + String(img).split("'").join("") + "' alt='' style='width:52px;height:52px;object-fit:cover;border-radius:10px'>" : "") +
          "<span style='flex:1'><b>" + esc(p.name) + "</b><div class='sub'>" +
          esc(p.location) + " \u00b7 sold " + (p.sold || 0) + "</div>" +
          (contact ? "<div class='sub'>" + esc(contact) + "</div>" : "") +
          "</span>" +
          "<a class='btn btn-outline' href='#/ranch/" + esc(p.slug) + "'>View public profile</a></div>";
      }).join("") : "<p class='sub'>No producers yet.</p>") +
      "</div>";
  }

  function paintAccounts(accounts) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var q = (document.getElementById("acct-filter") && document.getElementById("acct-filter").value) || "all";
    var rows = (accounts || []).slice().sort(function (a, b) {
      return String(a.email || "").localeCompare(String(b.email || ""));
    });
    if (q === "signed") rows = rows.filter(function (a) { return !a.imported; });
    if (q === "imported") rows = rows.filter(function (a) { return a.imported; });
    if (q === "admin") rows = rows.filter(function (a) { return a.admin; });
    main.innerHTML =
      "<h2 class='page-title'>Accounts</h2>" +
      "<p class='sub'>Every user account on the platform. " + rows.length + " shown of " + (accounts || []).length + ".</p>" +
      "<div class='panel' style='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0'>" +
      "<label style='font-weight:600'>Filter</label>" +
      "<select id='acct-filter'>" +
      "<option value='all'" + (q === "all" ? " selected" : "") + ">All accounts</option>" +
      "<option value='signed'" + (q === "signed" ? " selected" : "") + ">Signed up</option>" +
      "<option value='imported'" + (q === "imported" ? " selected" : "") + ">Imported</option>" +
      "<option value='admin'" + (q === "admin" ? " selected" : "") + ">Admins</option>" +
      "</select></div>" +
      "<div class='panel'>" +
      (rows.length ? rows.map(function (a) {
        var badge = a.admin ? "Admin" : (a.imported ? "Imported" : "Signed up");
        return "<div class='row' style='align-items:center;gap:12px'>" +
          "<img src='" + String(a.avatar || "/logo.svg?v=24").split("'").join("") + "' alt='' style='width:40px;height:40px;object-fit:contain;background:#fff;border-radius:8px;padding:3px'>" +
          "<span style='flex:1'><b>" + esc(a.name) + "</b>" +
          "<div class='sub'>" + esc(a.email) + (a.phone ? " \u00b7 " + esc(a.phone) : "") + " \u00b7 id " + a.id + "</div></span>" +
          "<span class='sub'>" + esc(a.producerName || "no ranch") + "<br>" + esc(a.location) + "</span>" +
          "<span class='sub'>" + a.listingCount + " listings</span>" +
          "<span class='sub'>" + badge + "</span>" +
          (a.slug ? "<a class='btn btn-outline' href='#/ranch/" + esc(a.slug) + "'>Profile</a>" : "") +
          "</div>";
      }).join("") : "<p class='sub'>No accounts in this view.</p>") +
      "</div>";
    var sel = document.getElementById("acct-filter");
    if (sel) sel.onchange = function () { paintAccounts(accounts); };
  }

  function load() {
    ensureLink();
    mark();
    if (hash().indexOf("#/account/producers") === 0) {
      fetch("/api/producers", { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (data) { paintProducers((data && data.producers) || []); })
        .catch(function () {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Could not load producers.</p>";
        });
      return;
    }
    if (hash().indexOf("#/account/accounts") === 0) {
      fetch("/api/admin/accounts", { credentials: "include" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Admin only"); return d; }); })
        .then(function (data) { paintAccounts((data && data.accounts) || []); })
        .catch(function (e) {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>" + esc(e.message || "Could not load accounts.") + "</p>";
        });
    }
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 500);
  setTimeout(load, 1200);
})();
