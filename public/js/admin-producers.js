(function () {
  function esc(v) { return String(v || "").split("<").join(" "); }
  function hash() { return location.hash || ""; }

  function ensureLink() {
    var box = document.getElementById("admin-controls");
    if (!box || document.getElementById("nav-producers")) return;
    var a = document.createElement("a");
    a.id = "nav-producers";
    a.href = "#/account/producers";
    a.textContent = "Producers";
    a.style.cssText = "display:block;padding:8px 10px;border-radius:8px;font-weight:560;color:#3a4a3e";
    box.appendChild(a);
  }

  function mark() {
    var a = document.getElementById("nav-producers");
    if (!a) return;
    var on = hash().indexOf("#/account/producers") === 0;
    a.style.background = on ? "#d7eadc" : "transparent";
    a.style.color = on ? "#0f3f28" : "#3a4a3e";
  }

  function paint(producers) {
    var main = document.getElementById("dash-main");
    if (!main) return;
    var rows = (producers || []).slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    main.innerHTML =
      "<h2 class='page-title'>Producers</h2>" +
      "<p class='sub'>" + rows.length + " ranch accounts</p>" +
      "<div class='panel' style='margin-top:16px'>" +
      (rows.length ? rows.map(function (p) {
        var img = p.avatar || p.cover || "";
        return "<div class='row' style='align-items:center;gap:12px'>" +
          (img ? "<img src='" + String(img).split("'").join("") + "' alt='' style='width:52px;height:52px;object-fit:cover;border-radius:10px'>" : "") +
          "<span style='flex:1'><b>" + esc(p.name) + "</b><div class='sub'>" +
          esc(p.location) + " · sold " + (p.sold || 0) + "</div></span>" +
          "<a class='btn btn-outline' href='#/ranch/" + esc(p.slug) + "'>View public profile</a></div>";
      }).join("") : "<p class='sub'>No producers yet.</p>") +
      "</div>";
  }

  function load() {
    ensureLink();
    mark();
    if (hash().indexOf("#/account/producers") !== 0) return;
    fetch("/api/producers", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (data) { paint((data && data.producers) || []); })
      .catch(function () {
        var main = document.getElementById("dash-main");
        if (main) main.innerHTML = "<p>Could not load producers.</p>";
      });
  }

  window.addEventListener("hashchange", function () { setTimeout(load, 250); });
  setTimeout(load, 500);
  setTimeout(load, 1200);
})();
