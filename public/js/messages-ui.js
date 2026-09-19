(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 3200);
  }
  function listingIdFromHash() {
    var m = (location.hash || "").match(/^#\/listing\/([^/?]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function esc(v) {
    return String(v || "").split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;");
  }
  function telHref(phone) {
    return "tel:" + String(phone || "").replace(/[^\d+]/g, "");
  }
  function contactHtml(p) {
    p = p || {};
    var rows = [];
    if (p.phone) {
      rows.push('<a class="btn btn-outline btn-wide" href="' + telHref(p.phone) + '" style="margin-top:6px">Call ' + esc(p.phone) + "</a>");
    }
    if (p.email) {
      rows.push('<a class="btn btn-outline btn-wide" href="mailto:' + esc(p.email) + '" style="margin-top:6px">Email ' + esc(p.email) + "</a>");
    }
    if (p.website) {
      var href = String(p.website).indexOf("http") === 0 ? p.website : ("https://" + p.website);
      rows.push('<a class="btn btn-outline btn-wide" href="' + esc(href) + '" target="_blank" rel="noopener" style="margin-top:6px">Website</a>');
    }
    if (!rows.length) {
      return "<p class='sub' style='margin:8px 0 0'>This ranch has not published a phone or email yet. Send a message in the app.</p>";
    }
    return "<div style='margin-top:8px'>" + rows.join("") + "</div>";
  }
  function boxMarkup(name, contact, defaultMsg) {
    return "<div style='font-weight:650;margin-bottom:4px'>Message " + esc(name || "the ranch") + "</div>" +
      "<p class='sub' style='margin:0 0 8px'>Send a note in Herd Yard, or reach them directly.</p>" +
      contact +
      '<label class="sub" style="display:block;margin:12px 0 6px">Your message</label>' +
      '<textarea id="msg-body" rows="4" style="width:100%;box-sizing:border-box;border:1px solid #d8e0d6;border-radius:10px;padding:10px;font:inherit">' + esc(defaultMsg || "") + "</textarea>" +
      '<button class="btn btn-primary btn-wide" id="msg-send" type="button" style="margin-top:8px">Send message</button>' +
      '<p class="sub" id="msg-status" style="margin:8px 0 0;display:none"></p>';
  }
  function ensureBox() {
    var existing = document.getElementById("msg-box");
    if (existing) return existing;
    var btn = document.getElementById("contact-btn") || document.getElementById("pub-msg");
    if (!btn || !btn.parentNode) return null;
    var box = document.createElement("div");
    box.id = "msg-box";
    box.style.cssText = "display:none;margin-top:12px;padding:12px;border:1px solid #d8e0d6;border-radius:14px;background:#fffcf7";
    box.innerHTML = boxMarkup("the ranch", "<p class='sub'>Loading contact...</p>", "");
    btn.parentNode.insertBefore(box, btn.nextSibling);
    return box;
  }
  function fillBox(box, listing, producer) {
    var p = producer || (listing && listing.producer) || {};
    var title = (listing && listing.title) || "this listing";
    var name = p.name || "the ranch";
    var draft = "Hi, I'm interested in " + title + ".";
    box.innerHTML = boxMarkup(name, contactHtml(p), draft);
  }
  function loadContact(box) {
    var id = listingIdFromHash();
    var ranch = (location.hash || "").match(/^#\/ranch\/([^/?]+)/);
    var url = id ? ("/api/listings/" + encodeURIComponent(id)) : (ranch ? ("/api/producers/" + encodeURIComponent(decodeURIComponent(ranch[1]))) : "");
    if (!url) {
      fillBox(box, null, null);
      return;
    }
    fetch(url, { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var listing = d.listing || null;
        var producer = d.producer || (listing && listing.producer) || null;
        if (producer && producer.phone && producer.email) {
          fillBox(box, listing, producer);
          return;
        }
        var key = producer && (producer.slug || producer.id);
        if (!key) {
          fillBox(box, listing, producer);
          return;
        }
        return fetch("/api/producers/" + encodeURIComponent(key), { credentials: "include" })
          .then(function (r) { return r.json(); })
          .then(function (pack) {
            fillBox(box, listing, pack.producer || producer);
          })
          .catch(function () { fillBox(box, listing, producer); });
      })
      .catch(function () { fillBox(box, null, null); });
  }
  function sendMessage(sendBtn) {
    var id = listingIdFromHash();
    if (!id) {
      var first = document.querySelector(".listing-card, a[href^='#/listing/']");
      var href = first && (first.getAttribute("href") || (first.getAttribute("onclick") || ""));
      var m = String(href).match(/listing\/([^/'"\s]+)/);
      if (m) id = m[1];
    }
    var bodyEl = document.getElementById("msg-body");
    var body = bodyEl ? String(bodyEl.value || "").trim() : "";
    var status = document.getElementById("msg-status");
    if (!body) { toast("Write a short message first."); return; }
    if (!id) { toast("Open a listing to message this ranch."); return; }
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    fetch("/api/me", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (me) {
        if (!me || !me.user) {
          toast("Sign in to send a message in the app.");
          location.hash = "#/signin";
          throw new Error("signin");
        }
        return fetch("/api/listings/" + encodeURIComponent(id) + "/contact", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: body })
        }).then(function (r) {
          return r.json().then(function (d) {
            if (!r.ok) throw new Error(d.error || "Could not send");
            return d;
          });
        });
      })
      .then(function () {
        toast("Message sent.");
        if (status) {
          status.style.display = "block";
          status.textContent = "Sent. You can also call or email using the links above.";
        }
        if (bodyEl) bodyEl.value = "";
      })
      .catch(function (err) {
        if (err && err.message !== "signin") toast(err.message || "Could not send");
      })
      .then(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send message";
      });
  }
  document.addEventListener("click", function (e) {
    var send = e.target.closest && e.target.closest("#msg-send");
    if (send) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage(send);
      return;
    }
    var btn = e.target.closest && e.target.closest("#contact-btn, #pub-msg");
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var box = ensureBox();
    if (!box) return;
    var open = box.style.display === "none" || !box.style.display;
    box.style.display = open ? "block" : "none";
    if (open) loadContact(box);
  }, true);
})();
