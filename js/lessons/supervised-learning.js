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

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Pair inputs with answers:</strong> Each training example is a pair (x, y) — features x and the correct label or value y that a human (or process) has provided.</li>
          <li><strong>Define a model:</strong> Choose a function family f(x; θ) with tunable parameters θ — for example, a line (linear regression), a logistic curve (logistic regression), or a deep neural network.</li>
          <li><strong>Pick a loss function:</strong> Measure how far f(x) is from y. Classification typically uses cross-entropy loss; regression uses mean squared error (MSE).</li>
          <li><strong>Optimize:</strong> Adjust θ to minimize the total loss across all training examples, usually via gradient descent — computing how each parameter should change and updating them iteratively.</li>
          <li><strong>Predict on new data:</strong> Once trained, feed new, unseen inputs into f(x; θ) to get predictions — a class label or a numeric value — without needing the answers.</li>
        </ol>
      </div>

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

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Loss Functions & the Hypothesis Space</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>Supervised learning searches for a function f that maps inputs x to outputs y. The quality of a candidate function is measured by a <strong>loss function</strong>:</p>
          <div class="formula">Mean Squared Error (regression): &nbsp; L = (1/n) Σ (yᵢ − f(xᵢ))²</div>
          <div class="formula">Cross-Entropy (classification): &nbsp; L = −(1/n) Σ [ yᵢ log(f(xᵢ)) + (1−yᵢ) log(1−f(xᵢ)) ]</div>
          <p>MSE penalizes large errors quadratically — an error of 10 costs 100× more than an error of 1. Cross-entropy measures how well predicted probabilities match true 0/1 labels, going to infinity when a confident prediction is wrong.</p>

          <h4>Intuition</h4>
          <p>The <strong>hypothesis space</strong> is the set of all functions your chosen model can represent. A linear model's hypothesis space is all possible lines (or hyperplanes); a decision tree's is all possible axis-aligned partitions. Picking a model means picking which hypothesis space to search. Too small a space (e.g., a straight line for curved data) and you underfit — the best hypothesis in your space is still bad. Too large a space (e.g., a degree-100 polynomial) and you overfit — you find a hypothesis that memorizes training noise. The bias-variance tradeoff is the art of choosing a hypothesis space that's "just right."</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> A model with 100% training accuracy is a great model.</div>
          <p><strong>✅ Reality:</strong> Perfect training accuracy often signals <strong>overfitting</strong> — the model has memorized the training data, including its noise, and will perform poorly on new data. What matters is the gap between training and test performance. A model with 92% training accuracy and 90% test accuracy is usually better than one with 100% training and 75% test accuracy.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> You should always minimize loss as much as possible.</div>
          <p><strong>✅ Reality:</strong> Pushing loss to zero on the training set typically means overfitting. Regularization techniques (L1, L2, dropout, early stopping) intentionally prevent the loss from reaching zero, trading a slightly worse training score for much better generalization.</p>

          <h4>Historical Context</h4>
          <p>The foundations of supervised learning go back to Adrien-Marie Legendre's method of least squares (1805), originally used to fit astronomical orbits. Fisher's Linear Discriminant (1936) introduced classification. The Perceptron (Rosenblatt, 1958) was the first trainable neural classifier but was limited to linearly separable data — a limitation dramatically highlighted by Minsky and Papert in 1969, leading to the first AI winter. The backpropagation algorithm (popularized by Rumelhart, Hinton & Williams, 1986) unlocked multi-layer networks and remains the engine behind modern deep learning.</p>
        </div>
      </details>
    `));
  },
};
