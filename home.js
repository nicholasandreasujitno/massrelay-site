/* MKT-7: the request player, the waiting-list form, the relay. Hides, reveals, moves; no network, no storage. */
(function () {
  var d = document, still = window.matchMedia("(prefers-reduced-motion: reduce)").matches, timers = [];
  d.documentElement.classList.add("js");
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function later(fn, ms) { timers.push(setTimeout(fn, still ? 0 : ms)); }

  var player = $("#player");
  if (player) {
    var chips = $(".chips", player), scns = $$(".scn", player);
    chips.hidden = false;
    function play(id) {
      timers.forEach(clearTimeout); timers = [];
      $$("button", chips).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-id") === id ? "true" : "false"); });
      scns.forEach(function (s) {
        var on = s.getAttribute("data-id") === id;
        s.hidden = !on; s.open = true;
        if (!on) return;
        var ask = $(".ask", s), full = ask.getAttribute("data-full") || ask.textContent, steps = $$(".psteps li", s);
        var res = $(".result", s), say = $(".say", s), rc = $(".rcpt", s);
        ask.setAttribute("data-full", full);
        steps.forEach(function (li) { li.classList.remove("in"); });
        res.classList.remove("in"); rc.hidden = true; say.hidden = false;
        if (still) { ask.textContent = full; steps.forEach(function (li) { li.classList.add("in"); }); res.classList.add("in"); return; }
        var per = Math.min(25, 600 / full.length), n = 0;
        ask.textContent = "";
        (function type() { ask.textContent = full.slice(0, ++n); if (n < full.length) timers.push(setTimeout(type, per)); })();
        var t0 = Math.min(600, full.length * per) + 200;
        steps.forEach(function (li, i) { later(function () { li.classList.add("in"); }, t0 + i * 400); });
        later(function () { res.classList.add("in"); }, t0 + steps.length * 400);
      });
    }
    scns.forEach(function (s) {
      $(".say", s).addEventListener("click", function () { $(".rcpt", s).hidden = false; this.hidden = true; });
    });
    chips.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) play(b.getAttribute("data-id")); });
    $$("[data-play]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); player.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" }); play(scns[0].getAttribute("data-id")); });
    });
    play(scns[0].getAttribute("data-id"));
  }

  // Waiting list: role preset; the form composes a mail and echoes it.
  var form = $("#join-form");
  $$("[data-role]").forEach(function (a) {
    a.addEventListener("click", function () { var r = form && form.elements.role; if (r) r.value = a.getAttribute("data-role"); });
  });
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, body = "City: " + f.city.value + "\nI want to: " + f.role.value + "\nFirst need: " + f.need.value;
    var echo = $(".echo"); echo.textContent = body; echo.hidden = false;
    location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(form.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
  });

  // Relay: the satchel moves only on screen and when motion is allowed.
  var relay = $("[data-ill=\"banner-relay\"]"), go = $("#relay-go");
  if (relay && go && !still && "IntersectionObserver" in window && go.beginElement) {
    var started = false;
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !started) { go.beginElement(); started = true; }
      if (relay.pauseAnimations) vis ? relay.unpauseAnimations() : relay.pauseAnimations();
    }).observe(relay);
  }

  // Sections rise once reached; anything above the fold counts as reached (no section stays faded).
  if (!still) {
    var rest = $$("main > section:not(.h-hero)"), queued = false;
    rest.forEach(function (s) { s.classList.add("rise"); });
    function check() {
      queued = false;
      rest = rest.filter(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.92) { s.classList.add("in"); return false; } return true; });
      if (!rest.length) removeEventListener("scroll", onScroll);
    }
    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(check); } }
    addEventListener("scroll", onScroll, { passive: true }); check();
  }
})();
