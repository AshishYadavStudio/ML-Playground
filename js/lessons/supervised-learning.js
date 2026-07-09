// Lesson: Supervised Learning — labeled data, classification vs regression
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, pointerPos,
  seed, randn, rand, makeScale, drawGrid, drawPoint, paintHeatmap, CLASS_COLORS, clamp,
} from '../utils.js';

export default {
  id: 'supervised-learning',
  emoji: '🏷️',
  title: 'Supervised Learning',
  level: 'Beginner',
  blurb: 'Learn from labeled examples. The two jobs: classification (which category?) and regression (how much?).',

  render(root) {
    root.appendChild(html(`
      <p><strong>Supervised learning</strong> is the most common kind of machine learning — and everything in the Classical ML and Deep Learning sections is a variation of it. The idea: show the model many examples where you already know the right answer, and it learns the <em>mapping</em> from input to answer.</p>
      <div class="formula">training data: (x₁, y₁), (x₂, y₂), … &nbsp;→&nbsp; learn f so that f(x) ≈ y &nbsp;→&nbsp; predict y for new x</div>
      <ul>
        <li><strong>Features (x):</strong> the inputs — pixels of a photo, words of an email, a house's size and location.</li>
        <li><strong>Label (y):</strong> the known answer — "cat", "spam", or a price. This is the <em>supervision</em>: a teacher provided the correct answers.</li>
      </ul>
      <p>Supervised problems split into two jobs depending on what kind of answer you're predicting:</p>

      <h3>Try it: classification vs regression</h3>
      <p>Toggle the two modes and <strong>move your mouse over the plot</strong> to drop a new example — the model predicts its answer from the labeled training data.</p>
    `));

    let mode = 'classification';
    const cv = makeCanvas(420);
    const scale = makeScale(cv);
    const stats = statRow(['Task type', 'Answer is…', 'Prediction for ?']);
    let query = null;

    // ---- classification data + logistic fit ----
    seed(5);
    const clsPts = [];
    for (let i = 0; i < 80; i++) {
      const c = i % 2;
      clsPts.push({ x: clamp((c ? 0.4 : -0.4) + randn() * 0.26, -1, 1), y: clamp((c ? 0.35 : -0.35) + randn() * 0.26, -1, 1), label: c });
    }
    let W = { w1: 0.4, w2: 0.4, b: 0 };
    for (let step = 0; step < 400; step++) {
      let g1 = 0, g2 = 0, gb = 0;
      for (const p of clsPts) {
        const pred = 1 / (1 + Math.exp(-(W.w1 * p.x + W.w2 * p.y + W.b)));
        const e = pred - p.label;
        g1 += e * p.x; g2 += e * p.y; gb += e;
      }
      const lr = 0.1 / clsPts.length * 4;
      W.w1 -= lr * g1; W.w2 -= lr * g2; W.b -= lr * gb;
    }
    const clsProb = (x, y) => 1 / (1 + Math.exp(-(W.w1 * x + W.w2 * y + W.b)));

    // ---- regression data + least-squares line ----
    seed(9);
    const regPts = [];
    for (let i = 0; i < 40; i++) {
      const x = rand() * 1.7 - 0.85;
      regPts.push({ x, y: clamp(0.75 * x + 0.05 + randn() * 0.16, -0.95, 0.95) });
    }
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of regPts) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
    const n = regPts.length;
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const regPredict = x => slope * x + intercept;

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      if (mode === 'classification') {
        paintHeatmap(cv, scale, clsProb, 42);
        drawGrid(cv, scale);
        // boundary
        const nn = Math.hypot(W.w1, W.w2) || 1;
        const nx = W.w1 / nn, ny = W.w2 / nn, off = -W.b / nn;
        const pts = [];
        for (const x of [-1, 1]) if (Math.abs(ny) > 1e-6) pts.push({ x, y: (off - nx * x) / ny });
        for (const y of [-1, 1]) if (Math.abs(nx) > 1e-6) pts.push({ x: (off - ny * y) / nx, y });
        const inside = pts.filter(p => p.x >= -1.02 && p.x <= 1.02 && p.y >= -1.02 && p.y <= 1.02);
        if (inside.length >= 2) {
          ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(scale.toX(inside[0].x), scale.toY(inside[0].y));
          ctx.lineTo(scale.toX(inside[1].x), scale.toY(inside[1].y));
          ctx.stroke();
        }
        for (const p of clsPts) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 5);
      } else {
        drawGrid(cv, scale);
        ctx.strokeStyle = '#39d2c0'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(scale.toX(-1), scale.toY(clamp(regPredict(-1), -1.4, 1.4)));
        ctx.lineTo(scale.toX(1), scale.toY(clamp(regPredict(1), -1.4, 1.4)));
        ctx.stroke();
        for (const p of regPts) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), '#58a6ff', 5);
      }
      // query point
      if (query) {
        if (mode === 'classification') {
          const prob = clsProb(query.x, query.y);
          const cls = prob > 0.5 ? 1 : 0;
          drawPoint(ctx, scale.toX(query.x), scale.toY(query.y), '#e6edf3', 10);
          ctx.beginPath(); ctx.arc(scale.toX(query.x), scale.toY(query.y), 5, 0, 7); ctx.fillStyle = CLASS_COLORS[cls]; ctx.fill();
          stats.set('Prediction for ?', (cls ? '🔵 blue' : '🟠 orange') + ' (' + (Math.max(prob, 1 - prob) * 100).toFixed(0) + '%)');
        } else {
          const yh = regPredict(query.x);
          const px = scale.toX(query.x);
          ctx.strokeStyle = 'rgba(227,179,65,0.6)'; ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(px, scale.toY(-1)); ctx.lineTo(px, scale.toY(clamp(yh, -1.4, 1.4))); ctx.stroke(); ctx.setLineDash([]);
          drawPoint(ctx, px, scale.toY(clamp(yh, -1.4, 1.4)), '#e3b341', 8);
          stats.set('Prediction for ?', 'y = ' + yh.toFixed(2));
        }
      } else stats.set('Prediction for ?', 'hover the plot');
      stats.set('Task type', mode === 'classification' ? 'Classification' : 'Regression');
      stats.set('Answer is…', mode === 'classification' ? 'a category (0/1)' : 'a number (continuous)');
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointermove', e => {
      const p = pointerPos(cv.canvas, e);
      query = { x: clamp(scale.fromX(p.x), -1, 1), y: clamp(scale.fromY(p.y), -1, 1) };
      draw();
    });
    cv.canvas.addEventListener('pointerleave', () => { query = null; draw(); });

    const clsBtn = button('🎨 Classification', () => { mode = 'classification'; query = null; draw(); });
    const regBtn = button('📈 Regression', () => { mode = 'regression'; query = null; draw(); }, true);

    root.appendChild(demoPanel(
      'The two supervised tasks',
      'Classification carves the space into labeled regions; regression fits a curve through numeric answers. Same recipe — labeled data in, predictions out.',
      cv.canvas,
      h('div', { class: 'controls' }, [clsBtn, regBtn]),
      legend([[CLASS_COLORS[0], 'class A / data'], [CLASS_COLORS[1], 'class B'], ['#39d2c0', 'regression line'], ['#e6edf3', 'your query ?']]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>Classification vs Regression</h3>
      <table class="info-table">
        <tr><th></th><th>🎨 Classification</th><th>📈 Regression</th></tr>
        <tr><td><b>Predicts</b></td><td>A category / label</td><td>A continuous number</td></tr>
        <tr><td><b>Examples</b></td><td>spam vs not-spam · cat/dog/bird · fraud yes/no · disease diagnosis</td><td>house price · tomorrow's temperature · a customer's lifetime value</td></tr>
        <tr><td><b>Output</b></td><td>Often a probability per class (via sigmoid / softmax)</td><td>A raw number</td></tr>
        <tr><td><b>Typical loss</b></td><td>Cross-entropy</td><td>Mean Squared Error (MSE)</td></tr>
        <tr><td><b>On this site</b></td><td>Logistic Regression, KNN, SVM, Decision Trees, Neural Nets</td><td>Linear Regression, and the same models in "regression mode"</td></tr>
      </table>

      <h3>The supervised workflow</h3>
      <ol>
        <li><strong>Collect labeled data</strong> — the expensive part. Humans (or logs) provide the correct y for each x.</li>
        <li><strong>Split</strong> into training and test sets — never let the model see the test answers.</li>
        <li><strong>Train</strong> — the model adjusts its parameters to make f(x) ≈ y on the training set.</li>
        <li><strong>Evaluate</strong> on the held-out test set to estimate real-world accuracy.</li>
        <li><strong>Predict</strong> on brand-new, unlabeled inputs.</li>
      </ol>

      <div class="callout callout-warn"><div class="callout-title">⚠️ Labels are the bottleneck</div>
      Supervised learning is powerful but hungry: it needs lots of correctly-labeled examples, and labeling (a radiologist marking tumors, a human rating translations) is slow and costly. That expense is exactly why <strong>unsupervised</strong> and <strong>reinforcement</strong> learning — the next two lessons — matter so much.</div>

      <div class="callout callout-tip"><div class="callout-title">💡 You've already done this</div>
      Every model you train elsewhere on this site — the neural network playground, logistic regression, decision trees — is supervised. This lesson is the umbrella they all live under.</div>
    `));
  },
};
