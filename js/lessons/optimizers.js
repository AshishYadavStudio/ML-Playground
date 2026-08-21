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
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Compute the gradient:</strong> Backpropagation gives us ∇L — a vector pointing in the direction of steepest <em>increase</em> of the loss. Every optimizer starts from this same gradient; they differ in what they do next.</li>
          <li><strong>SGD — the raw step:</strong> Subtract η·∇L from each weight. Simple, but the step size is identical for all parameters and there's no memory of past steps, so the path zigzags in narrow valleys.</li>
          <li><strong>Add momentum:</strong> Maintain a velocity vector v that accumulates past gradients: v ← β·v + ∇L, then step by η·v. This smooths out oscillations and builds speed along consistent directions — like a heavy ball rolling downhill.</li>
          <li><strong>Add adaptive scaling (RMSProp):</strong> Track the running average of each parameter's squared gradient. Divide the step by √(average), so parameters with consistently large gradients take smaller steps and those with small gradients take larger ones. This equalizes progress across dimensions.</li>
          <li><strong>Combine both — Adam:</strong> Use momentum (first moment) <em>and</em> adaptive scaling (second moment) together, plus a bias correction for the early steps when the running averages haven't warmed up. This is why Adam usually converges fastest and is the default in modern deep learning.</li>
        </ol>
      </div>

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
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Gradient Descent Golf</div>
        Tune a learning rate by hand and race to convergence across five holes — the exact intuition behind why momentum and adaptive steps help. <a href="../games/gradient-descent-golf/" style="color:var(--accent);font-weight:700;">Play Gradient Descent Golf →</a>
      </div>

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

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Momentum Math, Adam Internals, and Learning Rate Schedules</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>Each optimizer maintains different statistics of the gradient history and uses them to transform the raw gradient into an update step:</p>
          <div class="formula"><b>SGD:</b> &nbsp; θ<sub>t+1</sub> = θ<sub>t</sub> − η · g<sub>t</sub></div>
          <div class="formula"><b>Momentum:</b> &nbsp; v<sub>t</sub> = β · v<sub>t−1</sub> + g<sub>t</sub>, &nbsp; θ<sub>t+1</sub> = θ<sub>t</sub> − η · v<sub>t</sub> &nbsp; (β typically 0.9)</div>
          <div class="formula"><b>RMSProp:</b> &nbsp; s<sub>t</sub> = ρ · s<sub>t−1</sub> + (1−ρ) · g<sub>t</sub>², &nbsp; θ<sub>t+1</sub> = θ<sub>t</sub> − η · g<sub>t</sub> / (√s<sub>t</sub> + ε)</div>
          <div class="formula"><b>Adam:</b> &nbsp; m<sub>t</sub> = β₁ · m<sub>t−1</sub> + (1−β₁) · g<sub>t</sub>, &nbsp; v<sub>t</sub> = β₂ · v<sub>t−1</sub> + (1−β₂) · g<sub>t</sub>²</div>
          <div class="formula">&nbsp; &nbsp; m̂<sub>t</sub> = m<sub>t</sub>/(1−β₁<sup>t</sup>), &nbsp; v̂<sub>t</sub> = v<sub>t</sub>/(1−β₂<sup>t</sup>), &nbsp; θ<sub>t+1</sub> = θ<sub>t</sub> − η · m̂<sub>t</sub>/(√v̂<sub>t</sub> + ε)</div>
          <p>Adam's default hyperparameters (Kingma & Ba, 2014): β₁ = 0.9, β₂ = 0.999, ε = 10<sup>−8</sup>.</p>

          <h4>Adam's Bias Correction — Why It Matters</h4>
          <p>At step t=1, m₁ = 0.1·g₁ (with β₁=0.9). Without correction, Adam would think the average gradient is only 10% of the actual first gradient. The bias correction m̂₁ = m₁/(1 − 0.9¹) = m₁/0.1 = g₁ recovers the true estimate. As t grows, (1 − β<sup>t</sup>) → 1 and the correction vanishes. Without bias correction, the first few hundred steps take misleadingly small steps — especially problematic for β₂ = 0.999, where the correction is significant for ~1000 steps.</p>

          <h4>AdamW vs. Adam + L2 Regularization</h4>
          <p>Standard L2 regularization adds λ·‖θ‖² to the loss, so the gradient includes λ·θ. In Adam, this regularization gradient gets divided by the adaptive second moment — parameters with large gradients effectively get <em>less</em> regularization. <strong>AdamW</strong> (Loshchilov & Hutter, 2019) applies weight decay directly to the parameter update: θ ← θ − η·λ·θ, bypassing the adaptive scaling. This "decoupled" weight decay works as intended regardless of the gradient history and produces measurably better generalization.</p>

          <h4>Intuition</h4>
          <p>Imagine navigating a foggy mountain valley. <strong>SGD</strong> is like taking a step in whatever direction the ground slopes most right under your feet — if the valley is narrow, you bounce off the walls. <strong>Momentum</strong> is like rolling a ball: it accumulates velocity along the valley floor and dampens side-to-side bouncing. <strong>RMSProp</strong> is like wearing special shoes that take big steps in directions where the ground is flat and tiny steps where it's steep. <strong>Adam</strong> combines the ball and the shoes — momentum for direction, adaptive scaling for step size — which is why it usually finds the valley floor fastest.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Adam always converges to a better solution than SGD."</div>
          <p><strong>✅ Reality:</strong> Adam converges <em>faster</em> to <em>a</em> solution, but SGD with momentum often finds solutions that <em>generalize better</em> on the test set. This was shown empirically by Wilson et al. (2017). The hypothesis is that Adam's per-parameter adaptivity lets it exploit sharp, narrow minima that don't generalize, while SGD's noise helps it settle in flatter minima. In practice, large-scale vision models often use SGD+momentum, while NLP and generative models prefer AdamW.</p>

          <div class="misconception"><strong>❌ Misconception:</strong> "Learning rate warmup is just a training trick — it doesn't matter much."</div>
          <p><strong>✅ Reality:</strong> Without warmup, the first few gradient steps can be catastrophically large (especially with Adam, where the second moment estimate is near-zero and gets bias-corrected to small values). For transformers, skipping warmup often causes training to diverge entirely. Warmup gives the optimizer time to build accurate gradient statistics before taking full-sized steps.</p>

          <h4>Historical Context</h4>
          <p>SGD has been used since Robbins & Monro (1951). Momentum was added by Polyak (1964). RMSProp was proposed by Geoff Hinton in an unpublished Coursera lecture (2012) — one of the most impactful ideas never formally published. Adam (Kingma & Ba, 2014) combined RMSProp with momentum and quickly became the default optimizer. The AdamW correction (2019) fixed a subtle interaction with weight decay that had been quietly hurting generalization for years. Recent alternatives like LAMB (for large-batch training) and Lion (Chen et al., 2023, discovered by program search) continue to push the frontier.</p>
        </div>
      </details>
    `));
  },
};
