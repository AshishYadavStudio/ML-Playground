// Lesson: Overfitting, Underfitting & Regularization — polynomial degree slider
import {
  h, html, makeCanvas, demoPanel, slider, statRow, legend,
  seed, rand, randn, makeScale, drawGrid, drawPoint, drawLineChart, clamp,
} from '../utils.js';

export default {
  id: 'overfitting',
  emoji: '🎭',
  title: 'Overfitting & Regularization',
  level: 'Beginner',
  blurb: 'The central tension of ML: models that memorize vs. models that generalize.',

  render(root) {
    root.appendChild(html(`
      <p>Make a model flexible enough and it can fit <em>anything</em> — including the random noise in your training data. Such a model looks brilliant on data it has seen and falls apart on data it hasn't. This is <strong>overfitting</strong>, and fighting it is the central craft of machine learning.</p>
      <ul>
        <li><strong>Underfitting:</strong> model too simple — misses the real pattern. High error everywhere.</li>
        <li><strong>Overfitting:</strong> model too flexible — fits noise. Tiny training error, big test error.</li>
        <li><strong>Sweet spot:</strong> just enough capacity to capture the pattern, no more.</li>
      </ul>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Train the model on training data:</strong> The model adjusts its parameters to fit the training points as well as possible — reducing training error toward zero.</li>
          <li><strong>Noise gets memorized too:</strong> Real data is noisy. A highly flexible model (many parameters) can bend to fit the random noise in each specific training point, not just the underlying pattern.</li>
          <li><strong>Training error drops, test error rises:</strong> The model looks brilliant on data it has seen but makes wild predictions on new data — the classic "U-shaped" generalization curve appears.</li>
          <li><strong>Add regularization:</strong> Penalize large parameter values by adding a term like lambda * sum(w^2) to the loss. This forces the model to stay simple unless the data strongly justifies complexity.</li>
          <li><strong>Find the sweet spot:</strong> Tune the regularization strength (or model complexity) using a validation set. The goal is the lowest test error, not the lowest training error.</li>
        </ol>
      </div>

      <h3>Try it: the degree slider</h3>
      <p>We fit a polynomial of degree <em>d</em> to noisy data sampled from a smooth curve. Blue points are <strong>training</strong> data, yellow points are held-out <strong>test</strong> data the fit never sees. Slide the degree up and watch the two errors diverge.</p>
    `));

    seed(31);
    const trueF = x => 0.6 * Math.sin(3.1 * x) * Math.exp(-0.3 * x * x);
    const makePts = n => Array.from({ length: n }, () => {
      const x = rand() * 1.8 - 0.9;
      return { x, y: clamp(trueF(x) + randn() * 0.12, -1, 1) };
    });
    const train = makePts(26);
    const test = makePts(20);

    const cv = makeCanvas(400);
    const scale = makeScale(cv);
    const chart = makeCanvas(220);
    let degree = 1;
    let lambda = 0;
    const stats = statRow(['Degree', 'Train MSE', 'Test MSE']);
    const errHistory = { deg: [], train: [], test: [] };

    // Fit polynomial with ridge regularization via normal equations (Gaussian elimination).
    function polyfit(pts, d, lam) {
      const m = d + 1;
      const A = Array.from({ length: m }, () => new Array(m + 1).fill(0));
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
          let s = 0;
          for (const p of pts) s += Math.pow(p.x, i + j);
          A[i][j] = s + (i === j && i > 0 ? lam * pts.length : 0);
        }
        let s = 0;
        for (const p of pts) s += p.y * Math.pow(p.x, i);
        A[i][m] = s;
      }
      // Gaussian elimination with partial pivoting
      for (let col = 0; col < m; col++) {
        let piv = col;
        for (let r = col + 1; r < m; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
        [A[col], A[piv]] = [A[piv], A[col]];
        if (Math.abs(A[col][col]) < 1e-12) continue;
        for (let r = 0; r < m; r++) {
          if (r === col) continue;
          const f = A[r][col] / A[col][col];
          for (let c = col; c <= m; c++) A[r][c] -= f * A[col][c];
        }
      }
      const coef = new Array(m).fill(0);
      for (let i = 0; i < m; i++) coef[i] = Math.abs(A[i][i]) > 1e-12 ? A[i][m] / A[i][i] : 0;
      return x => {
        let y = 0, xp = 1;
        for (let i = 0; i < m; i++) { y += coef[i] * xp; xp *= x; }
        return y;
      };
    }

    const mseOf = (pts, fn) => pts.reduce((s, p) => s + (p.y - fn(p.x)) ** 2, 0) / pts.length;

    function draw() {
      const fn = polyfit(train, degree, lambda);
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      drawGrid(cv, scale);
      // true function (faint)
      ctx.strokeStyle = 'rgba(139,150,168,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      for (let x = -1; x <= 1; x += 0.01) {
        const px = scale.toX(x), py = scale.toY(trueF(x));
        x <= -1 + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // fitted curve
      ctx.strokeStyle = '#39d2c0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let x = -1; x <= 1; x += 0.005) {
        const y = clamp(fn(x), -1.6, 1.6);
        const px = scale.toX(x), py = scale.toY(y);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      for (const p of train) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), '#58a6ff', 5);
      for (const p of test) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), '#e3b341', 5);

      const trE = mseOf(train, fn), teE = mseOf(test, fn);
      stats.set('Degree', String(degree));
      stats.set('Train MSE', trE.toFixed(4));
      stats.set('Test MSE', teE.toFixed(4));

      // error-vs-degree chart (computed fresh across all degrees, at current lambda)
      const trD = [], teD = [];
      for (let d = 1; d <= 15; d++) {
        const f = polyfit(train, d, lambda);
        trD.push(Math.min(0.25, mseOf(train, f)));
        teD.push(Math.min(0.25, mseOf(test, f)));
      }
      drawLineChart(chart, [
        { data: trD, color: '#58a6ff' },
        { data: teD, color: '#e3b341' },
      ], { minY: 0 });
      // marker for current degree
      const cctx = chart.ctx;
      const px = 30 + (degree - 1) / 14 * (chart.W - 60);
      cctx.strokeStyle = 'rgba(255,255,255,0.35)';
      cctx.setLineDash([4, 4]);
      cctx.beginPath(); cctx.moveTo(px, 20); cctx.lineTo(px, chart.H - 30); cctx.stroke();
      cctx.setLineDash([]);
      cctx.fillStyle = '#8b96a8';
      cctx.font = '11px Segoe UI';
      cctx.fillText('degree 1 → 15', chart.W / 2 - 30, chart.H - 8);
    }
    cv.onResize(draw);
    chart.onResize(draw);

    const degS = slider('Polynomial degree', { min: 1, max: 15, step: 1, value: 1 }, v => { degree = v; draw(); });
    const lamS = slider('Regularization λ', { min: 0, max: 0.01, step: 0.0005, value: 0, fmt: v => v.toFixed(4) }, v => { lambda = v; draw(); });

    root.appendChild(demoPanel(
      'Underfit → sweet spot → overfit',
      'Teal = fitted polynomial, dashed grey = the true underlying function. Watch the curve start wiggling through noise as degree grows.',
      cv.canvas,
      h('div', { class: 'controls' }, [degS.el, lamS.el]),
      legend([['#58a6ff', 'training data'], ['#e3b341', 'test data (unseen)'], ['#39d2c0', 'model fit'], ['#8b96a8', 'true function']]),
      stats.el,
      h('div', { style: { marginTop: '16px' } }, [
        h('div', { class: 'demo-hint' }, 'Train error (blue) vs test error (yellow) across all degrees — the classic U-shaped generalization curve:'),
        chart.canvas,
      ]),
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Overfit or Not?</div>
        A model was just fit to hidden data — guess underfit, good fit, or overfit from the curve alone before the test points reveal the truth. <a href="../games/overfit-or-not/" style="color:var(--accent);font-weight:700;">Play Overfit or Not? →</a>
      </div>

      <h3>What you should have seen</h3>
      <ul>
        <li><strong>Degree 1–2:</strong> both errors high — the line can't bend enough. <em>Underfitting.</em></li>
        <li><strong>Degree 3–5:</strong> both errors low — the model matches the true curve. <em>Sweet spot.</em></li>
        <li><strong>Degree 10+:</strong> train error keeps falling, test error blows up as the curve contorts through every noisy point. <em>Overfitting.</em></li>
      </ul>
      <h3>Regularization: the overfitting antidote</h3>
      <p>Now set the degree to 15 (badly overfit) and slowly raise <strong>λ</strong>. The wiggles get ironed out and test error drops — even though the model still <em>has</em> 16 parameters. Regularization adds a penalty on large weights to the loss:</p>
      <div class="formula">L = MSE + λ · Σ wⱼ² &nbsp;&nbsp; (L2 / "ridge" — shrinks weights) &nbsp;&nbsp;&nbsp; L = MSE + λ · Σ |wⱼ| &nbsp;&nbsp; (L1 / "lasso" — zeroes some weights out)</div>
      <p>Big weights are what let the curve swing violently; penalizing them forces the model to stay smooth unless the data <em>really</em> justifies a bend.</p>
      <h3>Other weapons against overfitting</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">📚</div><h4>More data</h4><p>The most reliable fix. Noise averages out; real patterns don't.</p></div>
        <div class="card"><div class="card-icon">✂️</div><h4>Early stopping</h4><p>Stop training when <em>validation</em> error starts rising, even if training error is still falling.</p></div>
        <div class="card"><div class="card-icon">🎲</div><h4>Dropout</h4><p>In neural nets: randomly silence neurons during training so no single pathway can memorize.</p></div>
        <div class="card"><div class="card-icon">🔀</div><h4>Data augmentation</h4><p>Create extra training examples by flipping / cropping / noising real ones.</p></div>
      </div>
      <div class="callout callout-tip"><div class="callout-title">💡 The bias–variance trade-off</div>
      Simple models have high <strong>bias</strong> (systematically wrong) but low <strong>variance</strong> (stable across datasets). Flexible models have the reverse. Total error = bias² + variance + irreducible noise — the U-shaped test curve you saw is this equation drawn in real time.</div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Bias-variance decomposition, L1 vs L2, and the Bayesian connection</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>For any model, the expected prediction error at a point x decomposes exactly into three terms:</p>
          <div class="formula">E[(y − f-hat(x))²] = Bias²(f-hat(x)) + Var(f-hat(x)) + sigma²</div>
          <p>Where <strong>Bias</strong> = E[f-hat(x)] - f(x) measures systematic error (how far the average prediction is from truth), <strong>Variance</strong> = E[(f-hat(x) - E[f-hat(x)])²] measures how much the prediction fluctuates across different training sets, and sigma² is the irreducible noise in the data that no model can eliminate.</p>
          <p><strong>L2 regularization (Ridge)</strong> adds the squared magnitude of weights to the loss:</p>
          <div class="formula">L_ridge = MSE + lambda · Σ w_j² &nbsp;&nbsp; → &nbsp;&nbsp; w* = (X<sup>T</sup>X + lambda·I)<sup>-1</sup> X<sup>T</sup>y</div>
          <p>The lambda·I term makes the matrix always invertible and shrinks all weights toward zero proportionally. Geometrically, the constraint region is a sphere — the solution is the point where the MSE contours first touch the sphere.</p>
          <p><strong>L1 regularization (Lasso)</strong> uses absolute values instead:</p>
          <div class="formula">L_lasso = MSE + lambda · Σ |w_j|</div>
          <p>The L1 constraint region is a diamond (hypercube). Because its corners lie on the axes, the MSE contours tend to touch at a corner — where some weights are exactly zero. This makes Lasso a built-in feature selector: it automatically drops irrelevant features from the model.</p>

          <h4>Intuition</h4>
          <p>Imagine fitting a curve through 5 noisy points. A degree-1 polynomial (line) cannot wiggle — it has low variance but high bias if the true shape is curved. A degree-4 polynomial passes through every point exactly — zero training error — but a different set of 5 noisy points from the same source would give a wildly different curve. The bias is zero but the variance is enormous. The best model complexity is where the sum bias² + variance is minimized.</p>
          <p>Regularization works by deliberately increasing bias (forcing simpler solutions) to achieve a larger decrease in variance. You lose a little accuracy on the training set but gain much more stability on new data — net win.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "More training data always prevents overfitting."</div>
          <p><strong>✅ Reality:</strong> More data helps, but a sufficiently flexible model can still overfit an enormous dataset. A polynomial of degree n-1 can perfectly fit n points regardless of n. In practice, if your model has more effective parameters than useful patterns in the data, overfitting is still possible. Regularization, architecture choice, and early stopping remain necessary.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "L1 and L2 regularization do essentially the same thing — they just penalize weights."</div>
          <p><strong>✅ Reality:</strong> They have fundamentally different effects. L2 (Ridge) shrinks all weights smoothly toward zero but rarely makes any exactly zero — it keeps all features in the model. L1 (Lasso) produces sparse solutions, setting many weights to exactly zero, effectively performing automatic feature selection. <strong>Elastic Net</strong> combines both: lambda_1·Σ|w_j| + lambda_2·Σw_j², getting sparsity from L1 and the stability of L2.</p>

          <h4>The Bayesian Connection</h4>
          <p>Regularization has an elegant Bayesian interpretation. L2 regularization is equivalent to placing a Gaussian prior on the weights (each weight is assumed to come from a normal distribution centered at zero). L1 regularization corresponds to a Laplace prior (sharply peaked at zero, with heavy tails). The regularization strength lambda controls how strongly the prior pulls weights toward zero. Maximum a posteriori (MAP) estimation with these priors yields exactly the Ridge and Lasso solutions, respectively — showing that regularization is not an ad hoc trick but principled Bayesian reasoning about what weights are plausible before seeing data.</p>

          <h4>Historical Context</h4>
          <p>The bias-variance decomposition was formalized by Stuart Geman, Elie Bienenstock, and Rene Doursat in their influential 1992 paper on neural networks. Ridge regression was introduced by Arthur Hoerl and Robert Kennard in 1970 to handle multicollinear features. The Lasso was proposed by Robert Tibshirani in 1996, and its ability to perform simultaneous estimation and variable selection made it one of the most cited papers in statistics. The double descent phenomenon — discovered around 2019 by Belkin et al. — challenges the classical U-curve: very overparameterized models (like deep neural networks with more parameters than data points) can generalize well again beyond the interpolation threshold, an observation still being understood theoretically.</p>
        </div>
      </details>
    `));
  },
};
