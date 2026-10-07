(() => {
  const KEY = 'coc7-cemiterio-v1';
  const btn = document.getElementById('cemBtn');
  const note = document.getElementById('note');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  let graves = [];
  try { const d = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(d)) graves = d.filter(g => g && g.id); } catch {}

  const win = { x: null, y: null, w: 500, h: 520, open: false, min: false };
  const el = document.createElement('section');
  el.className = 'cem'; el.id = 'cem'; el.hidden = true;
  el.setAttribute('aria-label', 'Cemitério dos investigadores');
  el.innerHTML = `<header class="cem-bar" title="Arraste para mover · duplo clique para minimizar"><span class="cem-title">⚰ Cemitério dos investigadores</span><button id="cemMin" title="Minimizar" aria-label="Minimizar cemitério">–</button><button id="cemX" title="Fechar (as lápides ficam guardadas)" aria-label="Fechar cemitério">✕</button></header><div class="cem-body" id="cemBody"></div><footer class="cem-foot"><span id="cemHint">Arraste uma ficha até aqui · ou use ⚰ no cabeçalho dela</span><span id="cemStatus" role="status" aria-live="polite"></span></footer>`;
  document.body.appendChild(el);
  const bar = el.querySelector('.cem-bar');
  const body = el.querySelector('#cemBody');
  const minBtn = el.querySelector('#cemMin');
  const status = el.querySelector('#cemStatus');

  /* ---------- salvamento (navegador) ---------- */
  let saveT = 0;
  function save() {
    clearTimeout(saveT);
    try { localStorage.setItem(KEY, JSON.stringify(graves)); status.textContent = ''; status.dataset.error = 'false'; }
    catch { status.textContent = 'Não foi possível salvar neste navegador.'; status.dataset.error = 'true'; }
  }
  const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 250); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  addEventListener('pagehide', save);

  /* ---------- janela ---------- */
  function apply() {
    const w = Math.min(win.w, innerWidth - 16);
    const h = win.min ? 40 : Math.min(win.h, innerHeight - 16);
    el.hidden = !win.open;
    el.classList.toggle('min', win.min);
    el.style.width = `${w}px`;
    el.style.height = win.min ? '' : `${h}px`;
    if (win.x === null) { win.x = Math.max(8, innerWidth - w - 20); win.y = Math.max(8, Math.min(96, innerHeight - h - 8)); }
    win.x = Math.max(0, Math.min(win.x, innerWidth - w));
    win.y = Math.max(0, Math.min(win.y, innerHeight - h));
    el.style.left = `${win.x}px`;
    el.style.top = `${win.y}px`;
    minBtn.textContent = win.min ? '▢' : '–';
    minBtn.title = win.min ? 'Expandir' : 'Minimizar';
    minBtn.setAttribute('aria-label', `${minBtn.title} cemitério`);
    btn.classList.toggle('on', win.open);
    btn.setAttribute('aria-pressed', String(win.open));
  }
  const toggleMin = () => { win.min = !win.min; apply(); };
  minBtn.onclick = toggleMin;
  bar.addEventListener('dblclick', e => { if (!e.target.closest('button')) toggleMin(); });
  el.querySelector('#cemX').onclick = () => { win.open = false; apply(); btn.focus(); };
  btn.onclick = () => { win.open = !win.open; if (win.open) win.min = false; apply(); };

  let wg = null;
  bar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button') || document.body.classList.contains('mobile')) return;
    wg = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop };
    bar.setPointerCapture(e.pointerId); e.preventDefault();
  });
  bar.addEventListener('pointermove', e => { if (wg) { win.x = e.clientX - wg.x; win.y = e.clientY - wg.y; apply(); } });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) bar.addEventListener(t, () => { wg = null; });
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (!win.open || win.min || document.body.classList.contains('mobile')) return;
    win.w = el.offsetWidth; win.h = el.offsetHeight;
  }).observe(el);
  addEventListener('resize', apply);

  /* traz para a frente a janela clicada (entre o cemitério e o bloco de notas) */
  const front = (a, b) => { a.style.zIndex = 5002; if (b) b.style.zIndex = 5000; };
  el.addEventListener('pointerdown', () => front(el, note), true);
  if (note) note.addEventListener('pointerdown', () => { note.style.zIndex = 5002; el.style.zIndex = 5000; }, true);

  /* ---------- lápides ---------- */
  const graveHTML = g => {
    const meta = [g.idade !== '' && g.idade != null ? `${esc(g.idade)} anos` : '', esc(g.occ), g.sec ? `+ ${esc(g.sec)}` : ''].filter(Boolean).join(' · ') || '—';
    const attrs = Object.entries(g.c || {}).map(([k, v]) => `${esc(k)} ${esc(v)}`).join(' · ');
    const d = g.der || {};
    const sk = (g.skills || []).map(([n, v]) => `${esc(n)} ${esc(v)}%`).join(', ');
    return `<article class="grave" data-id="${esc(g.id)}">
  <div class="grave-rip">R.I.P.</div>
  <h4 class="grave-name">${esc(g.nome || 'Sem nome')}</h4>
  <div class="grave-meta">${meta}</div>
  <div class="grave-line"><b>Atributos</b> ${attrs}</div>
  <div class="grave-line"><b>PV</b> ${esc(d.hp)} · <b>Sanidade</b> ${esc(d.san)} · <b>Sorte</b> ${esc(d.luck)}</div>
  ${sk ? `<div class="grave-line"><b>Perícias</b> ${sk}</div>` : ''}
  <label>Causa da morte<input data-f="causa" maxlength="160" value="${esc(g.causa)}" placeholder="Como o investigador morreu…"></label>
  <label>Última frase<textarea data-f="frase" maxlength="300" rows="2" placeholder="“…”">${esc(g.frase)}</textarea></label>
  <div class="grave-actions">${g.ficha ? '<button class="alt" data-act="exhume" title="Devolver a ficha completa para a mesa">Desenterrar</button>' : '<span></span>'}<button class="grave-del" data-act="del" title="Apagar esta lápide">🗑 Apagar</button></div>
</article>`;
  };

  function render() {
    btn.textContent = graves.length ? `⚰ Cemitério · ${graves.length}` : '⚰ Cemitério';
    body.innerHTML = graves.length
      ? `<div class="cem-grid">${graves.map(graveHTML).join('')}</div>`
      : `<div class="cem-empty"><span class="cem-empty-mark" aria-hidden="true">⚰</span><strong>Nenhum investigador enterrado</strong><p>Arraste o cabeçalho de uma ficha até aqui (ou até o botão Cemitério), ou use o ⚰ no cabeçalho dela. Depois é só escrever a causa da morte e a última frase.</p></div>`;
  }

  body.addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const g = graves.find(x => x.id === e.target.closest('.grave')?.dataset.id);
    if (g) { g[f] = e.target.value; saveSoon(); }
  });

  body.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const g = graves.find(x => x.id === b.closest('.grave')?.dataset.id); if (!g) return;
    if (b.dataset.act === 'exhume') {
      if (!g.ficha || typeof window.restoreFicha !== 'function') return;
      window.restoreFicha(JSON.parse(JSON.stringify(g.ficha)));
      graves = graves.filter(x => x !== g); save(); render();
    } else if (b.dataset.act === 'del') {
      if (await confirmDelete(g)) { graves = graves.filter(x => x !== g); save(); render(); }
    }
  });

  function confirmDelete(g) {
    return new Promise(ok => {
      const o = document.createElement('div'), prev = document.activeElement;
      o.className = 'ovl';
      o.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="cemDlgT"><h4 id="cemDlgT">Apagar lápide?</h4><p>A lápide de <strong>${esc(g.nome || 'Sem nome')}</strong> será apagada e isso não dá para desfazer.</p><div class="row"><button class="alt" data-r="0">Cancelar</button><button class="danger" data-r="1">🗑 Apagar</button></div></div>`;
      const key = e => {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        else if (e.key === 'Tab') { const bs = [...o.querySelectorAll('button')], k = bs.indexOf(document.activeElement); e.preventDefault(); bs[(k + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus(); }
      };
      const done = v => { document.removeEventListener('keydown', key, true); o.remove(); if (prev && prev.focus) prev.focus(); ok(v); };
      o.addEventListener('click', e => { const b = e.target.closest('button'); if (b) done(b.dataset.r === '1'); else if (e.target === o) done(false); });
      document.addEventListener('keydown', key, true);
      document.body.appendChild(o); o.querySelector('[data-r="0"]').focus();
    });
  }

  /* ---------- enterrar ---------- */
  function add(p) {
    const skills = Object.entries(p.sk || {}).filter(([n]) => n !== 'Nível de Crédito').sort((a, b) => b[1] - a[1]).slice(0, 5);
    const der = p.der || {};
    graves.unshift({
      id: uid(), nome: p.nome || '', idade: p.idade ?? '', occ: p.occ || '', sec: p.sec || '',
      c: { ...(p.c || {}) }, der: { hp: der.hp, san: der.san, luck: der.luck }, skills,
      causa: '', frase: '', ficha: p /* ficha completa, só para poder desenterrar */
    });
    save();
    win.open = true; win.min = false; apply(); render();
    body.scrollTop = 0;
    const first = body.querySelector('input[data-f="causa"]');
    if (first) first.focus({ preventScroll: true });
  }

  /* ---------- alvo ao arrastar uma ficha ---------- */
  const inside = (node, x, y) => {
    if (!node || node.hidden) return false;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const over = (x, y) => inside(btn, x, y) || (win.open && inside(el, x, y));
  function hover(x, y, active) {
    btn.classList.toggle('cem-ready', !!active);
    btn.classList.toggle('cem-hot', !!active && inside(btn, x, y));
    el.classList.toggle('cem-hot', !!active && win.open && inside(el, x, y));
  }

  window.Cemiterio = { add, over, hover };
  apply(); render();
})();
