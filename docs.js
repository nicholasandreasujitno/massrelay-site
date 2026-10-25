// docs.js — MKT-15: the docs shell's small behaviours. Offline, no library; every page reads fully without it.
(() => {
  // Copy buttons on every code panel.
  document.querySelectorAll('.code .copy').forEach((b) => b.addEventListener('click', () => {
    const code = b.closest('.code-p').querySelector('code').textContent;
    const done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, () => {}); else done();
  }));
  // Language tabs: one panel shows; the choice is remembered for the next group and the next page.
  let pref = null;
  try { pref = localStorage.getItem('docs-lang'); } catch (e) {}
  const show = (g, i) => {
    g.querySelectorAll('.code-tabs button').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.i === String(i))));
    g.querySelectorAll('.code-p').forEach((p) => { p.hidden = p.dataset.i !== String(i); });
  };
  document.querySelectorAll('.code.tabs').forEach((g) => {
    g.classList.add('js');
    const tabs = [...g.querySelectorAll('.code-tabs button')];
    const want = tabs.find((t) => t.textContent === pref);
    show(g, want ? want.dataset.i : 0);
    tabs.forEach((t) => t.addEventListener('click', () => {
      pref = t.textContent;
      try { localStorage.setItem('docs-lang', pref); } catch (e) {}
      document.querySelectorAll('.code.tabs').forEach((h) => {
        const m = [...h.querySelectorAll('.code-tabs button')].find((x) => x.textContent === pref);
        if (m) show(h, m.dataset.i);
      });
    }));
  });
  // Search: the index is fetched on first focus and filtered as you type.
  const q = document.getElementById('docsq'), out = document.getElementById('docs-results');
  if (!q || !out) return;
  let idx = null;
  const load = () => idx || (idx = fetch('/docs/search.json').then((r) => r.json()).catch(() => []));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  q.addEventListener('focus', load);
  q.addEventListener('input', async () => {
    const term = q.value.trim().toLowerCase();
    if (term.length < 2) { out.hidden = true; out.innerHTML = ''; return; }
    const rows = (await load()).map((e) => {
      const inT = e.t.toLowerCase().includes(term), inH = e.h.find((h) => h.toLowerCase().includes(term)), inX = e.x.toLowerCase().includes(term);
      return { e, s: (inT ? 3 : 0) + (inH ? 2 : 0) + (inX ? 1 : 0), h: inH };
    }).filter((r) => r.s).sort((a, b) => b.s - a.s).slice(0, 8);
    out.innerHTML = rows.length ? rows.map((r) => `<li><a href="${r.e.u}">${esc(r.e.t)}${r.h ? `<small>${esc(r.h)}</small>` : ''}</a></li>`).join('') : '<li class="none">No match</li>';
    out.hidden = false;
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && document.activeElement !== q) { e.preventDefault(); q.focus(); }
  });
})();
