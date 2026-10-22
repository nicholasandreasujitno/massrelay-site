/* MassRelay site: theme toggle only. No network, no tracking. */
(function () {
  var root = document.documentElement, key = "massrelay-theme";
  var btn = document.getElementById("theme");
  if (!btn) return;
  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function label() { btn.textContent = current() === "dark" ? "Light" : "Dark"; }
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (e) {}
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  label();
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(key, next); } catch (e) {}
    label();
  });
})();
