/* MassRelay site: the public registry page. One read of GET /registry (anonymous JSON); cards are built with textContent only. */
(function () {
  var root = document.getElementById("registry");
  if (!root) return;
  var api = (root.getAttribute("data-api") || "") + "/registry";
  var list = document.getElementById("reg-list"), status = document.getElementById("reg-status");
  var more = document.getElementById("reg-more"), box = document.getElementById("reg-q");
  var tabs = root.querySelectorAll("[data-kind]");
  root.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); });
  var kind = "", page = 1, timer = null, seq = 0;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function card(c) {
    var a = el("a", "card");
    a.href = /^https:\/\//.test(c.url) ? c.url : "#";
    a.appendChild(el("span", "tag", c.kind));
    a.appendChild(el("h3", "", c.name));
    if (c.summary) a.appendChild(el("p", "", c.summary));
    if (c.owner) a.appendChild(el("p", "reg-owner", "By " + c.owner.name));
    var n = c.counts || {}, bits = [];
    if (n.outcomes) bits.push(n.outcomes + " public outcomes");
    if (n.offers) bits.push(n.offers + " offers");
    if (bits.length) a.appendChild(el("p", "reg-counts", bits.join(" / ")));
    return a;
  }
  function load(append) {
    var mine = ++seq, u = api + "?page=" + page;
    if (kind) u += "&kind=" + encodeURIComponent(kind);
    if (box.value.trim()) u += "&q=" + encodeURIComponent(box.value.trim());
    fetch(u, { headers: { Accept: "application/json" } }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (d) {
      if (mine !== seq) return;
      if (!append) list.textContent = "";
      d.items.forEach(function (c) { list.appendChild(card(c)); });
      tabs.forEach(function (t) {
        var k = t.getAttribute("data-kind"), n = k && d.counts ? d.counts[k] : null;
        t.setAttribute("aria-selected", String(k === kind));
        t.textContent = t.getAttribute("data-label") + (n === null || n === undefined ? "" : " " + n);
      });
      more.hidden = !d.hasMore;
      status.textContent = d.note || (d.total ? d.total + " listed." : "Nothing is listed here yet.");
    }).catch(function () {
      if (mine === seq) status.textContent = "The registry could not be read. Try again in a minute.";
    });
  }
  function reset() { page = 1; load(false); }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { kind = t.getAttribute("data-kind"); reset(); });
  });
  box.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(reset, 250); });
  more.addEventListener("click", function () { page += 1; load(true); });
  reset();
})();
