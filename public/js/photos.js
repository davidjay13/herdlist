(function () {
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

  function enhance() {
    if ((location.hash || "").indexOf("#/list") !== 0) return;
    var form = document.getElementById("list-form");
    if (!form || form.getAttribute("data-photos") === "1") return;
    form.setAttribute("data-photos", "1");
    var grid = form.querySelector(".form-grid");
    if (!grid) return;
    var wrap = document.createElement("div");
    wrap.className = "field full";
    wrap.innerHTML =
      '<label>Photos (up to 4)</label>' +
      '<input id="photos" type="file" accept="image/*" multiple>' +
      '<div id="photo-preview" class="thumbs" style="margin-top:8px"></div>';
    var desc = grid.querySelector("textarea") && grid.querySelector("textarea").closest(".field");
    if (desc) grid.insertBefore(wrap, desc);
    else grid.appendChild(wrap);
    var input = document.getElementById("photos");
    var preview = document.getElementById("photo-preview");
    input.addEventListener("change", function () {
      preview.innerHTML = "";
      Array.prototype.slice.call(input.files, 0, 4).forEach(function (f) {
        var u = URL.createObjectURL(f);
        var box = document.createElement("div");
        box.style.cssText =
          "width:72px;height:72px;border-radius:8px;background-size:cover;background-position:center;background-image:url('" +
          u +
          "')";
        preview.appendChild(box);
      });
    });
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var btn = form.querySelector("button");
        if (btn) btn.disabled = true;
        var files = Array.prototype.slice.call(input.files || [], 0, 4);
        Promise.all(files.map(compressImage))
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
