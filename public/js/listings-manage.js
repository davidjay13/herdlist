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
  function param(name, fallback) {
    var m = hash().match(new RegExp("[?&]" + name + "=([^&]+)"));
    return m ? decodeURIComponent(m[1]) : fallback;
  }
  function editId() {
    var m = hash().match(/^#\/account\/edit\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function photo(l) {
    return l.image || (l.images && l.images[0]) || COW;
  }
  function isGlobal() {
    return hash().indexOf("#/account/global") === 0 || hash().indexOf("#/account/visibility") === 0;
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
    var old = document.getElementById("nav-visibility");
    if (old && old.parentNode && old.parentNode.id !== "admin-controls") old.parentNode.removeChild(old);
    if (!admin) {
      var wrap = document.getElementById("admin-controls");
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      return;
    }
    if (document.getElementById("admin-controls")) return;
    var box = document.createElement("div");
    box.id = "admin-controls";
    box.style.cssText = "margin:8px 8px 4px;padding:8px 8px 6px;border-radius:12px;background:#eef4ef";
    box.innerHTML =
      "<div style='font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5c6f62;padding:4px 6px 6px'>Admin Controls</div>" +
      "<a id='nav-global' href='#/account/global' style='display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e'>Global Listings</a>";
    var browse = aside.querySelector("a[href='#/browse']");
    if (browse && browse.parentNode) browse.parentNode.insertBefore(box, browse.nextSibling);
    else aside.appendChild(box);
  }

  function markNav() {
    var listings = document.getElementById("nav-listings");
    if (listings) {
      var onL = hash().indexOf("#/account/listings") === 0;
      listings.style.background = onL ? "#e6f2ea" : "transparent";
      listings.style.color = onL ? "#0f3f28" : "#3a4a3e";
    }
    var g = document.getElementById("nav-global");
    if (g) {
      g.style.background = isGlobal() ? "#d7eadc" : "transparent";
      g.style.color = isGlobal() ? "#0f3f28" : "#3a4a3e";
    }
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
    var st = param("status", "all");
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

  function sortList(list, sort) {
    var copy = list.slice();
    copy.sort(function (a, b) {
      if (sort === "price-high") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sort === "price-low") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
      if (sort === "status") return String(a.status || "").localeCompare(String(b.status || ""));
      if (sort === "date-old") return String(a.listedAt || "").localeCompare(String(b.listedAt || ""));
      return String(b.listedAt || "").localeCompare(String(a.listedAt || ""));
    });
    return copy;
  }

  function paintGlobal(listings) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var sort = param("sort", "date-new");
    var rows = sortList(listings, sort);
    function opt(key, label) {
      return "<option value='" + key + "'" + (sort === key ? " selected" : "") + ">" + label + "</option>";
    }
    main.innerHTML =
      "<h2 class='page-title'>Global Listings</h2>" +
      "<p class='sub'>Every listing on the site. Sort and open any record.</p>" +
      "<div class='panel' style='display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0'>" +
      "<label style='font-weight:600'>Sort</label>" +
      "<select id='global-sort'>" +
      opt("date-new", "Date posted (newest)") +
      opt("date-old", "Date posted (oldest)") +
      opt("price-high", "Price (high to low)") +
      opt("price-low", "Price (low to high)") +
      opt("title", "Title A-Z") +
      opt("status", "Status") +
      "</select></div>" +
      "<div class='panel'>" +
      (rows.length ? rows.map(function (l) {
        var price = l.price == null ? "Contact" : ("$" + Number(l.price).toLocaleString());
        return "<div class='row' style='align-items:center;gap:12px'>" +
          "<img src='" + String(photo(l)).split("'").join("") + "' alt='' style='width:72px;height:52px;object-fit:cover;border-radius:8px'>" +
          "<span style='flex:1'><b>" + esc(l.title) + "</b><div class='sub'>" +
          esc(l.listedAt || "") + " · " + price + " · " + esc(l.status || "active") +
          (l.hidden ? " · hidden" : "") + "</div></span>" +
          "<a class='btn btn-outline' href='#/listing/" + l.id + "'>Open</a>" +
          "<a class='btn btn-outline' href='#/account/edit/" + l.id + "'>Edit</a></div>";
      }).join("") : "<p class='sub'>No listings</p>") +
      "</div>";
    document.getElementById("global-sort").onchange = function () {
      location.hash = "#/account/global?sort=" + this.value;
    };
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
      if (isGlobal()) {
        if (!admin) {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Admin only.</p>";
          return;
        }
        return paintGlobal(cache);
      }
    }).catch(function () {});
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 400);
  setTimeout(load, 1000);
})();
