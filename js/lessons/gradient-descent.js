// Lesson: Gradient Descent — ball rolling down a loss curve, learning-rate effects
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'gradient-descent',
  emoji: '⛷️',
  title: 'Gradient Descent',
  level: 'Beginner',
  blurb: 'The engine of all learning: roll a ball downhill on the loss landscape. Careful with that learning rate…',

  render(root) {
    root.appendChild(html(`
      <p>Almost every model in this course learns the same way: define a <strong>loss function</strong> (how wrong am I?), then repeatedly step the parameters <em>downhill</em> on that loss. Picture the loss as a landscape and the current parameters as a ball on it.</p>
      <div class="formula">θ ← θ − η · ∇L(θ) &nbsp;&nbsp;&nbsp;&nbsp; η ("eta") = learning rate, &nbsp; ∇L = gradient (slope of the loss)</div>
      <ul>
        <li>The <strong>gradient</strong> points in the direction of steepest <em>increase</em> — so we move against it.</li>
        <li>The <strong>learning rate η</strong> scales the step size. It is the single most important knob in deep learning.</li>
      </ul>
      <h3>Try it: roll the ball</h3>
      <p><strong>Click anywhere on the curve</strong> to drop the ball, then press <em>Step</em> or <em>Auto-run</em>. Now try cranking the learning rate up past 1.0 and watch what happens…</p>
    `));

    // Loss curve: a nice non-convex 1-D function with a local + global minimum
    const f = x => 0.28 * x * x + 0.5 * Math.sin(2.2 * x + 1.2) + 0.65 + 0.15 * Math.cos(4 * x);
    const fp = x => 0.56 * x + 1.1 * Math.cos(2.2 * x + 1.2) - 0.6 * Math.sin(4 * x);

    const XMIN = -3, XMAX = 3;
    const cv = makeCanvas(400);
    let ballX = 2.4;
    let lr = 0.15;
    let trail = [];
    let running = false, raf = null, stepCount = 0;

    const stats = statRow(['Position θ', 'Loss L(θ)', 'Gradient', 'Steps']);

    // y range for plotting
    let yMin = Infinity, yMax = -Infinity;
    for (let x = XMIN; x <= XMAX; x += 0.01) { const y = f(x); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
    const yPad = (yMax - yMin) * 0.18;

    const toPx = x => 30 + (x - XMIN) / (XMAX - XMIN) * (cv.W - 60);
    const toPy = y => 20 + (1 - (y - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * (cv.H - 60);
    const fromPx = px => XMIN + (px - 30) / (cv.W - 60) * (XMAX - XMIN);

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      // curve
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = XMIN; x <= XMAX; x += 0.02) {
        const px = toPx(x), py = toPy(f(x));
        x === XMIN ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      // trail
      ctx.fillStyle = 'rgba(227,179,65,0.5)';
      for (const t of trail) {
        ctx.beginPath();
        ctx.arc(toPx(t), toPy(f(t)), 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      // trail connectors (show overshoot bouncing)
      if (trail.length > 1) {
        ctx.strokeStyle = 'rgba(227,179,65,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        trail.forEach((t, i) => {
          const px = toPx(t), py = toPy(f(t));
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      // tangent line at ball
      const g = fp(ballX);
      const y0 = f(ballX);
      ctx.strokeStyle = 'rgba(255,123,156,0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(toPx(ballX - 0.5), toPy(y0 - 0.5 * g));
      ctx.lineTo(toPx(ballX + 0.5), toPy(y0 + 0.5 * g));
      ctx.stroke();
      ctx.setLineDash([]);
      // ball
      ctx.beginPath();
      ctx.arc(toPx(ballX), toPy(y0), 10, 0, 2 * Math.PI);
      const grad = ctx.createRadialGradient(toPx(ballX) - 3, toPy(y0) - 3, 1, toPx(ballX), toPy(y0), 10);
      grad.addColorStop(0, '#ffd479');
      grad.addColorStop(1, '#e3b341');
      ctx.fillStyle = grad;
      ctx.fill();
      // labels
      ctx.fillStyle = '#8b96a8';
      ctx.font = '12px Segoe UI';
      ctx.fillText('parameter θ →', W - 110, H - 10);
      ctx.fillText('loss L(θ)', 8, 16);

      stats.set('Position θ', ballX.toFixed(3));
      stats.set('Loss L(θ)', y0.toFixed(3));
      stats.set('Gradient', g.toFixed(3));
      stats.set('Steps', String(stepCount));
    }
    cv.onResize(draw);

    function step() {
      const g = fp(ballX);
      trail.push(ballX);
      if (trail.length > 60) trail.shift();
      ballX = ballX - lr * g;
      // keep on screen but show divergence
      if (ballX < XMIN - 0.5 || ballX > XMAX + 0.5) {
        ballX = Math.max(XMIN + 0.05, Math.min(XMAX - 0.05, ballX));
        diverged.style.display = 'block';
        running = false;
      }
      stepCount++;
      draw();
    }

    function loop() {
      if (!running) return;
      step();
      raf = setTimeout(() => requestAnimationFrame(loop), 90);
    }
    onLeave(() => { running = false; clearTimeout(raf); });

    cv.canvas.addEventListener('pointerdown', e => {
      const rect = cv.canvas.getBoundingClientRect();
      ballX = Math.max(XMIN, Math.min(XMAX, fromPx(e.clientX - rect.left)));
      trail = []; stepCount = 0;
      diverged.style.display = 'none';
      draw();
    });

    const lrSlider = slider('Learning rate η', { min: 0.01, max: 1.3, step: 0.01, value: 0.15, fmt: v => v.toFixed(2) }, v => { lr = v; });
    const stepBtn = button('Step ▸', () => { running = false; step(); });
    const runBtn = button('▶ Auto-run', () => {
      running = !running;
      runBtn.textContent = running ? '⏸ Pause' : '▶ Auto-run';
      if (running) loop();
    });
    const resetBtn = button('Reset', () => {
      running = false; runBtn.textContent = '▶ Auto-run';
      ballX = 2.4; trail = []; stepCount = 0;
      diverged.style.display = 'none';
      draw();
    }, true);
    const diverged = h('div', { class: 'callout callout-warn', style: { display: 'none' } }, [
      h('div', { class: 'callout-title' }, '💥 Diverged!'),
      'The learning rate is so large that each step overshoots the valley and climbs higher than where it started. Lower η and try again.',
    ]);

    root.appendChild(demoPanel(
      'Rolling downhill on the loss landscape',
      'Click the curve to place the ball. The pink dashed line is the local gradient (slope). Yellow dots trace the path.',
      cv.canvas,
      h('div', { class: 'controls' }, [lrSlider.el, stepBtn, runBtn, resetBtn]),
      stats.el,
      diverged,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Gradient Descent Golf</div>
        Turn this into a game — pick the learning rate for five different loss curves and try to beat par. <a href="../games/gradient-descent-golf/" style="color:var(--accent);font-weight:700;">Play Gradient Descent Golf →</a>
      </div>

      <h3>Three regimes of the learning rate</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🐢</div><h4>Too small (η ≈ 0.01)</h4><p>Converges, but takes forever. In deep learning this wastes GPU-days and can get stuck on plateaus.</p></div>
        <div class="card"><div class="card-icon">✅</div><h4>Just right (η ≈ 0.1–0.3 here)</h4><p>Smooth, fast descent into a minimum. Finding this sweet spot is what learning-rate tuning is about.</p></div>
        <div class="card"><div class="card-icon">💥</div><h4>Too large (η > 1 here)</h4><p>Each step overshoots the valley floor and bounces higher and higher — the loss explodes to infinity.</p></div>
      </div>
      <h3>Local minima: did you notice?</h3>
      <p>This curve has <strong>two valleys</strong>. Depending on where you drop the ball, plain gradient descent settles into whichever valley it starts above — even if the other one is deeper. This is a <strong>local minimum</strong>.</p>
      <div class="callout callout-info"><div class="callout-title">📌 In practice</div>
      <ul>
        <li><strong>Stochastic</strong> gradient descent (SGD) computes the gradient on a small random <em>minibatch</em> instead of the whole dataset — cheaper per step and the noise actually helps escape shallow local minima.</li>
        <li>Momentum and Adam (see the <em>Optimizers</em> lesson) make descent smarter than the vanilla rule you just used.</li>
        <li>In very high dimensions, true local minima are surprisingly rare — flat saddle regions are the bigger enemy.</li>
      </ul></div>
    `));

    // --- 3D loss surface (Three.js loaded from CDN on demand) ---
    let alive3d = true;
    onLeave(() => { alive3d = false; });

    root.appendChild(html(`
      <h3>Now in 3D: a real loss landscape</h3>
      <p>The curve above has one parameter — you can only go left or right. Real models have <strong>thousands of parameters</strong>, and even with just <em>two</em> the loss becomes a surface with valleys, ridges, and <strong>saddle points</strong>.</p>
      <p><strong>Try it:</strong> drag to orbit, click the surface to drop the ball, and add <em>momentum</em> — watch it curve through valleys instead of zig-zagging.</p>
    `));

    import('../gd3d.js').then(m => { if (alive3d) m.default(root); }).catch(() => {
      if (alive3d) root.appendChild(html('<p style="color:#8b96a8;text-align:center;padding:20px 0">3D visualization requires internet for the Three.js engine. The 2D demo above works offline.</p>'));
    });
  },
};
