(function () {
  var picked = [];
  var pickedVideo = null;

  function uploadVideo(file) {
    if (!file) return Promise.resolve("");
    if (file.size > 40 * 1024 * 1024) return Promise.reject(new Error("Video must be 40 MB or smaller."));
    return fetch("/api/upload/video", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": file.type || "video/mp4",
        "X-File-Name": encodeURIComponent(file.name || "clip.mp4")
      },
      body: file
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Video upload failed");
        return data.url;
      });
    });
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

  function addFiles(list) {
    Array.prototype.forEach.call(list || [], function (f) {
      if (!f || !String(f.type).startsWith("image/")) return;
      if (picked.length >= 4) return;
      var exists = picked.some(function (p) {
        return p.name === f.name && p.size === f.size;
      });
      if (!exists) picked.push(f);
    });
    renderPreview();
  }

  function renderPreview() {
    var preview = document.getElementById("photo-preview");
    var hint = document.getElementById("drop-hint");
    if (!preview) return;
    preview.innerHTML = "";
    picked.slice(0, 4).forEach(function (f, i) {
      var u = URL.createObjectURL(f);
      var box = document.createElement("div");
      box.style.cssText =
        "position:relative;width:84px;height:84px;border-radius:10px;overflow:hidden;background-size:cover;background-position:center;background-image:url('" +
        u +
        "')";
      var x = document.createElement("button");
      x.type = "button";
      x.textContent = "\u00d7";
      x.style.cssText =
        "position:absolute;top:4px;right:4px;width:22px;height:22px;border:0;border-radius:50%;background:#142018;color:#fff;cursor:pointer;line-height:22px;padding:0";
      x.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        picked.splice(i, 1);
        renderPreview();
      };
      box.appendChild(x);
      preview.appendChild(box);
    });
    if (hint) hint.style.display = picked.length ? "none" : "block";
  }

  function enhance() {
    if ((location.hash || "").indexOf("#/list") !== 0) return;
    var form = document.getElementById("list-form");
    if (!form || form.getAttribute("data-photos") === "1") return;
    form.setAttribute("data-photos", "1");
    picked = [];
    var grid = form.querySelector(".form-grid");
    if (!grid) return;
    var mobile = window.matchMedia("(max-width: 980px)").matches;
    var photoHint = mobile ? "Tap to add from your camera or library" : "Click or drop · up to 4";
    var videoHint = mobile ? "Tap to add from your camera or library" : "Click or drop · 40 MB max";
    var wrap = document.createElement("div");
    wrap.className = "field full";
    wrap.innerHTML =
      "<label>Photos</label>" +
      '<label id="dropzone" class="media-drop" for="photos">' +
      '<input id="photos" type="file" accept="image/*" multiple>' +
      "<span>" + photoHint + "</span>" +
      "</label>" +
      '<div id="photo-preview" class="thumbs" style="margin-top:10px;flex-wrap:wrap"></div>';

    pickedVideo = null;
    var vwrap = document.createElement("div");
    vwrap.className = "field full";
    vwrap.innerHTML =
      '<div class="media-title">Add video</div>' +
      '<label id="video-dropzone" class="media-drop" for="listing-video">' +
      '<input id="listing-video" type="file" accept="video/*,.mp4,.mov,.webm">' +
      "<span>" + videoHint + "</span>" +
      "</label>" +
      '<div id="video-name" class="sub" style="margin-top:8px;display:none"></div>' +
      '<div style="margin-top:12px"><label>Video link</label>' +
      '<input id="video-url" placeholder="YouTube, Vimeo, or mp4 URL"></div>';

    var titleField = grid.querySelector('input[name="title"]');
    titleField = titleField && titleField.closest(".field");
    if (titleField && titleField.nextSibling) {
      grid.insertBefore(wrap, titleField.nextSibling);
      grid.insertBefore(vwrap, wrap.nextSibling);
    } else {
      var desc = grid.querySelector("textarea") && grid.querySelector("textarea").closest(".field");
      if (desc) {
        grid.insertBefore(wrap, desc);
        grid.insertBefore(vwrap, desc);
      } else {
        grid.appendChild(wrap);
        grid.appendChild(vwrap);
      }
    }

    var vzone = document.getElementById("video-dropzone");
    var vinput = document.getElementById("listing-video");
    var vname = document.getElementById("video-name");
    function setVideoFile(f) {
      if (!f) return;
      var ok = String(f.type).indexOf("video/") === 0 || /\.(mp4|mov|webm|m4v)$/i.test(f.name || "");
      if (!ok) return;
      pickedVideo = f;
      if (vname) {
        vname.style.display = "block";
        vname.textContent = f.name + " · " + Math.round(f.size / 1024 / 1024 * 10) / 10 + " MB";
      }
    }
    vinput.addEventListener("change", function () {
      setVideoFile(vinput.files && vinput.files[0]);
      vinput.value = "";
    });
    ["dragenter", "dragover", "dragleave", "drop"].forEach(function (evt) {
      vzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); });
    });
    vzone.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      setVideoFile(f);
    });

    var zone = document.getElementById("dropzone");
    var input = document.getElementById("photos");
    input.addEventListener("change", function () {
      addFiles(input.files);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.style.background = "#d5eadc";
        zone.style.borderColor = "#0f3f28";
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.style.background = "#e6f2ea";
        zone.style.borderColor = "#1b6b45";
      });
    });
    zone.addEventListener("drop", function (e) {
      addFiles(e.dataTransfer && e.dataTransfer.files);
    });

    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var btn = form.querySelector("button");
        if (btn) btn.disabled = true;
        Promise.all(picked.slice(0, 4).map(compressImage))
          .then(function (images) {
            images = images.filter(Boolean);
            var body = {};
            Array.prototype.forEach.call(form.elements, function (el) {
              if (!el.name || el.type === "file") return;
              body[el.name] = el.value;
            });
            if (images.length) {
              body.image = images[0];
              body.images = images;
            }
            var link = (document.getElementById("video-url") && document.getElementById("video-url").value || "").trim();
            if (link) body.video = link;
            if (!pickedVideo) return body;
            var btn = form.querySelector("button");
            if (btn) btn.textContent = "Uploading video...";
            return uploadVideo(pickedVideo).then(function (url) {
              if (url) body.video = url;
              return body;
            });
          })
          .then(function (body) {
            var btn = form.querySelector("button");
            if (btn) btn.textContent = "Publish listing";
            return fetch("/api/listings", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }).then(function (res) {
              return res.json().then(function (data) {
                if (!res.ok) throw new Error(data.error || "Request failed");
                return data;
              });
            });
          })
          .then(function (r) {
            location.hash = "#/listing/" + r.listing.id;
            location.reload();
          })
          .catch(function (err) {
            var toast = document.getElementById("toast");
            if (toast) {
              toast.textContent = err.message || "Could not publish";
              toast.style.display = "block";
              setTimeout(function () {
                toast.style.display = "none";
              }, 2400);
            }
          })
          .then(function () {
            if (btn) btn.disabled = false;
          });
      },
      true
    );
  }

  window.addEventListener("hashchange", function () {
    setTimeout(enhance, 60);
  });
  setTimeout(enhance, 200);
  setTimeout(enhance, 600);
})();
