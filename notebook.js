(() => {
  const element = document.getElementById('note');
  const text = document.getElementById('noteTxt');
  const toggle = document.getElementById('notesBtn');
  const minimize = document.getElementById('noteMin');
  const bar = element.querySelector('.note-bar');
  const viewport = document.getElementById('noteViewport');
  const cards = document.getElementById('noteCards');
  const lines = document.getElementById('noteLines');
  const status = document.getElementById('noteStatus');
  const retry = document.getElementById('noteRetry');
  const add = document.getElementById('noteAdd');
  const connect = document.getElementById('noteConnect');
  const remove = document.getElementById('noteDelete');
  const addText = document.getElementById('noteAddText');
  const brush = document.getElementById('noteBrush');
  const brushColor = document.getElementById('noteBrushColor');
  const brushSize = document.getElementById('noteBrushSize');
  const drawings = document.getElementById('noteDrawings');
  const files = document.getElementById('noteFiles');
  const boardTab = document.getElementById('noteBoardTab');
  const textTab = document.getElementById('noteTextTab');
  const hint = document.getElementById('noteHint');
  const empty = document.getElementById('noteEmpty');
  const width = 2400, height = 1600;
  let legacy = {};
  try { legacy = JSON.parse(localStorage.getItem('coc7-notas-v1') || '{}') || {}; } catch {}
  text.value = typeof legacy.t === 'string' ? legacy.t.slice(0, 100000) : '';
  const windowState = { x: null, y: null, w: 760, h: 540, open: legacy.open !== false, min: innerWidth < 640 };
  let content = { text: '', images: [], texts: [], strokes: [], connections: [] };
  let brushing = false, drawingGesture = null;
  let ready = false, uploading = false, saving = false, connecting = false;
  let source = null, selection = null, gesture = null, windowGesture = null;
  let revision = 0, savedRevision = 0, timer = 0;
  let remoteImages = new Set();

  function message(label, error = false) {
    status.textContent = label;
    status.dataset.error = String(error);
  }

  async function request(path, options = {}) {
    const response = await fetch(`/api/notebook${path}`, { ...options, credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível guardar as notas.');
    return data;
  }

  function controls() {
    add.disabled = !ready || uploading;
    addText.disabled = !ready;
    brush.disabled = !ready;
    brushColor.disabled = !ready;
    brushSize.disabled = !ready;
    brush.setAttribute('aria-pressed', String(brushing));
    connect.disabled = !ready || content.images.length + content.texts.length < 2;
    connect.setAttribute('aria-pressed', String(connecting));
    remove.disabled = !ready || !selection;
    element.classList.toggle('connecting', connecting);
    element.classList.toggle('brushing', brushing);
    hint.textContent = brushing ? 'Desenhe no quadro · Esc sai do pincel' : connecting ? (source ? 'Escolha outro texto ou imagem · Esc cancela' : 'Escolha dois textos ou imagens para interligar · Esc cancela') : 'Arraste para mover · selecione textos ou traços para excluir';
    empty.hidden = content.images.length + content.texts.length + content.strokes.length > 0;
    for (const card of cards.children) {
      card.classList.toggle('selected', selection?.type === card.dataset.type && selection.id === card.dataset.id);
      card.classList.toggle('connect-source', source === card.dataset.id);
      card.querySelector('input,textarea').readOnly = connecting;
    }
  }

  function changed() {
    revision++;
    message('Alterações pendentes…');
    retry.hidden = true;
    clearTimeout(timer);
    timer = setTimeout(save, 650);
    controls();
  }

  async function save() {
    clearTimeout(timer);
    if (!ready || saving || drawingGesture || revision === savedRevision) return;
    saving = true;
    const currentRevision = revision;
    const snapshot = JSON.parse(JSON.stringify(content));
    message('Salvando…');
    try {
      await request('', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot) });
      savedRevision = currentRevision;
      const nextImages = new Set(snapshot.images.map(image => image.id));
      for (const id of remoteImages) {
        if (!nextImages.has(id)) request(`/images/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      remoteImages = nextImages;
      retry.hidden = true;
      message(revision === savedRevision ? 'Salvo automaticamente' : 'Alterações pendentes…');
    } catch (error) {
      message(`${error.message} Suas alterações continuam abertas.`, true);
      retry.hidden = false;
    } finally {
      saving = false;
      if (revision !== savedRevision && retry.hidden) timer = setTimeout(save, 150);
    }
  }

  async function load() {
    retry.hidden = true;
    message('Carregando notas…');
    try {
      const result = await request('');
      content = result.content || { text: typeof legacy.t === 'string' ? legacy.t.slice(0, 100000) : '', images: [], connections: [] };
      content.texts ||= [];
      content.strokes ||= [];
      text.value = content.text;
      text.readOnly = false;
      ready = true;
      remoteImages = new Set(content.images.map(image => image.id));
      render();
      message('Salvo automaticamente');
      if (!result.content && content.text) changed();
    } catch (error) {
      message(error.message, true);
      retry.hidden = false;
    }
    controls();
  }

  function setTab(board) {
    boardTab.setAttribute('aria-selected', String(board));
    textTab.setAttribute('aria-selected', String(!board));
    boardTab.tabIndex = board ? 0 : -1;
    textTab.tabIndex = board ? -1 : 0;
    document.getElementById('noteBoardPanel').hidden = !board;
    document.getElementById('noteTextPanel').hidden = board;
    element.querySelector('.note-actions').hidden = !board;
    if (!board) { finishDrawing(); brushing = false; stopConnecting(); }
  }

  function applyWindow() {
    const currentWidth = Math.min(windowState.w, innerWidth - 16);
    const currentHeight = windowState.min ? 40 : Math.min(windowState.h, innerHeight - 16);
    element.hidden = !windowState.open;
    element.classList.toggle('min', windowState.min);
    element.style.width = `${currentWidth}px`;
    element.style.height = windowState.min ? '' : `${currentHeight}px`;
    if (windowState.x === null) {
      windowState.x = Math.max(8, innerWidth - currentWidth - 20);
      windowState.y = Math.max(8, innerHeight - currentHeight - 20);
    }
    windowState.x = Math.max(0, Math.min(windowState.x, innerWidth - currentWidth));
    windowState.y = Math.max(0, Math.min(windowState.y, innerHeight - currentHeight));
    element.style.left = `${windowState.x}px`;
    element.style.top = `${windowState.y}px`;
    minimize.textContent = windowState.min ? '▢' : '–';
    minimize.title = windowState.min ? 'Expandir' : 'Minimizar';
    minimize.setAttribute('aria-label', `${minimize.title} bloco de notas`);
    toggle.classList.toggle('on', windowState.open);
    toggle.setAttribute('aria-pressed', String(windowState.open));
  }

  function position(card, image) {
    card.style.transform = `translate(${image.x}px, ${image.y}px)`;
    card.style.width = `${image.w}px`;
    card.style.height = `${image.h}px`;
  }

  function strokePath(stroke) {
    const [first, ...rest] = stroke.points;
    const start = `M ${first.x} ${first.y}`;
    return rest.length ? `${start} ${rest.map(point => `L ${point.x} ${point.y}`).join(' ')}` : `${start} L ${first.x === width ? first.x - 0.01 : first.x + 0.01} ${first.y}`;
  }

  function drawStrokes() {
    drawings.replaceChildren();
    for (const stroke of content.strokes) {
      for (const hit of [false, true]) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', strokePath(stroke));
        path.setAttribute('class', hit ? 'note-stroke-hit' : `note-stroke${selection?.type === 'stroke' && selection.id === stroke.id ? ' selected' : ''}`);
        path.setAttribute('stroke', stroke.color);
        path.setAttribute('stroke-width', hit ? Math.max(18, stroke.size + 10) : stroke.size);
        path.dataset.id = stroke.id;
        if (hit) {
          path.setAttribute('tabindex', '0');
          path.setAttribute('role', 'button');
          path.setAttribute('aria-label', 'Selecionar desenho para excluir');
          const select = () => {
            if (brushing) return;
            selection = { type: 'stroke', id: stroke.id }; source = null;
            controls(); drawLines(); drawStrokes(); remove.focus({ preventScroll: true });
          };
          path.addEventListener('click', select);
          path.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
          });
        }
        drawings.append(path);
      }
    }
  }

  function drawingPoint(event) {
    const rect = drawings.getBoundingClientRect();
    return { x: Math.round(Math.max(0, Math.min(width, event.clientX - rect.left)) * 10) / 10, y: Math.round(Math.max(0, Math.min(height, event.clientY - rect.top)) * 10) / 10 };
  }

  function finishDrawing(event) {
    if (!drawingGesture || (event && event.pointerId !== drawingGesture.id)) return;
    const pointerId = drawingGesture.id;
    drawingGesture = null;
    if (drawings.hasPointerCapture(pointerId)) drawings.releasePointerCapture(pointerId);
    drawStrokes(); changed();
  }

  drawings.addEventListener('pointerdown', event => {
    if (!ready || !brushing || drawingGesture || event.button !== 0) return;
    const pointCount = content.strokes.reduce((total, stroke) => total + stroke.points.length, 0);
    if (content.strokes.length >= 300 || pointCount >= 30000) { message('Limite de desenhos atingido. Exclua traços para continuar.', true); return; }
    event.preventDefault();
    const stroke = { id: crypto.randomUUID(), color: brushColor.value, size: Number(brushSize.value), points: [drawingPoint(event)] };
    content.strokes.push(stroke);
    selection = { type: 'stroke', id: stroke.id };
    drawingGesture = { id: event.pointerId, stroke, pointCount: pointCount + 1 };
    drawings.setPointerCapture(event.pointerId);
    drawLines(); drawStrokes(); controls();
  });
  drawings.addEventListener('pointermove', event => {
    if (!drawingGesture || drawingGesture.id !== event.pointerId) return;
    event.preventDefault();
    const point = drawingPoint(event);
    const previous = drawingGesture.stroke.points.at(-1);
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return;
    drawingGesture.stroke.points.push(point);
    drawingGesture.pointCount++;
    const pathData = strokePath(drawingGesture.stroke);
    for (const path of drawings.children) {
      if (path.dataset.id === drawingGesture.stroke.id) path.setAttribute('d', pathData);
    }
    if (drawingGesture.stroke.points.length >= 2000 || drawingGesture.pointCount >= 30000) {
      finishDrawing(); message('Limite de pontos atingido neste desenho.', true);
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) drawings.addEventListener(type, finishDrawing);

  function drawLines() {
    lines.replaceChildren();
    const byId = new Map([...content.images, ...content.texts].map(image => [image.id, image]));
    for (const connection of content.connections) {
      const from = byId.get(connection.from), to = byId.get(connection.to);
      if (!from || !to) continue;
      const dx = to.x + to.w / 2 - from.x - from.w / 2;
      const dy = to.y + to.h / 2 - from.y - from.h / 2;
      const edge = image => Math.min((image.w / 2) / (Math.abs(dx) || 1), (image.h / 2) / (Math.abs(dy) || 1));
      const start = edge(from), end = edge(to);
      const points = { x1: from.x + from.w / 2 + dx * start, y1: from.y + from.h / 2 + dy * start, x2: to.x + to.w / 2 - dx * end, y2: to.y + to.h / 2 - dy * end };
      for (const hit of [false, true]) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        for (const [key, value] of Object.entries(points)) line.setAttribute(key, value);
        line.setAttribute('class', hit ? 'evidence-line-hit' : `evidence-line${selection?.type === 'connection' && selection.id === connection.id ? ' selected' : ''}`);
        if (hit) {
          line.setAttribute('tabindex', '0');
          line.setAttribute('role', 'button');
          const label = evidence => evidence.title || evidence.text?.slice(0, 160) || 'Texto sem conteúdo';
          line.setAttribute('aria-label', `Selecionar conexão: ${label(from)} e ${label(to)}`);
          const select = () => { selection = { type: 'connection', id: connection.id }; source = null; controls(); drawLines(); drawStrokes(); };
          line.addEventListener('click', select);
          line.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); remove.focus(); }
          });
        }
        lines.append(line);
      }
    }
  }

  function render() {
    const existing = new Map(Array.from(cards.children, card => [card.dataset.id, card]));
    const activeIds = new Set([...content.images, ...content.texts].map(image => image.id));
    for (const card of Array.from(cards.children)) {
      if (!activeIds.has(card.dataset.id)) card.remove();
    }
    for (const image of [...content.images, ...content.texts]) {
      if (existing.has(image.id)) {
        position(existing.get(image.id), image);
        continue;
      }
      const card = document.createElement('div');
      const isText = content.texts.includes(image);
      const type = isText ? 'text' : 'image';
      card.className = isText ? 'evidence evidence-text' : 'evidence';
      card.dataset.id = image.id;
      card.dataset.type = type;
      card.tabIndex = 0;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', isText ? 'Texto no quadro. Arraste a borda ou use as setas para mover; Enter seleciona ou interliga.' : `Pista: ${image.title}. Setas movem; Enter seleciona ou interliga.`);
      const picture = isText ? null : document.createElement('img');
      if (picture) {
        picture.src = `/api/notebook/images/${image.id}`;
        picture.alt = image.title;
        picture.draggable = false;
        picture.addEventListener('error', () => { picture.alt = `Não foi possível carregar: ${image.title}`; });
      }
      const caption = document.createElement(isText ? 'textarea' : 'input');
      caption.className = isText ? 'evidence-body' : 'evidence-title';
      caption.value = isText ? image.text : image.title;
      caption.maxLength = isText ? 4000 : 160;
      caption.placeholder = isText ? 'Escreva sua pista…' : '';
      caption.setAttribute('aria-label', isText ? 'Texto da pista' : 'Legenda da pista');
      caption.addEventListener('focus', () => { selection = { type, id: image.id }; controls(); drawLines(); drawStrokes(); });
      caption.addEventListener('input', () => {
        if (isText) { image.text = caption.value; changed(); return; }
        image.title = caption.value;
        picture.alt = caption.value;
        card.setAttribute('aria-label', `Pista: ${caption.value}. Setas movem; Enter seleciona ou interliga.`);
        changed();
      });
      const resize = document.createElement('button');
      resize.className = 'evidence-resize';
      resize.setAttribute('aria-label', `Redimensionar ${isText ? 'texto' : image.title}. Use as setas ou arraste.`);
      if (!isText) card.append(picture);
      card.append(caption, resize);
      card.addEventListener('pointerdown', event => startGesture(event, image, card));
      card.addEventListener('pointermove', moveGesture);
      card.addEventListener('pointerup', endGesture);
      card.addEventListener('pointercancel', endGesture);
      card.addEventListener('lostpointercapture', endGesture);
      card.addEventListener('keydown', event => {
        if (event.target === caption) return;
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.target === resize) return;
          event.preventDefault(); selectImage(image.id); return;
        }
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        if (!ready) return;
        selection = { type, id: image.id };
        const step = event.shiftKey ? 10 : 2;
        if (event.target === resize) resizeImage(image, image.w + (direction[0] || direction[1]) * step, image.w, image.h);
        else { image.x = Math.max(0, Math.min(width - image.w, image.x + direction[0] * step)); image.y = Math.max(0, Math.min(height - image.h, image.y + direction[1] * step)); }
        position(card, image); drawLines(); drawStrokes(); changed();
      });
      position(card, image);
      cards.append(card);
    }
    drawLines(); drawStrokes(); controls();
  }

  function stopConnecting() { connecting = false; source = null; controls(); }

  function selectImage(id) {
    const type = content.texts.some(note => note.id === id) ? 'text' : 'image';
    selection = { type, id };
    if (connecting) {
      if (!source) source = id;
      else if (source !== id) {
        const exists = content.connections.some(connection => (connection.from === source && connection.to === id) || (connection.to === source && connection.from === id));
        if (exists) message('Estas pistas já estão conectadas.');
        else if (content.connections.length >= 300) message('O quadro comporta até 300 conexões.', true);
        else { content.connections.push({ id: crypto.randomUUID(), from: source, to: id }); changed(); }
        source = null;
      }
    }
    controls(); drawLines(); drawStrokes();
  }

  function startGesture(event, image, card) {
    if (!ready || brushing || event.button !== 0 || (!connecting && event.target.closest('input,textarea'))) return;
    event.preventDefault();
    selectImage(image.id);
    if (connecting) { card.focus({ preventScroll: true }); return; }
    card.setPointerCapture(event.pointerId);
    const resizing = event.target.closest('.evidence-resize');
    (resizing || card).focus({ preventScroll: true });
    gesture = { id: event.pointerId, image, card, resize: !!resizing, mouseX: event.clientX, mouseY: event.clientY, scrollX: viewport.scrollLeft, scrollY: viewport.scrollTop, x: image.x, y: image.y, w: image.w, h: image.h, moved: false };
  }

  function resizeImage(image, nextWidth, originalWidth, originalHeight) {
    const ratio = originalHeight / originalWidth;
    const minimum = Math.max(100, 90 / ratio);
    const maximum = Math.min(600, 700 / ratio, width - image.x, (height - image.y) / ratio);
    image.w = Math.max(minimum, Math.min(maximum, nextWidth));
    image.h = image.w * ratio;
  }

  function moveGesture(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.mouseX + viewport.scrollLeft - gesture.scrollX;
    const dy = event.clientY - gesture.mouseY + viewport.scrollTop - gesture.scrollY;
    if (gesture.resize) resizeImage(gesture.image, gesture.w + dx, gesture.w, gesture.h);
    else {
      gesture.image.x = Math.max(0, Math.min(width - gesture.image.w, gesture.x + dx));
      gesture.image.y = Math.max(0, Math.min(height - gesture.image.h, gesture.y + dy));
    }
    gesture.moved ||= dx !== 0 || dy !== 0;
    position(gesture.card, gesture.image); drawLines();
  }

  function endGesture() {
    if (!gesture) return;
    const moved = gesture.moved;
    gesture = null;
    if (moved) changed();
  }

  function deleteSelection() {
    if (!selection || !ready) return;
    finishDrawing();
    if (selection.type === 'image' || selection.type === 'text') {
      if (selection.type === 'image') content.images = content.images.filter(image => image.id !== selection.id);
      else content.texts = content.texts.filter(note => note.id !== selection.id);
      content.connections = content.connections.filter(connection => connection.from !== selection.id && connection.to !== selection.id);
    } else if (selection.type === 'stroke') content.strokes = content.strokes.filter(stroke => stroke.id !== selection.id);
    else content.connections = content.connections.filter(connection => connection.id !== selection.id);
    selection = null; source = null;
    if (content.images.length + content.texts.length < 2) connecting = false;
    render(); changed(); viewport.focus({ preventScroll: true });
  }

  async function dimensions(file) {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight });
        image.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'));
        image.src = url;
      });
    } finally { URL.revokeObjectURL(url); }
  }

  async function importImages(list, point) {
    if (!ready) { message('Aguarde o carregamento das notas.', true); return; }
    if (uploading) { message('Aguarde o envio das imagens atuais.'); return; }
    if (!list.length) { message('Arraste arquivos de imagem do seu dispositivo.', true); return; }
    uploading = true;
    setTab(true); controls();
    const failures = [];
    let imported = 0;
    for (const file of list) {
      if (content.images.length >= 60) { failures.push('O quadro comporta até 60 imagens.'); break; }
      try {
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) throw new Error('Use PNG, JPEG, GIF ou WebP.');
        if (file.size > 4 * 1024 * 1024) throw new Error('Cada imagem deve ter no máximo 4 MB.');
        message(`Enviando ${file.name || 'imagem'}…`);
        const size = await dimensions(file);
        const result = await request('/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
        const imageWidth = Math.min(280, Math.max(150, size.w));
        const imageHeight = Math.max(120, Math.min(380, imageWidth * size.h / size.w + 42));
        const offset = (imported % 6) * 30;
        const image = {
          id: result.id, title: (file.name || 'Nova pista').replace(/\.[^.]+$/, '').slice(0, 160),
          x: Math.max(0, Math.min(width - imageWidth, (point?.x ?? viewport.scrollLeft + 32) + offset)),
          y: Math.max(0, Math.min(height - imageHeight, (point?.y ?? viewport.scrollTop + 32) + offset)),
          w: imageWidth, h: imageHeight,
        };
        content.images.push(image);
        selection = { type: 'image', id: image.id };
        imported++; render(); changed();
      } catch (error) { failures.push(`${file.name || 'Imagem'}: ${error.message}`); }
    }
    uploading = false; controls();
    await save();
    if (failures.length) message(failures.join(' '), true);
  }

  boardTab.onclick = () => setTab(true);
  textTab.onclick = () => setTab(false);
  for (const tab of [boardTab, textTab]) tab.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const board = event.key === 'Home' || (event.key !== 'End' && tab === textTab);
      setTab(board); (board ? boardTab : textTab).focus();
    }
  });
  text.addEventListener('input', () => { content.text = text.value; changed(); });
  retry.onclick = () => ready ? save() : load();
  add.onclick = () => files.click();
  addText.onclick = () => {
    if (!ready) return;
    if (content.texts.length >= 100) { message('O quadro comporta até 100 textos.', true); return; }
    finishDrawing();
    brushing = false; stopConnecting();
    const note = { id: crypto.randomUUID(), text: '', x: Math.min(width - 260, viewport.scrollLeft + 40), y: Math.min(height - 180, viewport.scrollTop + 40), w: 260, h: 180 };
    content.texts.push(note);
    selection = { type: 'text', id: note.id };
    render(); changed();
    Array.from(cards.children).find(card => card.dataset.id === note.id).querySelector('textarea').focus();
  };
  brush.onclick = () => { finishDrawing(); brushing = !brushing; stopConnecting(); viewport.focus({ preventScroll: true }); };
  files.onchange = () => { importImages(Array.from(files.files)); files.value = ''; };
  connect.onclick = () => { finishDrawing(); brushing = false; connecting = !connecting; source = null; controls(); };
  remove.onclick = deleteSelection;
  viewport.addEventListener('click', event => {
    if (!brushing && (event.target === viewport || event.target.id === 'noteBoard')) { selection = null; source = null; controls(); drawLines(); drawStrokes(); }
  });
  let dragDepth = 0;
  element.addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; viewport.classList.add('drop-target'); });
  element.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
  element.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; viewport.classList.remove('drop-target'); } });
  element.addEventListener('drop', event => {
    event.preventDefault(); dragDepth = 0; viewport.classList.remove('drop-target');
    const rect = viewport.getBoundingClientRect();
    const point = viewport.offsetHeight ? { x: event.clientX - rect.left + viewport.scrollLeft, y: event.clientY - rect.top + viewport.scrollTop } : undefined;
    importImages(Array.from(event.dataTransfer.files), point);
  });
  element.addEventListener('paste', event => {
    const images = Array.from(event.clipboardData?.items || []).filter(item => item.kind === 'file' && item.type.startsWith('image/')).map(item => item.getAsFile()).filter(Boolean);
    if (images.length) { event.preventDefault(); importImages(images); }
  });
  element.addEventListener('keydown', event => {
    if (event.key === 'Escape') { finishDrawing(); brushing = false; stopConnecting(); return; }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !event.target.closest('input,textarea,button')) { event.preventDefault(); deleteSelection(); }
  });
  const toggleMin = () => { windowState.min = !windowState.min; applyWindow(); };
  minimize.onclick = toggleMin;
  bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) toggleMin(); });
  document.getElementById('noteX').onclick = () => { windowState.open = false; applyWindow(); save(); };
  toggle.onclick = () => {
    windowState.open = !windowState.open;
    if (windowState.open) windowState.min = false;
    applyWindow();
    if (windowState.open) (boardTab.getAttribute('aria-selected') === 'true' ? viewport : text).focus();
    else save();
  };
  bar.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button') || document.body.classList.contains('mobile')) return;
    windowGesture = { x: event.clientX - element.offsetLeft, y: event.clientY - element.offsetTop };
    bar.setPointerCapture(event.pointerId); event.preventDefault();
  });
  bar.addEventListener('pointermove', event => {
    if (!windowGesture) return;
    windowState.x = event.clientX - windowGesture.x; windowState.y = event.clientY - windowGesture.y; applyWindow();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) bar.addEventListener(type, () => { windowGesture = null; });
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (!windowState.open || windowState.min || document.body.classList.contains('mobile')) return;
    windowState.w = element.offsetWidth; windowState.h = element.offsetHeight;
  }).observe(element);
  addEventListener('resize', applyWindow);
  addEventListener('beforeunload', event => {
    if (revision !== savedRevision || uploading || drawingGesture) { event.preventDefault(); event.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ready) { finishDrawing(); if (revision !== savedRevision) save(); } });
  applyWindow(); load();
})();
