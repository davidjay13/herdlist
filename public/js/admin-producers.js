(function () {
  function esc(v) { return String(v || "").split("<").join(" "); }
  function hash() { return location.hash || ""; }
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }
  function isPlaceholder(src) {
    if (!src) return true;
    var s = String(src);
    if (s.indexOf("unsplash.com") >= 0) return true;
    if (/logo\.(svg|png)/i.test(s)) return true;
    return false;
  }
  function face(src) {
    return isPlaceholder(src) ? "/cowboy.svg?v=2" : src;
  }
  function editId() {
    var m = hash().match(/^#\/account\/producers\/edit\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : null;
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
    if (!document.getElementById("nav-news")) {
      var c = document.createElement("a");
      c.id = "nav-news";
      c.href = "#/account/news";
      c.textContent = "News";
      c.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
      box.appendChild(c);
    }
    if (!document.getElementById("nav-emails")) {
      var em = document.createElement("a");
      em.id = "nav-emails";
      em.href = "#/account/emails";
      em.textContent = "Emails";
      em.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
      box.appendChild(em);
    }
  }

  function mark() {
    [["nav-producers", "#/account/producers"], ["nav-accounts", "#/account/accounts"], ["nav-news", "#/account/news"], ["nav-emails", "#/account/emails"]].forEach(function (pair) {
      var a = document.getElementById(pair[0]);
      if (!a) return;
      var on = hash().indexOf(pair[1]) === 0;
      a.style.background = on ? "#d7eadc" : "transparent";
      a.style.color = on ? "#0f3f28" : "#3a4a3e";
    });
  }

  function paintProducers(producers, counts) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    counts = counts || {};
    var q = ((document.getElementById("prod-admin-q") || {}).value || "");
    var term = q.trim().toLowerCase();
    var rows = (producers || []).slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    if (term) {
      rows = rows.filter(function (p) {
        return [p.name, p.location, p.owner, p.email, p.phone, p.slug].join(" ").toLowerCase().indexOf(term) >= 0;
      });
    }
    var COW = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80";
    var cards = rows.map(function (p) {
      var n = counts[p.id] || 0;
      var cover = isPlaceholder(p.cover) ? (isPlaceholder(p.avatar) ? COW : p.avatar) : p.cover;
      var avatar = face(p.avatar);
      var slug = p.slug || p.id;
      return "<article class='listing-card admin-prod-tile'>" +
        "<div class='thumb' style='background-image:url(" + JSON.stringify(String(cover)) + ")'>" +
        "<span class='badge'>" + esc(p.name || "Ranch") + "</span></div>" +
        "<div class='listing-body'>" +
        "<div style='display:flex;gap:10px;align-items:center;margin-bottom:8px'>" +
        "<img src='" + String(avatar).split("'").join("") + "' alt='' style='width:36px;height:36px;border-radius:50%;object-fit:cover;background:#d6dbd4;border:1px solid #d8e0d6'>" +
        "<div><div class='price' style='font-size:1rem;margin:0'>" + esc(p.name || "Ranch") + "</div>" +
        "<div class='meta'>" + esc(p.location || "Location not set") + "</div></div></div>" +
        "<div class='meta'><span>" + n + " listing" + (n === 1 ? "" : "s") + "</span><span>" + (p.sold || 0) + " sold</span><span>" + (p.imported ? "Imported" : "Claimed") + "</span></div>" +
        "<div class='admin-prod-tile-actions'>" +
        "<a class='btn btn-outline' href='#/ranch/" + esc(slug) + "'>View</a>" +
        "<a class='btn btn-primary' href='#/account/producers/edit/" + encodeURIComponent(p.id) + "'>Edit</a>" +
        "</div></div></article>";
    }).join("");
    main.innerHTML =
      "<div class='admin-prod-head'>" +
      "<div><h2 class='page-title' style='margin:0'>Producers</h2>" +
      "<p class='sub'>" + rows.length + " of " + (producers || []).length + " ranch profiles</p></div>" +
      "<div class='field' style='min-width:240px;margin:0'><label>Search</label>" +
      "<input id='prod-admin-q' placeholder='Name, location, email' value='" + esc(q) + "'></div></div>" +
      "<div class='cards-3'>" + (cards || "<div class='empty'>No producers match.</div>") + "</div>";
    var input = document.getElementById("prod-admin-q");
    if (input) {
      input.oninput = function () { paintProducers(producers, counts); };
      setTimeout(function () {
        var el = document.getElementById("prod-admin-q");
        if (el && term) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }
  }

  function paintProducerEdit(p) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var avatarData = null;
    var coverData = null;
    var avSrc = face(p.avatar);
    var coverSrc = isPlaceholder(p.cover) ? "" : p.cover;
    main.innerHTML =
      "<div class='admin-prod-head'><div>" +
      "<p class='sub' style='margin:0 0 6px'><a href='#/account/producers'>← All producers</a></p>" +
      "<h2 class='page-title' style='margin:0'>Edit " + esc(p.name || "ranch") + "</h2>" +
      "<p class='sub'>Changes go live on the public ranch profile.</p></div>" +
      "<a class='btn btn-outline' href='#/ranch/" + esc(p.slug || p.id) + "'>View public profile</a></div>" +
      "<div id='admin-cover-drop' class='admin-cover-drop'" + (coverSrc ? " style='background-image:url(" + JSON.stringify(coverSrc) + ")'" : "") + ">" +
      "<div id='admin-cover-label' class='admin-cover-label'>Drop header image or click to upload</div></div>" +
      "<div class='panel' style='display:flex;gap:16px;align-items:center;margin-bottom:16px'>" +
      "<button type='button' id='admin-avatar-btn' class='admin-avatar-btn' style='background-image:url(" + JSON.stringify(avSrc) + ")'></button>" +
      "<div><b>Profile photo</b><div class='sub'>Gray cowboy shows until a photo is uploaded.</div></div></div>" +
      "<form id='admin-prod-form' class='panel'><div class='form-grid'>" +
      "<div class='field'><label>Ranch name</label><input name='ranchName' value='" + esc(p.name) + "' required></div>" +
      "<div class='field'><label>Owner</label><input name='owner' value='" + esc(p.owner) + "'></div>" +
      "<div class='field'><label>Location</label><input name='location' value='" + esc(p.location) + "' placeholder='City, ST'></div>" +
      "<div class='field'><label>Phone</label><input name='phone' value='" + esc(p.phone) + "'></div>" +
      "<div class='field'><label>Email</label><input name='email' value='" + esc(p.email) + "'></div>" +
      "<div class='field'><label>Website</label><input name='website' value='" + esc(p.website) + "'></div>" +
      "<div class='field full'><label>Associations</label><input name='associations' value='" + esc((p.associations || []).join(", ")) + "'></div>" +
      "<div class='field full'><label>About</label><textarea name='about' rows='4'>" + esc(p.about) + "</textarea></div>" +
      "<div class='field full'><label>Operations</label><textarea name='operations' rows='4'>" + esc(p.operations) + "</textarea></div></div>" +
      "<div style='display:flex;gap:8px;margin-top:16px;flex-wrap:wrap'>" +
      "<button class='btn btn-primary' type='submit'>Save ranch</button>" +
      "<a class='btn btn-outline' href='#/account/producers'>Cancel</a></div></form>" +
      "<input id='admin-avatar-file' type='file' accept='image/*' style='display:none'>" +
      "<input id='admin-cover-file' type='file' accept='image/*' style='display:none'>";

    var avBtn = document.getElementById("admin-avatar-btn");
    var avFile = document.getElementById("admin-avatar-file");
    var coverDrop = document.getElementById("admin-cover-drop");
    var coverFile = document.getElementById("admin-cover-file");
    if (avBtn && avFile) {
      avBtn.onclick = function () { avFile.click(); };
      avFile.onchange = function () {
        if (!avFile.files[0]) return;
        compress(avFile.files[0], 640).then(function (d) {
          if (!d) return;
          avatarData = d;
          avBtn.style.backgroundImage = "url(" + JSON.stringify(d) + ")";
        });
      };
    }
    function takeCover(file) {
      if (!file) return;
      compress(file, 1400).then(function (d) {
        if (!d) return;
        coverData = d;
        coverDrop.style.backgroundImage = "url(" + JSON.stringify(d) + ")";
        coverDrop.style.backgroundSize = "cover";
        var lab = document.getElementById("admin-cover-label");
        if (lab) lab.textContent = "Header image updated";
      });
    }
    if (coverDrop && coverFile) {
      coverDrop.onclick = function () { coverFile.click(); };
      coverFile.onchange = function () { takeCover(coverFile.files[0]); };
      coverDrop.ondragover = function (e) { e.preventDefault(); coverDrop.classList.add("on"); };
      coverDrop.ondragleave = function () { coverDrop.classList.remove("on"); };
      coverDrop.ondrop = function (e) {
        e.preventDefault();
        coverDrop.classList.remove("on");
        takeCover(e.dataTransfer.files[0]);
      };
    }
    var form = document.getElementById("admin-prod-form");
    if (form) form.onsubmit = function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var body = {};
      fd.forEach(function (v, k) { body[k] = v; });
      if (avatarData) body.avatar = avatarData;
      if (coverData) body.cover = coverData;
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      fetch("/api/admin/producers/" + encodeURIComponent(p.id), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) {
        return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Save failed"); return d; });
      }).then(function () {
        toast("Ranch profile saved.");
        location.hash = "#/account/producers";
      }).catch(function (err) {
        toast(err.message);
      }).then(function () { if (btn) btn.disabled = false; });
    };
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
          "<img src='" + String(face(a.avatar)).split("'").join("") + "' alt='' style='width:40px;height:40px;object-fit:cover;background:#d6dbd4;border-radius:8px'>" +
          "<span style='flex:1'><b>" + esc(a.name) + "</b>" +
          "<div class='sub'>" + esc(a.email) + (a.phone ? " · " + esc(a.phone) : "") + " · id " + a.id + "</div></span>" +
          "<span class='sub'>" + esc(a.producerName || "no ranch") + "<br>" + esc(a.location) + "</span>" +
          "<span class='sub'>" + a.listingCount + " listings</span>" +
          "<span class='sub'>" + badge + "</span>" +
          (a.producerId ? "<a class='btn btn-primary' href='#/account/producers/edit/" + encodeURIComponent(a.producerId) + "'>Edit</a>" : "") +
          (a.slug ? "<a class='btn btn-outline' href='#/ranch/" + esc(a.slug) + "'>View</a>" : "") +
          "</div>";
      }).join("") : "<p class='sub'>No accounts in this view.</p>") +
      "</div>";
    var sel = document.getElementById("acct-filter");
    if (sel) sel.onchange = function () { paintAccounts(accounts); };
  }

  function whenMail(ts) {
    if (!ts) return "";
    try {
      return new Date(Number(ts)).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return ""; }
  }
  function paintEmails(emails) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var q = ((document.getElementById("mail-q") && document.getElementById("mail-q").value) || "").trim().toLowerCase();
    var rows = emails || [];
    if (q) {
      rows = rows.filter(function (m) {
        return String(m.to || "").toLowerCase().indexOf(q) >= 0 || String(m.subject || "").toLowerCase().indexOf(q) >= 0;
      });
    }
    main.innerHTML =
      "<h2 class='page-title'>Emails</h2>" +
      "<p class='sub'>Every message Herd Yard has sent. Use this to spot typo addresses. " + rows.length + " shown of " + (emails || []).length + ".</p>" +
      "<div style='display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin:16px 0'>" +
      "<div class='field' style='max-width:360px;margin:0;flex:1'><label>Search</label>" +
      "<input id='mail-q' placeholder='Recipient or subject' value='" + esc(q) + "'></div>" +
      "<button class='btn btn-outline' type='button' id='mail-test'>Send test to me</button>" +
      "<button class='btn btn-outline' type='button' id='mail-weekly'>Send weekly stats now</button></div>" +
      "<div class='panel'>" +
      (rows.length ? "<div class='row' style='display:flex;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;color:#6b7a6e;font-weight:650;padding:0 0 8px'>" +
        "<span style='flex:1.4'>To</span><span style='flex:1.6'>Subject</span><span style='width:88px'>Status</span><span style='width:160px'>When</span></div>" +
        rows.map(function (m) {
          var st = m.status || "sent";
          var color = st === "error" ? "#b4532a" : (st === "skipped" ? "#6b7a6e" : "#1b6b45");
          return "<div class='row' style='display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid #e6eee8'>" +
            "<span style='flex:1.4;min-width:0'><b style='word-break:break-all'>" + esc(m.to) + "</b>" +
            (m.error ? "<div class='sub'>" + esc(m.error) + "</div>" : "") + "</span>" +
            "<span style='flex:1.6;min-width:0'>" + esc(m.subject) + "</span>" +
            "<span style='width:88px;color:" + color + ";font-weight:650'>" + esc(st) + "</span>" +
            "<span class='sub' style='width:160px'>" + esc(whenMail(m.at)) + "</span></div>";
        }).join("") : "<p class='sub'>No emails logged yet. New signups, listings, messages, and follows will show here.</p>") +
      "</div>";
    var input = document.getElementById("mail-q");
    if (input) {
      input.onkeydown = function (e) {
        if (e.key === "Enter") paintEmails(emails);
      };
    }
    var test = document.getElementById("mail-test");
    if (test) test.onclick = function () {
      test.disabled = true;
      fetch("/api/admin/test-email", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(function (r) { return r.json(); })
        .then(function () {
          return fetch("/api/admin/mail", { credentials: "include" }).then(function (r) { return r.json(); });
        })
        .then(function (data) { paintEmails((data && data.emails) || emails); })
        .catch(function () { test.disabled = false; });
    };
    var weeklyBtn = document.getElementById("mail-weekly");
    if (weeklyBtn) weeklyBtn.onclick = function () {
      weeklyBtn.disabled = true;
      fetch("/api/admin/weekly-stats", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Send failed"); return d; }); })
        .then(function (d) {
          return fetch("/api/admin/mail", { credentials: "include" }).then(function (r) { return r.json(); }).then(function (data) {
            paintEmails((data && data.emails) || emails);
            var main = document.getElementById("dash-main");
            if (main) {
              var note = document.createElement("p");
              note.className = "sub";
              note.textContent = "Weekly stats sent to " + (d.sent || 0) + " opted-in account" + ((d.sent === 1) ? "" : "s") + ".";
              var h = main.querySelector("h2");
              if (h && h.parentNode) h.parentNode.insertBefore(note, h.nextSibling);
            }
          });
        })
        .catch(function (err) { weeklyBtn.disabled = false; alert(err.message || "Could not send"); });
    };
  }

  function paintNews(items) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var rows = items || [];
    function val(v) {
      return String(v || "").split("'").join("&#39;").split("<").join(" ");
    }
    main.innerHTML =
      "<h2 class='page-title'>Industry news</h2>" +
      "<p class='sub'>Paste article links or write a headline. Edit the ticker copy anytime.</p>" +
      "<form id='news-form' class='panel' style='margin:16px 0'>" +
      "<div class='form-grid'>" +
      "<div class='field full'><label>Headline</label><input id='news-headline' placeholder='Optional if you paste a link'></div>" +
      "<div class='field full'><label>Subtext</label><input id='news-subtext' placeholder='Short line under the headline'></div>" +
      "<div class='field full'><label>Article links</label>" +
      "<textarea id='news-urls' rows='3' placeholder='https://www.drovers.com/....' style='width:100%'></textarea></div></div>" +
      "<button class='btn btn-primary' type='submit' style='margin-top:12px'>Add to ticker</button></form>" +
      "<div class='news-admin-list'>" +
      (rows.length ? rows.map(function (n) {
        return "<form class='panel news-edit' data-id='" + val(n.id) + "'>" +
          "<div class='form-grid'>" +
          "<div class='field full'><label>Headline</label><input name='title' value='" + val(n.title) + "' required></div>" +
          "<div class='field full'><label>Subtext</label><input name='subtext' value='" + val(n.subtext || n.source || "") + "'></div>" +
          "<div class='field full'><label>Link</label><input name='url' value='" + val(n.url) + "' placeholder='https://'></div></div>" +
          "<div style='display:flex;gap:8px;margin-top:12px;flex-wrap:wrap'>" +
          "<button class='btn btn-primary' type='submit'>Save</button>" +
          (n.url ? "<a class='btn btn-outline' href='" + val(n.url) + "' target='_blank' rel='noopener'>Open</a>" : "") +
          "<button class='btn btn-outline news-del' data-id='" + val(n.id) + "' type='button'>Remove</button></div></form>";
      }).join("") : "<div class='panel'><p class='sub'>No articles yet.</p></div>") +
      "</div>";
    var form = document.getElementById("news-form");
    if (form) form.onsubmit = function (e) {
      e.preventDefault();
      var body = {
        urls: (document.getElementById("news-urls") || {}).value || "",
        title: (document.getElementById("news-headline") || {}).value || "",
        subtext: (document.getElementById("news-subtext") || {}).value || ""
      };
      fetch("/api/admin/news", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Could not add"); return d; }); })
        .then(function (d) { paintNews(d.news || []); })
        .catch(function (err) { alert(err.message); });
    };
    main.querySelectorAll("form.news-edit").forEach(function (f) {
      f.onsubmit = function (e) {
        e.preventDefault();
        var id = f.getAttribute("data-id");
        var fd = new FormData(f);
        var body = { title: fd.get("title"), subtext: fd.get("subtext"), url: fd.get("url") };
        var btn = f.querySelector("button[type=submit]");
        if (btn) btn.disabled = true;
        fetch("/api/admin/news/" + encodeURIComponent(id), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Save failed"); return d; }); })
          .then(function (d) { paintNews(d.news || []); })
          .catch(function (err) { alert(err.message); })
          .then(function () { if (btn) btn.disabled = false; });
      };
    });
    main.querySelectorAll(".news-del").forEach(function (btn) {
      btn.onclick = function () {
        fetch("/api/admin/news/" + encodeURIComponent(btn.getAttribute("data-id")), { method: "DELETE", credentials: "include" })
          .then(function (r) { return r.json(); })
          .then(function (d) { paintNews(d.news || []); });
      };
    });
  }

  function load() {
    ensureLink();
    mark();
    if (hash().indexOf("#/account/producers") === 0) {
      Promise.all([
        fetch("/api/producers", { credentials: "include" }).then(function (r) { return r.json(); }),
        fetch("/api/listings", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; })
      ]).then(function (pair) {
        var producers = (pair[0] && pair[0].producers) || [];
        var counts = {};
        ((pair[1] && pair[1].listings) || []).forEach(function (l) {
          if (!l || l.hidden || l.status === "sold") return;
          counts[l.producerId] = (counts[l.producerId] || 0) + 1;
        });
        var id = editId();
        if (id) {
          var found = producers.filter(function (p) { return p.id === id || p.slug === id; })[0];
          if (found) return paintProducerEdit(found);
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Ranch not found. <a href='#/account/producers'>Back to producers</a></p>";
          return;
        }
        paintProducers(producers, counts);
      }).catch(function () {
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
      return;
    }
    if (hash().indexOf("#/account/emails") === 0) {
      fetch("/api/admin/mail", { credentials: "include" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Admin only"); return d; }); })
        .then(function (data) { paintEmails((data && data.emails) || []); })
        .catch(function (e) {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>" + esc(e.message || "Could not load emails.") + "</p>";
        });
      return;
    }
    if (hash().indexOf("#/account/news") === 0) {
      fetch("/api/news", { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (data) { paintNews((data && data.news) || []); })
        .catch(function () {
          var main = document.getElementById("dash-main");
          if (main) main.innerHTML = "<p>Could not load news.</p>";
        });
    }
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 500);
  setTimeout(load, 1200);
})();
