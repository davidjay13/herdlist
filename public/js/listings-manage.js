(function () {
  var cache = [];

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }

  function esc(v) {
    return String(v || "").split("<").join(" ");
  }

  function hash() {
    return location.hash || "";
  }

  function editId() {
    var m = hash().match(/^#\/account\/edit\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function statusFilter() {
    var m = hash().match(/[?&]status=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "all";
  }

  function ensureNav() {
    var aside = document.querySelector(".dash-shell aside");
    if (!aside || document.getElementById("nav-listings")) return;
    var a = document.createElement("a");
    a.id = "nav-listings";
    a.href = "#/account/listings";
    a.textContent = "Listings";
    a.style.cssText = "display:block;padding:10px 12px;border-radius:10px;margin:2px 8px;font-weight:560;color:#3a4a3e";
    var profile = aside.querySelector("a[href='#/account/profile']");
    if (profile && profile.parentNode) profile.parentNode.insertBefore(a, profile.nextSibling);
    else aside.insertBefore(a, aside.children[2] || null);
  }

  function markNav() {
    var a = document.getElementById("nav-listings");
    if (!a) return;
    var on = hash().indexOf("#/account/listings") === 0;
    a.style.background = on ? "#e6f2ea" : "transparent";
    a.style.color = on ? "#0f3f28" : "#3a4a3e";
  }

  function bindDeletes(root) {
    (root || document).querySelectorAll("[data-del]").forEach(function (btn) {
      btn.onclick = function () {
        if (!confirm("Delete this listing?")) return;
        fetch("/api/listings/" + btn.getAttribute("data-del"), { method: "DELETE", credentials: "include" })
          .then(function (r) {
            return r.json().then(function (d) {
              if (!r.ok) throw new Error(d.error || "Delete failed");
              toast("Listing deleted.");
              setTimeout(load, 200);
            });
          })
          .catch(function (e) { toast(e.message); });
      };
    });
  }

  function paintRows(listings) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var panel = main.querySelector(".panel");
    if (!panel || main.querySelector("#listing-edit-form") || main.querySelector("#listings-board")) return;
    var live = listings || [];
    var rows = live.length
      ? live.map(function (l) {
          return "<div class='row' style='align-items:center;gap:8px'><span style='flex:1'>" +
            esc(l.title) +
            "</span><a href='#/listing/" + l.id + "'>Open</a> " +
            "<a href='#/account/edit/" + l.id + "'>Edit</a> " +
            "<button type='button' class='btn btn-outline' data-del='" + l.id + "' style='padding:4px 10px'>Delete</button></div>";
        }).join("")
      : "<p class='sub'>No live listings</p>";
    panel.innerHTML = "<h3>Live listings</h3>" + rows;
    bindDeletes(panel);
  }

  function card(l) {
    var img = l.image || (l.images && l.images[0]) || "";
    var st = l.status || "active";
    return "<article class='listing-card'>" +
      "<div class='thumb' style='background-image:url(' + JSON.stringify(img) + ');background-size:cover;background-position:center'>" +
      "<span class='badge'>" + esc(st) + "</span></div>" +
      "<div class='listing-body'><div class='price'>" + esc(l.title) + "</div>" +
      "<div class='meta'>" + esc(l.breed) + " " + esc(l.klass) + " " + esc(String(l.head || "")) + "</div>" +
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
      chip("all", "All") + chip("active", "Active") + chip("sold", "Sold") +
      "</div>" +
      "<div id='listings-board' class='cards-3'>" +
      (filtered.length ? filtered.map(card).join("") : "<p class='sub'>No listings in this view.</p>") +
      "</div>";
    bindDeletes(main);
  }

  function paintEdit(listing) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    main.innerHTML =
      "<h2 class='page-title'>Edit listing</h2>" +
      "<form id='listing-edit-form' class='panel'><div class='form-grid'>" +
      "<div class='field full'><label>Title</label><input name='title' value='" + esc(listing.title) + "' required></div>" +
      "<div class='field'><label>Breed</label><input name='breed' value='" + esc(listing.breed) + "'></div>" +
      "<div class='field'><label>Class</label><input name='klass' value='" + esc(listing.klass) + "'></div>" +
      "<div class='field'><label>Head</label><input name='head' type='number' min='1' value='" + esc(listing.head) + "'></div>" +
      "<div class='field'><label>Price per head (blank = contact)</label><input name='price' type='number' min='0' value='" + (listing.price == null ? "" : listing.price) + "'></div>" +
      "<div class='field'><label>City, State</label><input name='location' value='" + esc(listing.location) + "'></div>" +
      "<div class='field'><label>Category</label><input name='category' value='" + esc(listing.category) + "'></div>" +
      "<div class='field'><label>Status</label><select name='status'><option " + ((listing.status || "active") === "active" ? "selected" : "") + ">active</option><option " + (listing.status === "sold" ? "selected" : "") + ">sold</option></select></div>" +
      "<div class='field full'><label>Description</label><textarea name='description' rows='5'>" + (listing.description || "") + "</textarea></div>" +
      "</div><div style='margin-top:14px;display:flex;gap:8px'>" +
      "<button class='btn btn-primary' type='submit'>Save listing</button>" +
      "<button class='btn btn-outline' type='button' id='listing-del'>Delete listing</button>" +
      "<a class='btn btn-outline' href='#/account/listings'>Back to listings</a></div></form>";
    var form = document.getElementById("listing-edit-form");
    form.onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(form).entries());
      fetch("/api/listings/" + listing.id, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Save failed"); toast("Listing saved."); location.hash = "#/account/listings"; }); })
        .catch(function (err) { toast(err.message); });
    };
    document.getElementById("listing-del").onclick = function () {
      if (!confirm("Delete this listing?")) return;
      fetch("/api/listings/" + listing.id, { method: "DELETE", credentials: "include" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Delete failed"); toast("Listing deleted."); location.hash = "#/account/listings"; }); })
        .catch(function (err) { toast(err.message); });
    };
  }

  function load() {
    if (hash().indexOf("#/account") !== 0) return;
    ensureNav();
    markNav();
    var id = editId();
    fetch("/api/my/listings", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cache = (data && data.listings) || [];
        ensureNav();
        markNav();
        if (id) {
          var listing = cache.filter(function (l) { return l.id === id; })[0];
          if (!listing) {
            var main = document.getElementById("dash-main");
            if (main) main.innerHTML = "<p>Listing not found.</p>";
            return;
          }
          paintEdit(listing);
          return;
        }
        if (hash().indexOf("#/account/listings") === 0) {
          paintBoard(cache);
          return;
        }
        if (hash() === "#/account" || hash() === "#/account/") paintRows(cache);
      })
      .catch(function () {});
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 400);
  setTimeout(load, 900);
})();
