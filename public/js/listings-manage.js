(function () {
  var cache = [];
  var admin = false;
  var COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80";

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }
  function esc(v) { return String(v || "").split("<").join(" "); }
  function hash() { return location.hash || ""; }
  function editId() {
    var m = hash().match(/^#\/account\/edit\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function statusFilter() {
    var m = hash().match(/[?&]status=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "all";
  }
  function photo(l) {
    return l.image || (l.images && l.images[0]) || COW;
  }

  function ensureNav() {
    var aside = document.querySelector(".dash-shell aside");
    if (!aside) return;
    if (!document.getElementById("nav-listings")) {
      var a = document.createElement("a");
      a.id = "nav-listings";
      a.href = "#/account/listings";
      a.textContent = "Listings";
      a.style.cssText = "display:block;padding:10px 12px;border-radius:10px;margin:2px 8px;font-weight:560;color:#3a4a3e";
      var profile = aside.querySelector("a[href='#/account/profile']");
      if (profile && profile.parentNode) profile.parentNode.insertBefore(a, profile.nextSibling);
      else aside.appendChild(a);
    }
    if (admin && !document.getElementById("nav-visibility")) {
      var v = document.createElement("a");
      v.id = "nav-visibility";
      v.href = "#/account/visibility";
      v.textContent = "Show / Hide";
      v.style.cssText = "display:block;padding:10px 12px;border-radius:10px;margin:2px 8px;font-weight:560;color:#3a4a3e";
      var listNav = document.getElementById("nav-listings");
      if (listNav && listNav.parentNode) listNav.parentNode.insertBefore(v, listNav.nextSibling);
    }
  }

  function markNav() {
    ["nav-listings", "nav-visibility"].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      var on = (id === "nav-listings" && hash().indexOf("#/account/listings") === 0) ||
        (id === "nav-visibility" && hash().indexOf("#/account/visibility") === 0);
      a.style.background = on ? "#e6f2ea" : "transparent";
      a.style.color = on ? "#0f3f28" : "#3a4a3e";
    });
  }

  function setHidden(id, hide) {
    return fetch("/api/listings/" + id, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: hide })
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Update failed"); }); });
  }

  function bindDeletes(root) {
    (root || document).querySelectorAll("[data-del]").forEach(function (btn) {
      btn.onclick = function () {
        if (!confirm("Delete this listing?")) return;
        fetch("/api/listings/" + btn.getAttribute("data-del"), { method: "DELETE", credentials: "include" })
          .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Delete failed"); toast("Listing deleted."); setTimeout(load, 200); }); })
          .catch(function (e) { toast(e.message); });
      };
    });
  }

  function card(l) {
    var img = photo(l);
    var st = l.hidden ? "hidden" : (l.status || "active");
    return "<article class='listing-card'>" +
      "<img src='" + String(img).split("'").join("") + "' alt='cattle' style='width:100%;height:190px;object-fit:cover;display:block;background:#dce8d8'>" +
      "<div class='listing-body'><div class='price'>" + esc(l.title) + "</div>" +
      "<div class='meta'>" + esc(st) + " " + esc(l.breed) + " " + esc(String(l.head || "")) + "</div>" +
      "<div class='meta'>" + esc(l.location) + "</div>" +
      "<div style='margin-top:10px;display:flex;gap:8px;flex-wrap:wrap'>" +
      "<a class='btn btn-outline' href='#/listing/" + l.id + "'>Open</a>" +
      "<a class='btn btn-outline' href='#/account/edit/" + l.id + "'>Edit</a>" +
      "<button type='button' class='btn btn-outline' data-del='" + l.id + "'>Delete</button></div></div></article>";
  }

  function paintBoard(listings) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var st = statusFilter();
    var filtered = listings.filter(function (l) {
      if (st === "all") return true;
      if (st === "hidden") return !!l.hidden;
      if (st === "active") return !l.hidden && (l.status || "active") === "active";
      return String(l.status || "active") === st;
    });
    function chip(key, label) {
      var on = st === key;
      return "<a class='btn " + (on ? "btn-primary" : "btn-outline") + "' href='#/account/listings?status=" + key + "'>" + label + "</a>";
    }
    main.innerHTML =
      "<h2 class='page-title'>Listings</h2>" +
      "<p class='sub'>" + filtered.length + " of " + listings.length + "</p>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 18px'>" +
      chip("all", "All") + chip("active", "Active") + chip("sold", "Sold") + chip("hidden", "Hidden") +
      "</div><div id='listings-board' class='cards-3'>" +
      (filtered.length ? filtered.map(card).join("") : "<p class='sub'>No listings in this view.</p>") +
      "</div>";
    bindDeletes(main);
  }

  function paintVisibility(listings) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var hiddenCount = listings.filter(function (l) { return l.hidden; }).length;
    var rows = listings.map(function (l) {
      return "<div class='row' style='align-items:center;gap:12px'>" +
        "<img src='" + String(photo(l)).split("'").join("") + "' alt='' style='width:72px;height:52px;object-fit:cover;border-radius:8px'>" +
        "<span style='flex:1'>" + esc(l.title) + "<div class='sub'>" + (l.hidden ? "Hidden from public" : "Visible") + "</div></span>" +
        "<button type='button' class='btn btn-outline' data-vis='" + l.id + "' data-hide='" + (l.hidden ? "0" : "1") + "'>" +
        (l.hidden ? "Show" : "Hide") + "</button></div>";
    }).join("");
    main.innerHTML =
      "<h2 class='page-title'>Show / Hide listings</h2>" +
      "<p class='sub'>Admin only. Hidden listings do not appear on Browse or the homepage.</p>" +
      "<div style='display:flex;gap:8px;margin:16px 0'>" +
      "<button type='button' class='btn btn-outline' id='hide-all'>Hide all</button>" +
      "<button type='button' class='btn btn-primary' id='show-all'>Show all</button></div>" +
      "<div class='panel'>" + hiddenCount + " hidden now</div>" +
      "<div class='panel' style='margin-top:12px'>" + (rows || "<p class='sub'>No listings</p>") + "</div>";
    document.getElementById("hide-all").onclick = function () {
      fetch("/api/admin/visibility", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hide: true }) })
        .then(function (r) { return r.json(); }).then(function () { toast("All listings hidden."); setTimeout(load, 200); });
    };
    document.getElementById("show-all").onclick = function () {
      fetch("/api/admin/visibility", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hide: false }) })
        .then(function (r) { return r.json(); }).then(function () { toast("All listings visible."); setTimeout(load, 200); });
    };
    main.querySelectorAll("[data-vis]").forEach(function (btn) {
      btn.onclick = function () {
        setHidden(btn.getAttribute("data-vis"), btn.getAttribute("data-hide") === "1")
          .then(function () { setTimeout(load, 150); })
          .catch(function (e) { toast(e.message); });
      };
    });
  }

  function paintEdit(listing) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    main.innerHTML =
      "<h2 class='page-title'>Edit listing</h2>" +
      "<img src='" + String(photo(listing)).split("'").join("") + "' alt='cattle' style='width:100%;max-height:220px;object-fit:cover;border-radius:16px;margin:0 0 16px'>" +
      "<form id='listing-edit-form' class='panel'><div class='form-grid'>" +
      "<div class='field full'><label>Title</label><input name='title' value='" + esc(listing.title) + "' required></div>" +
      "<div class='field'><label>Breed</label><input name='breed' value='" + esc(listing.breed) + "'></div>" +
      "<div class='field'><label>Class</label><input name='klass' value='" + esc(listing.klass) + "'></div>" +
      "<div class='field'><label>Head</label><input name='head' type='number' min='1' value='" + esc(listing.head) + "'></div>" +
      "<div class='field'><label>Price per head</label><input name='price' type='number' min='0' value='" + (listing.price == null ? "" : listing.price) + "'></div>" +
      "<div class='field'><label>Location</label><input name='location' value='" + esc(listing.location) + "'></div>" +
      "<div class='field'><label>Status</label><select name='status'><option " + ((listing.status || "active") === "active" ? "selected" : "") + ">active</option><option " + (listing.status === "sold" ? "selected" : "") + ">sold</option></select></div>" +
      "<div class='field full'><label>Description</label><textarea name='description' rows='5'>" + (listing.description || "") + "</textarea></div>" +
      "</div><div style='margin-top:14px;display:flex;gap:8px'>" +
      "<button class='btn btn-primary' type='submit'>Save listing</button>" +
      "<a class='btn btn-outline' href='#/account/listings'>Back</a></div></form>";
    document.getElementById("listing-edit-form").onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(e.target).entries());
      fetch("/api/listings/" + listing.id, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Save failed"); toast("Listing saved."); location.hash = "#/account/listings"; }); })
        .catch(function (err) { toast(err.message); });
    };
  }

  function load() {
    if (hash().indexOf("#/account") !== 0) return;
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); })
    ]).then(function (pair) {
      admin = !!(pair[0] && pair[0].admin);
      cache = (pair[1] && pair[1].listings) || [];
      ensureNav();
      markNav();
      var id = editId();
      if (id) {
        var listing = cache.filter(function (l) { return l.id === id; })[0];
        if (listing) paintEdit(listing);
        return;
      }
      if (hash().indexOf("#/account/listings") === 0) return paintBoard(cache);
      if (hash().indexOf("#/account/visibility") === 0) {
        if (!admin) {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Admin only.</p>";
          return;
        }
        return paintVisibility(cache);
      }
    }).catch(function () {});
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 400);
  setTimeout(load, 1000);
})();
