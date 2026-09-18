(function () {
  function fix() {
    var lab = document.getElementById("cover-label");
    if (!lab) return;
    lab.style.color = "#0f3f28";
    lab.style.background = "#fffcf7";
    lab.style.display = "inline-block";
    lab.style.opacity = "1";
    var t = (lab.textContent || "").trim();
    if (!t || t.length < 2) lab.textContent = "Drag and drop to add a header image";
    else if (t.indexOf("Change") === 0) lab.textContent = "Drag and drop to change header image";
    else if (t.indexOf("Drop header") === 0) lab.textContent = "Drag and drop to add a header image";
  }
  setInterval(fix, 300);
})();
