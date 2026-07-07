// Lesson: Logistic Regression — sigmoid + live training of a linear decision boundary
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, dataBlobs, makeScale, drawGrid, drawPoint, paintHeatmap, CLASS_COLORS,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'logistic-regression',
  emoji: '🚪',
  title: 'Logistic Regression',
  level: 'Beginner',
  blurb: 'From numbers to probabilities: the sigmoid squash, and a decision boundary trained live.',

  render(root) {
    root.appendChild(html(`
      <p>Linear regression predicts any number — but for <strong>classification</strong> ("spam or not?") we want a <em>probability</em> between 0 and 1. Logistic regression keeps the linear core and adds one ingredient: the <strong>sigmoid</strong> function, which squashes any number into (0, 1).</p>
      <div class="formula">z = w₁x₁ + w₂x₂ + b &nbsp;&nbsp;→&nbsp;&nbsp; p = σ(z) = 1 / (1 + e⁻ᶻ)</div>
    `));

    // ---- Demo 1: sigmoid explorer ----
    const cv1 = makeCanvas(260);
    let sw = 1, sb = 0;
    function drawSig() {
      const { ctx, W, H } = cv1;
      ctx.clearRect(0, 0, W, H);
      const pad = 34;
      const toX = x => pad + (x + 6) / 12 * (W - 2 * pad);
      const toY = p => H - pad - p * (H - 2 * pad);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);
      // 0.5 line
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad, toY(0.5)); ctx.lineTo(W - pad, toY(0.5)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#bc8cff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = -6; x <= 6; x += 0.05) {
        const p = 1 / (1 + Math.exp(-(sw * x + sb)));
        const px = toX(x), py = toY(p);
        x <= -6 + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('z →', W - pad + 6, H - pad + 4);
      ctx.fillText('p = 1', 6, toY(1) + 4);
      ctx.fillText('p = 0.5', 6, toY(0.5) + 4);
      ctx.fillText('p = 0', 6, toY(0) + 4);
    }
    cv1.onResize(drawSig);
    const wS = slider('weight w', { min: 0.2, max: 4, step: 0.1, value: 1, fmt: v => v.toFixed(1) }, v => { sw = v; drawSig(); });
    const bS = slider('bias b', { min: -4, max: 4, step: 0.1, value: 0, fmt: v => v.toFixed(1) }, v => { sb = v; drawSig(); });
    root.appendChild(demoPanel(
      'The sigmoid squash σ(wx + b)',
      'The weight controls steepness (confidence); the bias slides the transition point. Every output is a valid probability.',
      cv1.canvas,
      h('div', { class: 'controls' }, [wS.el, bS.el]),
    ));

    // ---- Demo 2: live training on 2-D data ----
    root.appendChild(html(`
      <h3>Watch it learn a decision boundary</h3>
      <p>In 2-D, the set of points where <code>p = 0.5</code> (i.e. <code>z = 0</code>) is a straight line — the <strong>decision boundary</strong>. Training minimizes <strong>cross-entropy loss</strong>, which heavily punishes confident wrong answers:</p>
      <div class="formula">L = −[ y·log(p) + (1−y)·log(1−p) ]</div>
    `));

    seed(13);
    const points = dataBlobs(110, 0.28).map(p => ({ ...p }));
    const cv2 = makeCanvas(420);
    const scale = makeScale(cv2);
    let W = { w1: 0.3, w2: -0.6, b: 0.2 };
    let running = false, raf = null, epoch = 0;
    const stats = statRow(['Epoch', 'Loss', 'Accuracy']);

    function predict(x, y) { return 1 / (1 + Math.exp(-(W.w1 * x + W.w2 * y + W.b))); }

    function draw() {
      const { ctx } = cv2;
      ctx.clearRect(0, 0, cv2.W, cv2.H);
      paintHeatmap(cv2, scale, predict);
      drawGrid(cv2, scale);
      // boundary z=0
      const n = Math.hypot(W.w1, W.w2) || 1;
      const nx = W.w1 / n, ny = W.w2 / n, off = -W.b / n;
      const pts = [];
      for (const x of [-1, 1]) if (Math.abs(ny) > 1e-6) pts.push({ x, y: (off - nx * x) / ny });
      for (const y of [-1, 1]) if (Math.abs(nx) > 1e-6) pts.push({ x: (off - ny * y) / nx, y });
      const inside = pts.filter(p => p.x >= -1.02 && p.x <= 1.02 && p.y >= -1.02 && p.y <= 1.02);
      if (inside.length >= 2) {
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(scale.toX(inside[0].x), scale.toY(inside[0].y));
        ctx.lineTo(scale.toX(inside[1].x), scale.toY(inside[1].y));
        ctx.stroke();
      }
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label]);

      let loss = 0, correct = 0;
      for (const p of points) {
        const pr = predict(p.x, p.y);
        loss += -(p.label * Math.log(pr + 1e-7) + (1 - p.label) * Math.log(1 - pr + 1e-7));
        if ((pr > 0.5 ? 1 : 0) === p.label) correct++;
      }
      stats.set('Epoch', String(epoch));
      stats.set('Loss', (loss / points.length).toFixed(4));
      stats.set('Accuracy', (correct / points.length * 100).toFixed(1) + '%');
    }
    cv2.onResize(draw);

    function trainLoop() {
      if (!running) return;
      for (let k = 0; k < 2; k++) {
        epoch++;
        let g1 = 0, g2 = 0, gb = 0;
        for (const p of points) {
          const err = predict(p.x, p.y) - p.label;
          g1 += err * p.x; g2 += err * p.y; gb += err;
        }
        const lr = 0.6 / points.length;
        W.w1 -= lr * g1 * 4; W.w2 -= lr * g2 * 4; W.b -= lr * gb * 4;
      }
      draw();
      if (epoch < 400) raf = requestAnimationFrame(trainLoop);
      else { running = false; playBtn.textContent = '▶ Train'; }
    }

    const playBtn = button('▶ Train', () => {
      running = !running;
      playBtn.textContent = running ? '⏸ Pause' : '▶ Train';
      if (running) trainLoop();
    });
    const resetBtn = button('Reset', () => {
      running = false; playBtn.textContent = '▶ Train';
      cancelAnimationFrame(raf);
      W = { w1: 0.3, w2: -0.6, b: 0.2 }; epoch = 0;
      draw();
    }, true);
    onLeave(() => { running = false; cancelAnimationFrame(raf); });

    root.appendChild(demoPanel(
      'Training a decision boundary, live',
      'The background shows the model probability at every location (orange → class 0, blue → class 1). The white line is p = 0.5.',
      cv2.canvas,
      h('div', { class: 'controls' }, [playBtn, resetBtn]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>The catch — and the cliffhanger</h3>
      <p>Logistic regression can only ever draw a <strong>straight</strong> boundary. Feed it a dataset where the classes wrap around each other (circles, spirals, XOR) and it's stuck at ~50% no matter how long you train. Fixing that limitation is exactly why <strong>neural networks</strong> exist — they learn to warp the space until a straight cut works. You'll see it happen in the Deep Learning section.</p>
      <div class="callout callout-info"><div class="callout-title">📌 Takeaways</div>
      <ul>
        <li>Sigmoid turns a linear score into a probability; the boundary sits at p = 0.5.</li>
        <li>Cross-entropy is the natural loss for probabilities — confidently wrong = huge penalty.</li>
        <li>Despite the name, logistic <em>regression</em> is a classification algorithm — and still a workhorse baseline in industry today.</li>
      </ul></div>
    `));
  },
};
