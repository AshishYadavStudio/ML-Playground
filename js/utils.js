// ============ Shared utilities: DOM, canvas, datasets, math ============

/** DOM element builder: h('div', {class:'x', onclick:fn}, [children...]) */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2), v);
    } else if (k === 'class') {
      el.className = v;
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

/** Shorthand for a div with innerHTML (for prose blocks). */
export function html(markup) {
  const d = document.createElement('div');
  d.innerHTML = markup;
  return d;
}

/**
 * Create a hi-DPI canvas that fills its container width at a fixed aspect.
 * Returns { canvas, ctx, W, H, onResize } where W/H are CSS-pixel dims.
 * The ctx is pre-scaled so you draw in CSS pixels.
 */
export function makeCanvas(cssHeight = 380) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const state = { canvas, ctx, W: 600, H: cssHeight, resizeHandlers: [] };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, rect.width || canvas.parentElement?.clientWidth || 600);
    const dpr = window.devicePixelRatio || 1;
    state.W = w;
    state.H = cssHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.resizeHandlers.forEach(f => f());
  }
  state.onResize = f => state.resizeHandlers.push(f);

  // Observe container size; defer initial sizing until in DOM.
  const ro = new ResizeObserver(() => resize());
  requestAnimationFrame(() => {
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();
  });
  return state;
}

/** Pointer position in CSS pixels relative to canvas. */
export function pointerPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** Build a demo panel: title, hint, then content nodes. */
export function demoPanel(title, hint, ...nodes) {
  return h('div', { class: 'demo' }, [
    h('div', { class: 'demo-title' }, title),
    h('div', { class: 'demo-hint' }, hint),
    ...nodes,
  ]);
}

/** Labeled slider control. Returns {el, input, set} and calls onInput(value). */
export function slider(label, { min, max, step = 1, value, fmt = v => String(v) }, onInput) {
  const valSpan = h('span', { class: 'val' }, fmt(value));
  const input = h('input', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    valSpan.textContent = fmt(v);
    onInput(v);
  });
  const el = h('div', { class: 'control' }, [h('label', {}, label), input, valSpan]);
  return {
    el, input,
    set(v) { input.value = v; valSpan.textContent = fmt(v); },
    get value() { return parseFloat(input.value); },
  };
}

export function button(label, onClick, secondary = false) {
  return h('button', { class: 'btn' + (secondary ? ' secondary' : ''), onclick: onClick }, label);
}

export function selectBox(label, options, onChange, initial) {
  const sel = h('select', {}, options.map(o =>
    h('option', { value: o.value ?? o, ...(String(o.value ?? o) === String(initial) ? { selected: '' } : {}) }, o.label ?? o)
  ));
  sel.addEventListener('change', () => onChange(sel.value));
  return { el: h('div', { class: 'control' }, [h('label', {}, label), sel]), sel };
}

/** Stat chips row. Returns {el, set(name, value)}. */
export function statRow(names) {
  const map = {};
  const el = h('div', { class: 'stat-row' }, names.map(n => {
    const b = h('b', {}, '—');
    map[n] = b;
    return h('div', { class: 'stat' }, [n, b]);
  }));
  return { el, set(name, v) { map[name].textContent = v; } };
}

export function legend(items) {
  return h('div', { class: 'legend' }, items.map(([color, label]) =>
    h('span', { class: 'chip' }, [h('span', { class: 'dot', style: { background: color } }), label])
  ));
}

// ============ Random & math helpers ============

let _seed = 42;
export function seed(s) { _seed = s; }
export function rand() {
  // Mulberry32 — deterministic datasets so lessons look consistent.
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function randn() {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// ============ Toy 2-D datasets (x, y in [-1, 1], label 0/1) ============

export function dataMoons(n = 120, noise = 0.08) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI;
    if (i % 2 === 0) {
      pts.push({ x: Math.cos(a) * 0.7 - 0.15 + randn() * noise, y: Math.sin(a) * 0.7 - 0.25 + randn() * noise, label: 0 });
    } else {
      pts.push({ x: 0.15 - Math.cos(a) * 0.7 + randn() * noise, y: 0.25 - Math.sin(a) * 0.7 + randn() * noise, label: 1 });
    }
  }
  return pts;
}

export function dataCircle(n = 120, noise = 0.06) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      const r = rand() * 0.35, a = rand() * 2 * Math.PI;
      pts.push({ x: Math.cos(a) * r + randn() * noise, y: Math.sin(a) * r + randn() * noise, label: 0 });
    } else {
      const r = 0.6 + rand() * 0.25, a = rand() * 2 * Math.PI;
      pts.push({ x: Math.cos(a) * r + randn() * noise, y: Math.sin(a) * r + randn() * noise, label: 1 });
    }
  }
  return pts;
}

export function dataXor(n = 120, noise = 0.05) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = rand() * 1.6 - 0.8, y = rand() * 1.6 - 0.8;
    pts.push({ x: x + randn() * noise, y: y + randn() * noise, label: (x > 0) !== (y > 0) ? 1 : 0 });
  }
  return pts;
}

export function dataSpiral(n = 140, noise = 0.04) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i % (n / 2)) / (n / 2) * 2.6 * Math.PI + 0.6;
    const r = t / (2.6 * Math.PI) * 0.85;
    const s = i % 2 === 0 ? 0 : Math.PI;
    pts.push({
      x: Math.cos(t + s) * r + randn() * noise,
      y: Math.sin(t + s) * r + randn() * noise,
      label: i % 2,
    });
  }
  return pts;
}

export function dataBlobs(n = 100, noise = 0.18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) pts.push({ x: -0.4 + randn() * noise, y: -0.35 + randn() * noise, label: 0 });
    else pts.push({ x: 0.4 + randn() * noise, y: 0.35 + randn() * noise, label: 1 });
  }
  return pts;
}

export const CLASS_COLORS = ['#f0883e', '#58a6ff', '#3fb950', '#bc8cff', '#ff7b9c', '#39d2c0'];

// ============ Coordinate transforms (data [-1,1] <-> canvas px) ============

export function makeScale(cv, pad = 20) {
  return {
    toX: x => pad + (x + 1) / 2 * (cv.W - 2 * pad),
    toY: y => cv.H - pad - (y + 1) / 2 * (cv.H - 2 * pad),
    fromX: px => ((px - pad) / (cv.W - 2 * pad)) * 2 - 1,
    fromY: py => ((cv.H - pad - py) / (cv.H - 2 * pad)) * 2 - 1,
  };
}

export function drawPoint(ctx, px, py, color, r = 5) {
  ctx.beginPath();
  ctx.arc(px, py, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawGrid(cv, scale) {
  const { ctx } = cv;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let v = -1; v <= 1; v += 0.25) {
    ctx.beginPath();
    ctx.moveTo(scale.toX(v), scale.toY(-1));
    ctx.lineTo(scale.toX(v), scale.toY(1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(scale.toX(-1), scale.toY(v));
    ctx.lineTo(scale.toX(1), scale.toY(v));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(scale.toX(0), scale.toY(-1)); ctx.lineTo(scale.toX(0), scale.toY(1)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(scale.toX(-1), scale.toY(0)); ctx.lineTo(scale.toX(1), scale.toY(0)); ctx.stroke();
}

// ============ Tiny MLP (used by NN playground, logistic regression, etc.) ============

export class MLP {
  /** sizes e.g. [2, 8, 8, 1]; activation 'tanh'|'relu'|'sigmoid' for hidden layers */
  constructor(sizes, activation = 'tanh') {
    this.sizes = sizes;
    this.activation = activation;
    this.W = []; // W[l][j][i]  weight from unit i (layer l) to unit j (layer l+1)
    this.b = [];
    for (let l = 0; l < sizes.length - 1; l++) {
      const fanIn = sizes[l];
      const std = Math.sqrt(2 / fanIn);
      this.W.push(Array.from({ length: sizes[l + 1] }, () =>
        Array.from({ length: fanIn }, () => randn() * std)));
      this.b.push(new Array(sizes[l + 1]).fill(0));
    }
  }

  act(x) {
    if (this.activation === 'relu') return Math.max(0, x);
    if (this.activation === 'sigmoid') return 1 / (1 + Math.exp(-x));
    return Math.tanh(x);
  }
  actD(y, x) { // derivative given output y (and pre-activation x for relu)
    if (this.activation === 'relu') return x > 0 ? 1 : 0;
    if (this.activation === 'sigmoid') return y * (1 - y);
    return 1 - y * y;
  }

  /** Forward pass; returns activations per layer. Output layer is sigmoid (binary prob). */
  forward(input) {
    const acts = [input.slice()];
    const zs = [];
    for (let l = 0; l < this.W.length; l++) {
      const prev = acts[l];
      const z = new Array(this.sizes[l + 1]);
      const a = new Array(this.sizes[l + 1]);
      const last = l === this.W.length - 1;
      for (let j = 0; j < z.length; j++) {
        let s = this.b[l][j];
        const wj = this.W[l][j];
        for (let i = 0; i < prev.length; i++) s += wj[i] * prev[i];
        z[j] = s;
        a[j] = last ? 1 / (1 + Math.exp(-s)) : this.act(s);
      }
      zs.push(z);
      acts.push(a);
    }
    this._zs = zs;
    return acts;
  }

  predict(input) {
    return this.forward(input)[this.sizes.length - 1][0];
  }

  /** One SGD step on a minibatch of {x:[..], y:0|1}. Returns mean loss (BCE). */
  trainStep(batch, lr = 0.05, l2 = 0) {
    const gW = this.W.map(m => m.map(r => r.map(() => 0)));
    const gb = this.b.map(r => r.map(() => 0));
    let loss = 0;
    for (const ex of batch) {
      const acts = this.forward(ex.x);
      const zs = this._zs;
      const out = acts[acts.length - 1][0];
      const eps = 1e-7;
      loss += -(ex.y * Math.log(out + eps) + (1 - ex.y) * Math.log(1 - out + eps));
      // delta for sigmoid + BCE simplifies to (out - y)
      let delta = [out - ex.y];
      for (let l = this.W.length - 1; l >= 0; l--) {
        const prev = acts[l];
        for (let j = 0; j < delta.length; j++) {
          gb[l][j] += delta[j];
          for (let i = 0; i < prev.length; i++) gW[l][j][i] += delta[j] * prev[i];
        }
        if (l > 0) {
          const nd = new Array(this.sizes[l]).fill(0);
          for (let i = 0; i < nd.length; i++) {
            let s = 0;
            for (let j = 0; j < delta.length; j++) s += this.W[l][j][i] * delta[j];
            nd[i] = s * this.actD(acts[l][i], zs[l - 1][i]);
          }
          delta = nd;
        }
      }
    }
    const n = batch.length;
    for (let l = 0; l < this.W.length; l++) {
      for (let j = 0; j < this.W[l].length; j++) {
        this.b[l][j] -= lr * gb[l][j] / n;
        for (let i = 0; i < this.W[l][j].length; i++) {
          this.W[l][j][i] -= lr * (gW[l][j][i] / n + l2 * this.W[l][j][i]);
        }
      }
    }
    return loss / n;
  }
}

/** Paint a decision-function heatmap for fn(x,y) -> [0,1] onto canvas region. */
export function paintHeatmap(cv, scale, fn, res = 46) {
  const { ctx } = cv;
  const x0 = scale.toX(-1), x1 = scale.toX(1);
  const y0 = scale.toY(1), y1 = scale.toY(-1);
  const cw = (x1 - x0) / res, ch = (y1 - y0) / res;
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const dx = -1 + (i + 0.5) / res * 2;
      const dy = 1 - (j + 0.5) / res * 2;
      const p = fn(dx, dy);
      // orange (class 0) -> blue (class 1)
      const t = clamp(p, 0, 1);
      const r = Math.round(lerp(240, 88, t));
      const g = Math.round(lerp(136, 166, t));
      const b = Math.round(lerp(62, 255, t));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.10 + 0.22 * Math.abs(t - 0.5) * 2})`;
      ctx.fillRect(x0 + i * cw, y0 + j * ch, cw + 0.5, ch + 0.5);
    }
  }
}

/** Simple line-chart painter for loss curves etc. */
export function drawLineChart(cv, series, opts = {}) {
  const { ctx, W, H } = cv;
  const pad = opts.pad ?? 30;
  ctx.clearRect(0, 0, W, H);
  let maxY = -Infinity, minY = Infinity, maxN = 1;
  for (const s of series) {
    maxN = Math.max(maxN, s.data.length);
    for (const v of s.data) { maxY = Math.max(maxY, v); minY = Math.min(minY, v); }
  }
  if (!isFinite(maxY)) { maxY = 1; minY = 0; }
  if (opts.minY != null) minY = opts.minY;
  if (maxY === minY) maxY = minY + 1;
  const toX = i => pad + i / Math.max(1, maxN - 1) * (W - 2 * pad);
  const toY = v => H - pad - (v - minY) / (maxY - minY) * (H - 2 * pad);
  // axes
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
  ctx.fillStyle = '#8b96a8';
  ctx.font = '11px Consolas, monospace';
  ctx.fillText(maxY.toPrecision(3), 4, pad + 4);
  ctx.fillText(minY.toPrecision(3), 4, H - pad + 4);
  for (const s of series) {
    if (s.data.length < 2) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.data.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
    ctx.stroke();
  }
}
