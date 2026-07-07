// Lesson: Optimizers — SGD vs Momentum vs RMSProp vs Adam racing on a loss surface
import {
  h, html, makeCanvas, demoPanel, slider, button, legend, pointerPos, statRow,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'optimizers',
  emoji: '🏎️',
  title: 'Optimizers: SGD → Adam',
  level: 'Advanced',
  blurb: 'Four optimizers race down a twisted valley. Momentum, adaptive steps, and why Adam usually wins.',

  render(root) {
    root.appendChild(html(`
      <p>Vanilla gradient descent has two chronic diseases:</p>
      <ul>
        <li><strong>Ravines:</strong> when the loss surface is a narrow valley, the gradient points mostly <em>across</em> the valley, not along it — so SGD zigzags wildly and crawls.</li>
        <li><strong>One learning rate for everything:</strong> some parameters need big steps, others tiny ones; a single η can't please them all.</li>
      </ul>
      <p>Modern optimizers fix these with two ideas — <strong>momentum</strong> (remember the direction you've been moving) and <strong>adaptive step sizes</strong> (divide by the typical gradient magnitude per parameter):</p>
      <div class="formula">Momentum: v ← β·v + ∇L; &nbsp; θ ← θ − η·v &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; Adam ≈ momentum ÷ √(running average of ∇L²) &nbsp; (per parameter)</div>
      <h3>Watch the race</h3>
      <p>The contour map below is an elongated, curved valley (a mini "Rosenbrock"). All four optimizers start from the same point. <strong>Click anywhere to move the start.</strong> Watch SGD zigzag, momentum overshoot then power through, and Adam take a confident direct route.</p>
    `));

    // Loss surface: curved valley
    const f = (x, y) => 0.6 * (1 - x) ** 2 + 2.4 * (y - x * x) ** 2 + 0.15;
    const grad = (x, y) => ({
      gx: -1.2 * (1 - x) - 9.6 * x * (y - x * x),
      gy: 4.8 * (y - x * x),
    });
    const XMIN = -1.6, XMAX = 1.8, YMIN = -0.8, YMAX = 2.0;
    const target = { x: 1, y: 1 };

    const cv = makeCanvas(460);
    let lrScale = 1.0;
    let start = { x: -1.2, y: 1.7 };
    let racers = [];
    let running = false, raf = null, tick = 0;
    const stats = statRow(['Step', 'SGD loss', 'Momentum loss', 'Adam loss']);

    const COLORS = { SGD: '#f0883e', Momentum: '#58a6ff', RMSProp: '#3fb950', Adam: '#ff7b9c' };

    function resetRacers() {
      tick = 0;
      racers = [
        { name: 'SGD', p: { ...start }, trail: [], state: {} },
        { name: 'Momentum', p: { ...start }, trail: [], state: { vx: 0, vy: 0 } },
        { name: 'RMSProp', p: { ...start }, trail: [], state: { sx: 0, sy: 0 } },
        { name: 'Adam', p: { ...start }, trail: [], state: { mx: 0, my: 0, sx: 0, sy: 0, t: 0 } },
      ];
    }
    resetRacers();

    function stepRacer(r) {
      const { gx, gy } = grad(r.p.x, r.p.y);
      const s = r.state;
      let dx = 0, dy = 0;
      const base = 0.012 * lrScale;
      if (r.name === 'SGD') {
        dx = base * gx; dy = base * gy;
      } else if (r.name === 'Momentum') {
        s.vx = 0.9 * s.vx + gx; s.vy = 0.9 * s.vy + gy;
        dx = base * s.vx; dy = base * s.vy;
      } else if (r.name === 'RMSProp') {
        s.sx = 0.99 * s.sx + 0.01 * gx * gx; s.sy = 0.99 * s.sy + 0.01 * gy * gy;
        dx = 0.006 * lrScale * gx / (Math.sqrt(s.sx) + 1e-8);
        dy = 0.006 * lrScale * gy / (Math.sqrt(s.sy) + 1e-8);
      } else { // Adam
        s.t++;
        s.mx = 0.9 * s.mx + 0.1 * gx; s.my = 0.9 * s.my + 0.1 * gy;
        s.sx = 0.999 * s.sx + 0.001 * gx * gx; s.sy = 0.999 * s.sy + 0.001 * gy * gy;
        const mxh = s.mx / (1 - 0.9 ** s.t), myh = s.my / (1 - 0.9 ** s.t);
        const sxh = s.sx / (1 - 0.999 ** s.t), syh = s.sy / (1 - 0.999 ** s.t);
        dx = 0.008 * lrScale * mxh / (Math.sqrt(sxh) + 1e-8);
        dy = 0.008 * lrScale * myh / (Math.sqrt(syh) + 1e-8);
      }
      r.trail.push({ ...r.p });
      r.p.x -= dx; r.p.y -= dy;
    }

    const toPx = x => (x - XMIN) / (XMAX - XMIN) * cv.W;
    const toPy = y => cv.H - (y - YMIN) / (YMAX - YMIN) * cv.H;
    const fromPx = px => XMIN + px / cv.W * (XMAX - XMIN);
    const fromPy = py => YMIN + (cv.H - py) / cv.H * (YMAX - YMIN);

    let bgCache = null;
    function paintContours() {
      // cache the contour background per size
      const key = cv.W + 'x' + cv.H;
      if (bgCache && bgCache.key === key) {
        cv.ctx.putImageData(bgCache.img, 0, 0);
        return;
      }
      const { ctx, W, H } = cv;
      const dpr = window.devicePixelRatio || 1;
      // draw low-res filled contours
      const res = 3;
      for (let px = 0; px < W; px += res) {
        for (let py = 0; py < H; py += res) {
          const v = f(fromPx(px), fromPy(py));
          const t = Math.min(1, Math.log(1 + v) / 2.2);
          const r = Math.round(13 + t * 45);
          const g = Math.round(17 + t * 55);
          const b = Math.round(23 + t * 95);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(px, py, res, res);
        }
      }
      // contour lines
      ctx.strokeStyle = 'rgba(139,150,168,0.25)';
      ctx.lineWidth = 1;
      for (const level of [0.2, 0.35, 0.6, 1.0, 1.8, 3.2, 5.5]) {
        for (let px = 0; px < W; px += 4) {
          for (let py = 0; py < H; py += 4) {
            const v = f(fromPx(px), fromPy(py));
            const v2 = f(fromPx(px + 4), fromPy(py));
            const v3 = f(fromPx(px), fromPy(py + 4));
            if ((v - level) * (v2 - level) < 0 || (v - level) * (v3 - level) < 0) {
              ctx.fillStyle = 'rgba(139,150,168,0.3)';
              ctx.fillRect(px, py, 1.5, 1.5);
            }
          }
        }
      }
      try {
        bgCache = { key, img: ctx.getImageData(0, 0, Math.round(W * dpr), Math.round(H * dpr)) };
      } catch { bgCache = null; }
    }

    function draw() {
      const { ctx } = cv;
      paintContours();
      // target star
      ctx.fillStyle = '#e3b341';
      ctx.font = '18px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('★', toPx(target.x), toPy(target.y) + 6);
      ctx.textAlign = 'left';
      // trails
      for (const r of racers) {
        ctx.strokeStyle = COLORS[r.name];
        ctx.lineWidth = 2;
        ctx.beginPath();
        r.trail.forEach((p, i) => {
          const px = toPx(p.x), py = toPy(p.y);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.lineTo(toPx(r.p.x), toPy(r.p.y));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(toPx(r.p.x), toPy(r.p.y), 6, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS[r.name];
        ctx.fill();
        ctx.strokeStyle = '#0d1117';
        ctx.stroke();
      }
      stats.set('Step', String(tick));
      stats.set('SGD loss', f(racers[0].p.x, racers[0].p.y).toFixed(3));
      stats.set('Momentum loss', f(racers[1].p.x, racers[1].p.y).toFixed(3));
      stats.set('Adam loss', f(racers[3].p.x, racers[3].p.y).toFixed(3));
    }
    cv.onResize(() => { bgCache = null; draw(); });

    function loop() {
      if (!running) return;
      tick++;
      racers.forEach(stepRacer);
      draw();
      if (tick < 900) raf = requestAnimationFrame(loop);
      else { running = false; playBtn.textContent = '▶ Race'; }
    }
    onLeave(() => { running = false; cancelAnimationFrame(raf); });

    cv.canvas.addEventListener('pointerdown', e => {
      const p = pointerPos(cv.canvas, e);
      start = { x: fromPx(p.x), y: fromPy(p.y) };
      resetRacers();
      draw();
    });

    const playBtn = button('▶ Race', () => {
      running = !running;
      playBtn.textContent = running ? '⏸ Pause' : '▶ Race';
      if (running) loop();
    });
    const resetBtn = button('↺ Restart', () => { resetRacers(); draw(); }, true);
    const lrS = slider('LR multiplier', { min: 0.2, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) + '×' }, v => { lrScale = v; });

    root.appendChild(demoPanel(
      'The optimizer grand prix',
      'Darker = lower loss; ★ = global minimum. Click anywhere to set a new starting point, then race.',
      cv.canvas,
      h('div', { class: 'controls' }, [playBtn, resetBtn, lrS.el]),
      legend(Object.entries(COLORS).map(([n, c]) => [c, n])),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>What each racer is doing</h3>
      <table class="info-table">
        <tr><th>Optimizer</th><th>Idea</th><th>Behavior you saw</th></tr>
        <tr><td><b>SGD</b></td><td>Raw gradient step</td><td>Zigzags across the valley walls; slow along the valley floor</td></tr>
        <tr><td><b>Momentum</b></td><td>Velocity accumulates; ~90% of previous step is kept</td><td>Smooths the zigzag, builds speed along the valley — can overshoot corners like a heavy ball</td></tr>
        <tr><td><b>RMSProp</b></td><td>Divide each parameter's step by its recent gradient RMS</td><td>Equalizes progress in steep vs flat directions</td></tr>
        <tr><td><b>Adam</b></td><td>Momentum <em>and</em> RMS scaling + bias correction</td><td>Direct, confident path — the default choice in deep learning</td></tr>
      </table>
      <h3>Beyond the optimizer: learning-rate schedules</h3>
      <p>Even Adam benefits from changing η over time. Common patterns:</p>
      <ul>
        <li><strong>Warmup:</strong> start tiny and ramp up over the first few hundred steps (essential for transformers — early gradients are chaotic).</li>
        <li><strong>Cosine decay:</strong> smoothly anneal toward zero so the model settles gently into a minimum.</li>
        <li><strong>Step decay:</strong> cut η ×0.1 whenever validation loss plateaus.</li>
      </ul>
      <div class="callout callout-tip"><div class="callout-title">💡 Practical defaults</div>
      <code>AdamW</code> (Adam with properly decoupled weight decay) at η = 3e-4, warmup + cosine decay, is the "sensible default" that trains everything from ResNets to LLMs respectably. Tune from there.</div>
    `));
  },
};
