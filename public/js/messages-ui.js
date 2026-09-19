(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 3200);
  }
  function signedIn() {
    var label = document.getElementById("acct-label");
    var text = label ? String(label.textContent || "").trim() : "";
    return text && text !== "Log in" && text !== "Account" && text !== "Sign in";
  }
  function listingIdFromHash() {
    var m = (location.hash || "").match(/^#\/listing\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function ranchName() {
    var a = document.querySelector(".producer-mini b, .producer-mini a b");
    return a ? a.textContent.trim() : "the ranch";
  }
  function listingTitle() {
    var h = document.querySelector(".detail h2");
    return h ? h.textContent.trim() : "this listing";
  }
  function ensureBox() {
    var existing = document.getElementById("msg-box");
    if (existing) return existing;
    var btn = document.getElementById("contact-btn");
    if (!btn || !btn.parentNode) return null;
    var box = document.createElement("div");
    box.id = "msg-box";
    box.style.cssText = "display:none;margin-top:12px";
    box.innerHTML =
      '<label class="sub" style="display:block;margin-bottom:6px">Message to ' + ranchName() + "</label>" +
      '<textarea id="msg-body" rows="4" style="width:100%;box-sizing:border-box;border:1px solid #d8e0d6;border-radius:10px;padding:10px;font:inherit"></textarea>' +
      '<button class="btn btn-primary btn-wide" id="msg-send" type="button" style="margin-top:8px">Send message</button>';
    btn.parentNode.insertBefore(box, btn.nextSibling);
    return box;
  }
  document.addEventListener("click", function (e) {
    var send = e.target.closest && e.target.closest("#msg-send");
    if (send) {
      e.preventDefault();
      e.stopPropagation();
      var id = listingIdFromHash();
      var bodyEl = document.getElementById("msg-body");
      var body = bodyEl ? String(bodyEl.value || "").trim() : "";
      if (!body) { toast("Write a short message first."); return; }
      send.disabled = true;
      send.textContent = "Sending...";
      fetch("/api/listings/" + encodeURIComponent(id) + "/contact", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Could not send"); return d; }); })
        .then(function () {
          toast("Message sent to " + ranchName() + ".");
          var box = document.getElementById("msg-box");
          if (box) box.style.display = "none";
          if (bodyEl) bodyEl.value = "";
        })
        .catch(function (err) { toast(err.message); })
        .then(function () {
          send.disabled = false;
          send.textContent = "Send message";
        });
      return;
    }
    var btn = e.target.closest && e.target.closest("#contact-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!signedIn()) {
      toast("Sign in to message the ranch.");
      location.hash = "#/signin";
      return;
    }
    var box = ensureBox();
    if (!box) return;
    var open = box.style.display === "none" || !box.style.display;
    box.style.display = open ? "block" : "none";
    if (open) {
      var ta = document.getElementById("msg-body");
      if (ta && !ta.value) ta.value = "Hi, I'm interested in " + listingTitle() + ".";
      if (ta) ta.focus();
    }
  }, true);
})();
