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

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !String(file.type).startsWith("image/")) return resolve(null);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1280;
        var w = img.width;
        var h = img.height;
        if (w > max || h > max) {
          var scale = Math.min(max / w, max / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read photo"));
      };
      img.src = url;
    });
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
    if (!admin) return;
    var box = document.getElementById("admin-controls");
    if (!box) {
      box = document.createElement("div");
      box.id = "admin-controls";
      box.style.cssText = "margin:8px 8px 4px;padding:8px 8px 6px;border-radius:12px;background:#eef4ef";
      box.innerHTML = "<div style='font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5c6f62;padding:4px 6px 6px'>Admin</div>";
      var browse = aside.querySelector("a[href='#/browse']");
      if (browse && browse.parentNode) browse.parentNode.insertBefore(box, browse);
      else aside.appendChild(box);
    }
    if (!document.getElementById("nav-global")) {
      var g = document.createElement("a");
      g.id = "nav-global";
      g.href = "#/account/global";
      g.textContent = "Global Listings";
      g.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
      box.appendChild(g);
    }
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
    var st = l.status || "active";
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
      if (st === "active") return (l.status || "active") === "active";
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
          "</div></span>" +
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
    var pendingPhotos = [];
    var currentSrc = photo(listing);
    main.innerHTML =
      "<h2 class='page-title'>Edit listing</h2>" +
      "<form id='listing-edit-form' class='panel'><div class='form-grid'>" +
      "<div class='field full'><label>Photo</label>" +
      "<img id='edit-photo-preview' src='" + String(currentSrc).split("'").join("") + "' alt='listing photo' style='width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin:0 0 12px;background:#dce8d8'>" +
      "<div id='edit-dropzone' style='border:2px dashed #1b6b45;background:#e6f2ea;border-radius:16px;padding:16px;text-align:center;cursor:pointer'>" +
      "<input id='edit-photo-input' type='file' accept='image/*' multiple style='display:none'>" +
      "<strong style='display:block;color:#0f3f28'>Replace photo</strong>" +
      "<span style='display:block;font-size:0.88rem;color:#3a4a3e'>Click or drop</span></div>" +
      "<div style='margin-top:10px'><label>Photo link</label>" +
      "<input id='edit-photo-url' placeholder='https://'></div></div>" +
      "<div class='field full'><label>Video</label>" +
      (listing.video ? "<video controls playsinline src='" + String(listing.video).split("'").join("") + "' style='width:100%;max-height:220px;border-radius:12px;background:#142018;margin:0 0 10px'></video>" : "") +
      "<div id='edit-video-drop' style='border:2px dashed #1b6b45;background:#e6f2ea;border-radius:16px;padding:16px;text-align:center;cursor:pointer'>" +
      "<input id='edit-video-input' type='file' accept='video/mp4,video/webm,video/quicktime' style='display:none'>" +
      "<strong style='display:block;color:#0f3f28'>Add video</strong>" +
      "<span style='display:block;font-size:0.88rem;color:#3a4a3e'>Click or drop · 40 MB max</span>" +
      "<div id='edit-video-name' class='sub' style='margin-top:8px;display:none'></div></div>" +
      "<div style='margin-top:10px'><label>Video link</label>" +
      "<input id='edit-video-url' placeholder='YouTube, Vimeo, or mp4 URL' value='" + esc(listing.video && String(listing.video).indexOf("http") === 0 ? listing.video : "") + "'></div>" +
      "<label style='display:flex;gap:8px;margin-top:10px;cursor:pointer'><input type='checkbox' id='edit-video-clear'> Remove video</label></div>" +
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

    var zone = document.getElementById("edit-dropzone");
    var input = document.getElementById("edit-photo-input");
    var preview = document.getElementById("edit-photo-preview");
    function useFiles(list) {
      pendingPhotos = Array.prototype.slice.call(list || []).filter(function (f) {
        return f && String(f.type).startsWith("image/");
      }).slice(0, 4);
      if (pendingPhotos[0]) preview.src = URL.createObjectURL(pendingPhotos[0]);
    }
    zone.onclick = function (e) {
      if (e.target.closest("input")) return;
      input.click();
    };
    input.onchange = function () { useFiles(input.files); input.value = ""; };
    ["dragenter", "dragover", "dragleave", "drop"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); });
    });
    zone.addEventListener("drop", function (e) { useFiles(e.dataTransfer && e.dataTransfer.files); });
    document.getElementById("edit-photo-url").addEventListener("change", function () {
      var v = this.value.trim();
      if (v) preview.src = v;
    });

    var pendingVideo = null;
    var vzone = document.getElementById("edit-video-drop");
    var vinput = document.getElementById("edit-video-input");
    var vname = document.getElementById("edit-video-name");
    if (vzone && vinput) {
      vzone.onclick = function (e) { if (!e.target.closest("input")) vinput.click(); };
      vinput.onchange = function () {
        var f = vinput.files && vinput.files[0];
        if (f && String(f.type).indexOf("video/") === 0) {
          pendingVideo = f;
          if (vname) {
            vname.style.display = "block";
            vname.textContent = f.name + " · " + Math.round(f.size / 1024 / 1024 * 10) / 10 + " MB";
          }
        }
        vinput.value = "";
      };
      vzone.addEventListener("dragover", function (e) { e.preventDefault(); });
      vzone.addEventListener("drop", function (e) {
        e.preventDefault();
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && String(f.type).indexOf("video/") === 0) {
          pendingVideo = f;
          if (vname) {
            vname.style.display = "block";
            vname.textContent = f.name;
          }
        }
      });
    }

    document.getElementById("listing-edit-form").onsubmit = function (e) {
      e.preventDefault();
      var body = Object.fromEntries(new FormData(e.target).entries());
      var urlVal = (document.getElementById("edit-photo-url").value || "").trim();
      var btn = e.target.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      Promise.resolve()
        .then(function () {
          if (!pendingPhotos.length) return [];
          return Promise.all(pendingPhotos.map(compressImage));
        })
        .then(function (images) {
          images = (images || []).filter(Boolean);
          if (images.length) {
            body.image = images[0];
            body.images = images;
          } else if (urlVal) {
            body.image = urlVal;
            body.images = [urlVal];
          }
          var clearVid = document.getElementById("edit-video-clear");
          var vlink = (document.getElementById("edit-video-url") && document.getElementById("edit-video-url").value || "").trim();
          if (clearVid && clearVid.checked) body.video = "";
          else if (vlink) body.video = vlink;
          if (!pendingVideo || (clearVid && clearVid.checked)) return body;
          if (btn) btn.textContent = "Uploading video...";
          return fetch("/api/upload/video", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": pendingVideo.type || "video/mp4",
              "X-File-Name": encodeURIComponent(pendingVideo.name || "clip.mp4")
            },
            body: pendingVideo
          }).then(function (r) {
            return r.json().then(function (d) {
              if (!r.ok) throw new Error(d.error || "Video upload failed");
              body.video = d.url;
              return body;
            });
          });
        })
        .then(function (body) {
          if (btn) btn.textContent = "Save listing";
          return fetch("/api/listings/" + listing.id, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }).then(function (r) {
            return r.json().then(function (d) {
              if (!r.ok) throw new Error(d.error || "Save failed");
              return d;
            });
          });
        })
        .then(function () {
          toast("Listing saved.");
          location.hash = admin ? "#/account/global" : "#/account/listings";
        })
        .catch(function (err) { toast(err.message); })
        .then(function () { if (btn) btn.disabled = false; });
    };
  }

  function load() {
    if (hash().indexOf("#/account") !== 0) return;
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then(function (r) { return r.json(); }),
      fetch("/api/my/listings", { credentials: "include" }).then(function (r) { return r.json(); })
    ]).then(function (pair) {
      admin = !!(pair[0] && (pair[0].admin || (pair[0].user && (pair[0].user.admin || String(pair[0].user.email || "").toLowerCase() === "david@davidjay.com"))));
      cache = (pair[1] && pair[1].listings) || [];
      ensureNav();
      markNav();
      var id = editId();
      function findListing(list) {
        return (list || []).filter(function (l) { return l.id === id; })[0];
      }
      if (id) {
        var listing = findListing(cache);
        if (listing) return paintEdit(listing);
        if (!admin) return;
        return fetch("/api/admin/listings", { credentials: "include" })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var found = findListing((d && d.listings) || []);
            if (found) paintEdit(found);
          });
      }
      if (hash().indexOf("#/account/listings") === 0) return paintBoard(cache);
      if (isGlobal()) {
        if (!admin) {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Admin only.</p>";
          return;
        }
        return fetch("/api/admin/listings", { credentials: "include" })
          .then(function (r) { return r.json(); })
          .then(function (d) { paintGlobal((d && d.listings) || []); });
      }
    }).catch(function () {});
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 400);
  setTimeout(load, 1000);
})();
