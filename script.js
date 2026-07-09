const COLORS = {
  void: '#05060f',
  gold: '#ffd866',
  cyan: '#43e8e0',
  pink: '#ff5d8f',
  dim: '#2a2f5c'
};

function bresenhamCells(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const cells = [];
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    cells.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return cells;
}

function drawPixelLine(ctx, x0, y0, x1, y1, step, color) {
  const cells = bresenhamCells(x0 / step, y0 / step, x1 / step, y1 / step);
  ctx.fillStyle = color;
  cells.forEach(([cx, cy]) => {
    ctx.fillRect(cx * step, cy * step, step, step);
  });
}

function drawPixelStar(ctx, x, y, size, color, glow) {
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 2.2;
  } else {
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.shadowBlur = 0;
}

(function backgroundField() {
  const canvas = document.getElementById('bg-stars');
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], shootingStar = null;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.floor((w * h) / 6000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: [2, 2, 2, 3, 4][Math.floor(Math.random() * 5)],
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.2,
      color: Math.random() < 0.12
        ? (Math.random() < 0.5 ? COLORS.pink : COLORS.cyan)
        : (Math.random() < 0.3 ? COLORS.gold : '#e7e6f2')
    }));
  }

  function maybeSpawnShootingStar() {
    if (!shootingStar && Math.random() < 0.004) {
      const y0 = Math.random() * h * 0.5;
      shootingStar = { x: -20, y: y0, len: 0, maxLen: 90, vx: 9 + Math.random() * 6 };
    }
  }

  let t = 0;
  function frame() {
    t += 0.02;
    ctx.fillStyle = COLORS.void;
    ctx.fillRect(0, 0, w, h);

    stars.forEach(s => {
      const twinkle = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
      ctx.globalAlpha = twinkle;
      drawPixelStar(ctx, s.x, s.y, s.size, s.color, s.size >= 3);
    });
    ctx.globalAlpha = 1;

    maybeSpawnShootingStar();
    if (shootingStar) {
      const ss = shootingStar;
      ss.x += ss.vx;
      ss.len = Math.min(ss.maxLen, ss.len + ss.vx);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.len, ss.y - ss.len * 0.35);
      ctx.stroke();
      if (ss.x - ss.len > w + 20 || ss.x > w + 40) shootingStar = null;
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  frame();
})();

const CONSTELLATIONS = [
  {
    name: 'CRUZEIRO DO SUL',
    desc: 'Quatro estrelas guia. Aponta o sul para quem sabe olhar.',
    grid: [20, 14],
    points: [[10, 1], [10, 12], [4, 6], [16, 6], [12, 4]],
    edges: [[0, 1], [2, 3]]
  },
  {
    name: 'ÓRION',
    desc: 'O caçador. Três estrelas no cinto, uma espada de pixels.',
    grid: [20, 14],
    points: [[4, 1], [16, 1], [7, 7], [10, 7], [13, 7], [5, 13], [15, 13]],
    edges: [[0, 2], [2, 3], [3, 4], [4, 1], [2, 5], [4, 6]]
  },
  {
    name: 'URSA MAIOR',
    desc: 'A concha eterna. Sete estrelas que nunca se põem.',
    grid: [20, 14],
    points: [[1, 10], [5, 12], [9, 10], [12, 8], [12, 3], [16, 2], [19, 5]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]
  },
  {
    name: 'CASSIOPEIA',
    desc: 'O W no céu. Uma rainha sentada de cabeça para baixo.',
    grid: [20, 14],
    points: [[1, 9], [6, 2], [10, 10], [14, 2], [19, 9]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    name: 'ESCORPIÃO',
    desc: 'Cauda curva, ferrão pronto. A caçadora de Órion.',
    grid: [20, 14],
    points: [[2, 2], [4, 6], [7, 5], [9, 7], [11, 9], [13, 11], [15, 10], [17, 7], [15, 4]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
  }
];

function renderConstellation(canvas, cons, highlight) {
  const ctx = canvas.getContext('2d');
  const [gw, gh] = cons.grid;
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, cw, ch);

  const step = Math.max(2, Math.floor(Math.min(cw / gw, ch / gh) / 3));
  const cellW = cw / gw, cellH = ch / gh;
  const px = ([x, y]) => [x * cellW, y * cellH];

  const lineColor = highlight ? COLORS.cyan : '#2f356b';
  cons.edges.forEach(([a, b]) => {
    const [x0, y0] = px(cons.points[a]);
    const [x1, y1] = px(cons.points[b]);
    drawPixelLine(ctx, x0, y0, x1, y1, step, lineColor);
  });

  cons.points.forEach(p => {
    const [x, y] = px(p);
    drawPixelStar(ctx, x, y, step * 1.8, COLORS.gold, highlight);
  });
}

function buildCatalog() {
  const wrap = document.getElementById('constellation-grid');
  CONSTELLATIONS.forEach(cons => {
    const card = document.createElement('article');
    card.className = 'card pixel-border';

    const canvas = document.createElement('canvas');
    const name = document.createElement('h3');
    name.className = 'card__name';
    name.textContent = cons.name;
    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = cons.desc;

    card.appendChild(canvas);
    card.appendChild(name);
    card.appendChild(desc);
    wrap.appendChild(card);

    const draw = (hl) => renderConstellation(canvas, cons, hl);
    draw(false);
    card.addEventListener('mouseenter', () => draw(true));
    card.addEventListener('mouseleave', () => draw(false));
    window.addEventListener('resize', () => draw(false));
  });
}
buildCatalog();

const STORAGE_KEY = 'cosmospix-constellations';

function loadSavedConstellations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function persistSavedConstellations(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Não foi possível salvar no localStorage:', e);
  }
}

function renderGallery() {
  const wrap = document.getElementById('my-constellation-grid');
  const emptyMsg = document.getElementById('gallery-empty');
  const saved = loadSavedConstellations();
  wrap.innerHTML = '';
  emptyMsg.style.display = saved.length ? 'none' : 'block';

  saved.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card pixel-border';

    const delBtn = document.createElement('button');
    delBtn.className = 'card__delete';
    delBtn.textContent = '×';
    delBtn.title = 'Remover esta constelação';
    delBtn.setAttribute('aria-label', 'Remover ' + item.name);
    delBtn.addEventListener('click', () => {
      const remaining = loadSavedConstellations().filter(c => c.id !== item.id);
      persistSavedConstellations(remaining);
      renderGallery();
    });

    const canvas = document.createElement('canvas');
    const name = document.createElement('h3');
    name.className = 'card__name';
    name.textContent = item.name;
    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = `${item.points.length} estrelas · ${item.edges.length} ligações`;

    card.appendChild(delBtn);
    card.appendChild(canvas);
    card.appendChild(name);
    card.appendChild(desc);
    wrap.appendChild(card);

    const draw = (hl) => renderConstellation(canvas, item, hl);
    draw(false);
    card.addEventListener('mouseenter', () => draw(true));
    card.addEventListener('mouseleave', () => draw(false));
    window.addEventListener('resize', () => draw(false));
  });
}
renderGallery();

(function creator() {
  const canvas = document.getElementById('creator-canvas');
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('creator-hint');
  const nameInput = document.getElementById('const-name');
  const btnUndo = document.getElementById('btn-undo');
  const btnRandom = document.getElementById('btn-random');
  const btnClear = document.getElementById('btn-clear');
  const btnSave = document.getElementById('btn-save');

  const COLS = 28, ROWS = 16;
  let stars = [];
  let edges = [];
  let selected = null;
  let history = [];

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function cellSize() {
    return [canvas.clientWidth / COLS, canvas.clientHeight / ROWS];
  }

  function toPixel(star) {
    const [cw, ch] = cellSize();
    return [star.x * cw + cw / 2, star.y * ch + ch / 2];
  }

  function nearestStar(px, py, maxDist) {
    let best = null, bestD = Infinity;
    stars.forEach(s => {
      const [x, y] = toPixel(s);
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) { bestD = d; best = s; }
    });
    return bestD <= maxDist ? best : null;
  }

  function render() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    ctx.fillStyle = COLORS.void;
    ctx.fillRect(0, 0, cw, ch);

    const [gw, gh] = cellSize();
    ctx.fillStyle = 'rgba(139,143,184,0.18)';
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * gw + gw / 2 - 1, y * gh + gh / 2 - 1, 2, 2);
      }
    }

    const step = Math.max(3, Math.floor(Math.min(gw, gh) / 3));
    edges.forEach(e => {
      const [x0, y0] = toPixel(e.a);
      const [x1, y1] = toPixel(e.b);
      drawPixelLine(ctx, x0, y0, x1, y1, step, COLORS.pink);
    });

    stars.forEach(s => {
      const [x, y] = toPixel(s);
      const isSelected = s === selected;
      drawPixelStar(ctx, x, y, step * 2.2, isSelected ? COLORS.cyan : COLORS.gold, true);
    });

    hint.textContent = `estrelas: ${stars.length}  |  ligações: ${edges.length}`;
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const [cw, ch] = cellSize();
    const maxDist = Math.min(cw, ch) * 0.6;

    const hit = nearestStar(px, py, maxDist);

    if (hit) {
      if (selected && selected !== hit) {
        const already = edges.some(ed => (ed.a === selected && ed.b === hit) || (ed.a === hit && ed.b === selected));
        if (!already) {
          const edge = { a: selected, b: hit };
          edges.push(edge);
          history.push({ type: 'edge', edge });
        }
        selected = null;
      } else if (selected === hit) {
        selected = null;
      } else {
        selected = hit;
      }
    } else {
      const gx = Math.floor(px / cw), gy = Math.floor(py / ch);
      const star = { x: gx, y: gy };
      stars.push(star);
      history.push({ type: 'star', star });
      selected = star;
    }
    render();
  });

  btnUndo.addEventListener('click', () => {
    const action = history.pop();
    if (!action) return;
    if (action.type === 'edge') {
      edges = edges.filter(e => e !== action.edge);
    } else if (action.type === 'star') {
      stars = stars.filter(s => s !== action.star);
      edges = edges.filter(e => e.a !== action.star && e.b !== action.star);
      if (selected === action.star) selected = null;
    }
    render();
  });

  btnClear.addEventListener('click', () => {
    stars = []; edges = []; history = []; selected = null;
    nameInput.value = '';
    render();
  });

  const RANDOM_NAMES = [
    'GATO DE BOLSO', 'RUÍDO CÓSMICO', 'FAROL PERDIDO', 'BYTE ESTELAR',
    'SETA DO NORTE', 'ECO DE NEBULOSA', 'FRAGMENTO 8-BIT', 'RASTRO SILENCIOSO'
  ];

  btnRandom.addEventListener('click', () => {
    stars = []; edges = []; history = []; selected = null;
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const star = {
        x: Math.floor(Math.random() * (COLS - 2)) + 1,
        y: Math.floor(Math.random() * (ROWS - 2)) + 1
      };
      stars.push(star);
      if (i > 0) edges.push({ a: stars[i - 1], b: star });
    }
    nameInput.value = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    render();
  });

  btnSave.addEventListener('click', () => {
    if (stars.length < 2) {
      hint.textContent = 'adicione ao menos 2 estrelas antes de salvar';
      return;
    }
    const name = nameInput.value.trim() || 'CONSTELAÇÃO SEM NOME';
    const points = stars.map(s => [s.x, s.y]);
    const edgesIdx = edges.map(e => [stars.indexOf(e.a), stars.indexOf(e.b)]);

    const saved = loadSavedConstellations();
    saved.push({
      id: Date.now(),
      name,
      grid: [COLS, ROWS],
      points,
      edges: edgesIdx
    });
    persistSavedConstellations(saved);
    renderGallery();

    hint.textContent = `"${name}" adicionada à galeria!`;
    document.getElementById('galeria').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
})();