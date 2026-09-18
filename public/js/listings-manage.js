(function () {
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

  function editId() {
    var m = (location.hash || "").match(/^#\/account\/edit\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function paintRows(listings) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var panel = main.querySelector(".panel");
    if (!panel || main.querySelector("#listing-edit-form")) return;
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
    panel.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.onclick = function () {
        if (!confirm("Delete this listing?")) return;
        fetch("/api/listings/" + btn.getAttribute("data-del"), {
          method: "DELETE",
          credentials: "include"
        })
          .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Delete failed"); toast("Listing deleted."); location.hash = "#/account"; setTimeout(load, 200); }); })
          .catch(function (e) { toast(e.message); });
      };
    });
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
      "<div class='field full'><label>Description</label><textarea name='description' rows='5'>" + (listing.description || "") + "</textarea></div>" +
      "</div><div style='margin-top:14px;display:flex;gap:8px'>" +
      "<button class='btn btn-primary' type='submit'>Save listing</button>" +
      "<button class='btn btn-outline' type='button' id='listing-del'>Delete listing</button>" +
      "<a class='btn btn-outline' href='#/account'>Cancel</a></div></form>";
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
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Save failed"); toast("Listing saved."); location.hash = "#/account"; }); })
        .catch(function (err) { toast(err.message); });
    };
    document.getElementById("listing-del").onclick = function () {
      if (!confirm("Delete this listing?")) return;
      fetch("/api/listings/" + listing.id, { method: "DELETE", credentials: "include" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Delete failed"); toast("Listing deleted."); location.hash = "#/account"; }); })
        .catch(function (err) { toast(err.message); });
    };
  }

  function load() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account") !== 0) return;
    var id = editId();
    fetch("/api/my/listings", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var listings = (data && data.listings) || [];
        if (id) {
          var listing = listings.filter(function (l) { return l.id === id; })[0];
          if (!listing) {
            var main = document.getElementById("dash-main");
            if (main) main.innerHTML = "<p>Listing not found.</p>";
            return;
          }
          paintEdit(listing);
          return;
        }
        if (hash === "#/account" || hash === "#/account/") paintRows(listings);
      })
      .catch(function () {});
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 500);
  setTimeout(load, 1200);
})();
