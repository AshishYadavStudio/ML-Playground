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

    root.appendChild(html(`
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Compute a linear score:</strong> Multiply each input feature by a learned weight and add a bias: z = w₁x₁ + w₂x₂ + b. This is the same linear combination used in linear regression.</li>
          <li><strong>Squash with the sigmoid:</strong> Pass z through σ(z) = 1/(1 + e⁻ᶻ), which maps any real number into a probability between 0 and 1. Large positive z → probability near 1; large negative z → near 0.</li>
          <li><strong>Apply a decision threshold:</strong> If the output probability p ≥ 0.5 (i.e., z ≥ 0), predict class 1; otherwise predict class 0. The set of points where p = 0.5 forms the decision boundary — always a straight line (or hyperplane).</li>
          <li><strong>Measure the error:</strong> Use cross-entropy loss L = −[y·log(p) + (1−y)·log(1−p)] to score predictions. This loss heavily punishes confident wrong answers — predicting 0.99 when the true label is 0 costs far more than predicting 0.6.</li>
          <li><strong>Update weights via gradient descent:</strong> Compute how each weight contributes to the total error and nudge it in the direction that reduces the loss. Repeat over many passes (epochs) until the boundary settles.</li>
        </ol>
      </div>
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
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Draw the Boundary</div>
        Drag a line to separate two classes by hand and score on accuracy and margin — how close can you get to the widest-margin separator? <a href="../games/draw-the-boundary/" style="color:var(--accent);font-weight:700;">Play Draw the Boundary →</a>
      </div>

      <h3>The catch — and the cliffhanger</h3>
      <p>Logistic regression can only ever draw a <strong>straight</strong> boundary. Feed it a dataset where the classes wrap around each other (circles, spirals, XOR) and it's stuck at ~50% no matter how long you train. Fixing that limitation is exactly why <strong>neural networks</strong> exist — they learn to warp the space until a straight cut works. You'll see it happen in the Deep Learning section.</p>
      <div class="callout callout-info"><div class="callout-title">📌 Takeaways</div>
      <ul>
        <li>Sigmoid turns a linear score into a probability; the boundary sits at p = 0.5.</li>
        <li>Cross-entropy is the natural loss for probabilities — confidently wrong = huge penalty.</li>
        <li>Despite the name, logistic <em>regression</em> is a classification algorithm — and still a workhorse baseline in industry today.</li>
      </ul></div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — The Math Behind Logistic Regression</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>Logistic regression is trained by <strong>maximum likelihood estimation (MLE)</strong>. Given N data points (xᵢ, yᵢ) where yᵢ ∈ {0, 1}, we seek the weights that make the observed labels most probable:</p>
          <div class="formula">maximize &nbsp; Π P(yᵢ | xᵢ; w, b) = Π [σ(zᵢ)^yᵢ · (1 − σ(zᵢ))^(1−yᵢ)]</div>
          <p>Taking the log converts the product into a sum — the <strong>log-likelihood</strong> — and flipping the sign gives the cross-entropy loss we minimize:</p>
          <div class="formula">L(w, b) = −(1/N) Σ [yᵢ · log σ(zᵢ) + (1 − yᵢ) · log(1 − σ(zᵢ))]</div>
          <p>This loss is <strong>convex</strong>, meaning gradient descent is guaranteed to find the global minimum — unlike neural networks, there are no local minima traps.</p>
          <h4>Decision Boundary Geometry</h4>
          <p>The decision boundary is the set of points where p = 0.5, which means z = w·x + b = 0. In 2D this is a line; in 3D a plane; in general a <strong>hyperplane</strong>. The weight vector w is perpendicular to this hyperplane, and its magnitude controls how steeply the probability transitions from 0 to 1 across the boundary.</p>
          <h4>Intuition</h4>
          <p>Think of logistic regression as a "confidence calibrator." Linear regression might predict a 1.3 probability of passing an exam — nonsense. The sigmoid squashes this to a valid probability near 1.0. The model learns where to place the transition zone (bias b) and how sharp to make it (magnitude of w).</p>
          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Logistic regression is a regression algorithm because it has 'regression' in the name."</div>
          <p><strong>✅ Reality:</strong> Despite the name, logistic regression is a <em>classification</em> algorithm. The "regression" refers to the fact that it models a continuous probability internally, but the output is a discrete class label. The name is historical — it predates modern ML terminology.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Logistic regression can only handle two classes."</div>
          <p><strong>✅ Reality:</strong> The <strong>multinomial (softmax) extension</strong> handles any number of classes. Instead of one sigmoid, you compute k linear scores and pass them through softmax: P(class j) = e^(zⱼ) / Σ e^(zₖ). This is exactly what the output layer of most neural network classifiers uses.</p>
          <h4>Historical Context</h4>
          <p>The logistic function was introduced by Pierre-Francois Verhulst in 1845 to model population growth curves. Its application to statistical classification was formalized by David Cox in 1958. Today, logistic regression remains one of the most widely deployed models in medicine (disease risk scoring), economics (discrete choice models), and industry (click-through rate prediction, baseline classifiers). It is often the first model tried and the benchmark against which fancier approaches are measured.</p>
        </div>
      </details>
    `));
  },
};
