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
  },
};
