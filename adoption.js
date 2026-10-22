/* MKT-3/MKT-4: the sector graph as a navigator. Selection works without this file (:target; every fan open). With it: one group open at a
   time (its sectors fan out, the others fold back), one panel open, a hover card from each node's own data, the room folds all. No network;
   nothing is written as markup. */
(function () {
  var root = document.getElementById("adoption"), card = document.getElementById("gcard");
  if (!root) return;
  root.classList.add("js");
  var wrap = root.querySelector(".graph-wrap"), svg = root.querySelector(".graph"), line = card ? card.querySelectorAll("p") : [];
  function each(sel, fn) { var xs = root.querySelectorAll(sel); for (var i = 0; i < xs.length; i++) fn(xs[i]); }
  // The zoom: the view box glides from the ring to the open group and its fan (a jump under reduced motion).
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches, vbFrom, vbTo, vbT0;
  function vb(str) { return str.split(" ").map(Number); }
  function zoom(target) {
    if (!svg) return;
    var to = vb(target), from = vb(svg.getAttribute("viewBox"));
    if (still) { svg.setAttribute("viewBox", target); return; }
    vbFrom = from; vbTo = to; vbT0 = performance.now();
    requestAnimationFrame(function step(t) {
      if (vbTo !== to) return;
      var k = Math.min(1, (t - vbT0) / 480); k = 1 - Math.pow(1 - k, 3);
      svg.setAttribute("viewBox", vbFrom.map(function (a, i) { return (a + (vbTo[i] - a) * k).toFixed(1); }).join(" "));
      if (k < 1) requestAnimationFrame(step);
    });
  }
  function open(g, mapOnly) {
    if (!mapOnly) each(".gchip", function (c) { c.classList.toggle("on", c.getAttribute("data-group") === g); });
    if (g) each(".gfields", function (f) { f.classList.toggle("open", f.getAttribute("data-group") === g); });
    var gn = g && root.querySelector('.n.g[data-group="' + g + '"]');
    zoom(gn ? gn.getAttribute("data-vb") : svg.getAttribute("data-vb"));
    each(".fan", function (f) { f.classList.toggle("open", f.getAttribute("data-g") === g); });
    each(".n.g, .labels .l", function (n) {
      var mine = n.getAttribute("data-group") === g;
      n.classList.toggle("open", mine); n.classList.toggle("dim", !!g && !mine);
    });
    if (svg) svg.classList.toggle("has-open", !!g);
  }
  function pick(slug, scroll) {
    var panel = document.getElementById("s-" + slug);
    if (!panel) return;
    each(".on", function (x) { x.classList.remove("on"); });
    panel.classList.remove("on"); void panel.offsetWidth; panel.classList.add("on");
    root.classList.add("picked");
    var node = root.querySelector('.sn[data-sector="' + slug + '"]');
    each('[data-sector="' + slug + '"]', function (m) { m.classList.add("on"); });
    if (node) open(node.getAttribute("data-g"));
    if (scroll && panel.getBoundingClientRect().top > window.innerHeight * 0.6) panel.scrollIntoView({ block: "start" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#s-"], a[href^="#g-"], a[href^="#gf-"], a.hub-a');
    if (!a) return;
    var h = a.getAttribute("href");
    if (h.indexOf("#s-") === 0) { e.preventDefault(); try { history.replaceState(null, "", h); } catch (err) {} pick(h.slice(3), true); return; }
    if (a.classList.contains("hub-a")) { e.preventDefault(); open(null, true); hide(); return; }
    var g = h.indexOf("#gf-") === 0 ? h.slice(4) : h.slice(3), inGraph = !!a.closest(".graph");
    if (inGraph) { e.preventDefault(); open(a.classList.contains("open") ? null : g); hide(); }
    else if (a.classList.contains("gchip")) {
      e.preventDefault(); open(g);
      var cur = root.querySelector(".sector.on"), firstOf = root.querySelector('.gfields[data-group="' + g + '"] .ft');
      if (firstOf && !(cur && root.querySelector('.gfields[data-group="' + g + '"] .ft[data-sector="' + cur.id.slice(2) + '"]'))) pick(firstOf.getAttribute("data-sector"), false);
    }
    else open(g);
  });
  // The hover card: facts from the node's data attributes, placed beside the dot inside the graph's box.
  function show(n) {
    if (!card || !wrap) return;
    var d = n.dataset, group = n.classList.contains("g");
    line[0].textContent = d.name;
    line[1].textContent = group
      ? d.k + (d.k === "1" ? " sector · " : " sectors · ") + d.n + " adoptions · " + d.c + (d.c === "1" ? " country" : " countries")
      : d.n === "0" ? "Researching · " + d.group : d.n + (d.n === "1" ? " adoption · " : " adoptions · ") + d.c + (d.c === "1" ? " country" : " countries") + (d.r ? " · " + d.r : "");
    line[2].textContent = group ? (n.classList.contains("open") ? "Click to fold its sectors back" : "Click to open its sectors") : d.first ? "Adopt first: " + d.first : "";
    line[2].hidden = !line[2].textContent;
    var c = n.querySelector("circle").getBoundingClientRect(), w = wrap.getBoundingClientRect();
    card.hidden = false;
    var cw = card.offsetWidth, x = c.left - w.left + c.width / 2, y = c.top - w.top;
    card.style.left = Math.max(0, Math.min(w.width - cw, x - cw / 2)) + "px";
    card.style.top = (y - card.offsetHeight - 10 > 0 ? y - card.offsetHeight - 10 : y + c.height + 10) + "px";
  }
  function hide() { if (card) card.hidden = true; }
  if (svg) {
    svg.addEventListener("pointerover", function (e) {
      var n = e.target.closest && e.target.closest(".n, .sn");
      if (n && e.pointerType !== "touch") show(n);
    });
    svg.addEventListener("pointerout", function (e) {
      var n = e.target.closest && e.target.closest(".n, .sn");
      if (n && !(e.relatedTarget && n.contains(e.relatedTarget))) hide();
    });
  }
  var first = document.querySelector(".sector.open");
  if (location.hash.indexOf("#s-") === 0) pick(location.hash.slice(3), false);
  else if (first) { pick(first.id.slice(2), false); open(null, true); }
  var map = root.querySelector(".mapbox");
  if (map && window.innerWidth < 1100) map.removeAttribute("open");
})();
