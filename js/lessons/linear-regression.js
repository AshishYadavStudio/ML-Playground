// Lesson: Linear Regression — drag the line, watch gradient descent fit it
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, pointerPos,
  seed, randn, rand, makeScale, drawGrid, drawPoint, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'linear-regression',
  emoji: '📈',
  title: 'Linear Regression',
  level: 'Beginner',
  blurb: 'Fit a line through points by hand, then let gradient descent do it — and see who wins.',

  render(root) {
    root.appendChild(html(`
      <p>Linear regression is the "hello world" of machine learning: predict a number (house price, temperature, exam score) as a <strong>straight-line function</strong> of an input.</p>
      <div class="formula">ŷ = w·x + b &nbsp;&nbsp;&nbsp;&nbsp; w = slope (weight), &nbsp; b = intercept (bias)</div>
      <p>How do we know which line is <em>best</em>? We measure the <strong>error</strong>: for each point, take the vertical gap between the point and the line (the <em>residual</em>), square it, and average over all points. That's the <strong>Mean Squared Error (MSE)</strong>.</p>
      <div class="formula">MSE = (1/n) Σ (yᵢ − ŷᵢ)² &nbsp;&nbsp; — &nbsp; the best line is the one that makes this smallest</div>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Collect paired data:</strong> Gather observations (x, y) — e.g., house size and price. Each pair is one training example.</li>
          <li><strong>Propose a line:</strong> Pick initial values for slope w and intercept b. The line predicts y-hat = w·x + b for every input x.</li>
          <li><strong>Measure residuals:</strong> For each point, compute the vertical gap between the actual y and the prediction y-hat. These gaps are the residuals.</li>
          <li><strong>Square and average the residuals:</strong> Squaring makes all errors positive and penalizes large errors more than small ones. The average of these squared residuals is the Mean Squared Error (MSE).</li>
          <li><strong>Minimize the MSE:</strong> Adjust w and b to make the MSE as small as possible — either with a closed-form formula (the normal equation) or iteratively via gradient descent.</li>
        </ol>
      </div>

      <h3>Try it: minimize the error yourself</h3>
      <p>Drag the two <strong>yellow handles</strong> to move the line. The red bars are the residuals — the errors you're trying to shrink. Get the MSE as low as you can, then press <em>Fit with gradient descent</em> to see the machine glide to the optimum.</p>
    `));

    seed(19);
    const trueW = 0.7, trueB = 0.1;
    const points = Array.from({ length: 40 }, () => {
      const x = rand() * 1.7 - 0.85;
      return { x, y: clamp(trueW * x + trueB + randn() * 0.16, -0.95, 0.95) };
    });

    const cv = makeCanvas(420);
    const scale = makeScale(cv);
    let w = -0.5, b = -0.4;   // start deliberately bad
    let animating = false, raf = null;
    let bestSoFar = Infinity;

    const stats = statRow(['MSE', 'Your best', 'w (slope)', 'b (intercept)']);

    const mse = (ww, bb) => points.reduce((s, p) => s + (p.y - (ww * p.x + bb)) ** 2, 0) / points.length;

    // handles at x = -0.7 and x = 0.7
    const HX = [-0.7, 0.7];
    let dragging = -1;

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      drawGrid(cv, scale);
      // residuals
      ctx.strokeStyle = 'rgba(248,81,73,0.55)';
      ctx.lineWidth = 1.5;
      for (const p of points) {
        const yh = w * p.x + b;
        ctx.beginPath();
        ctx.moveTo(scale.toX(p.x), scale.toY(p.y));
        ctx.lineTo(scale.toX(p.x), scale.toY(yh));
        ctx.stroke();
      }
      // line
      ctx.strokeStyle = '#39d2c0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scale.toX(-1), scale.toY(w * -1 + b));
      ctx.lineTo(scale.toX(1), scale.toY(w * 1 + b));
      ctx.stroke();
      // data
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), '#58a6ff', 4.5);
      // handles
      for (const hx of HX) {
        const px = scale.toX(hx), py = scale.toY(w * hx + b);
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, 2 * Math.PI);
        ctx.fillStyle = '#e3b341';
        ctx.fill();
        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      const m = mse(w, b);
      if (!animating) bestSoFar = Math.min(bestSoFar, m);
      stats.set('MSE', m.toFixed(4));
      stats.set('Your best', bestSoFar === Infinity ? '—' : bestSoFar.toFixed(4));
      stats.set('w (slope)', w.toFixed(3));
      stats.set('b (intercept)', b.toFixed(3));
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointerdown', e => {
      const p = pointerPos(cv.canvas, e);
      dragging = -1;
      HX.forEach((hx, i) => {
        const px = scale.toX(hx), py = scale.toY(w * hx + b);
        if (Math.hypot(p.x - px, p.y - py) < 22) dragging = i;
      });
      if (dragging >= 0) cv.canvas.setPointerCapture(e.pointerId);
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (dragging < 0 || animating) return;
      const p = pointerPos(cv.canvas, e);
      const newY = clamp(scale.fromY(p.y), -1.5, 1.5);
      // keep the other handle's y fixed, solve for new w, b
      const other = 1 - dragging;
      const yOther = w * HX[other] + b;
      w = (dragging === 1 ? (newY - yOther) : (yOther - newY)) / (HX[1] - HX[0]);
      b = yOther - w * HX[other];
      draw();
    });
    cv.canvas.addEventListener('pointerup', () => { dragging = -1; });

    function fitStep() {
      if (!animating) return;
      // gradient of MSE wrt w, b
      for (let k = 0; k < 3; k++) {
        let gw = 0, gb = 0;
        for (const p of points) {
          const err = (w * p.x + b) - p.y;
          gw += 2 * err * p.x;
          gb += 2 * err;
        }
        gw /= points.length; gb /= points.length;
        w -= 0.35 * gw;
        b -= 0.35 * gb;
        if (Math.hypot(gw, gb) < 1e-4) { animating = false; break; }
      }
      draw();
      if (animating) raf = requestAnimationFrame(fitStep);
    }

    const fitBtn = button('▶ Fit with gradient descent', () => {
      animating = true;
      cancelAnimationFrame(raf);
      fitStep();
    });
    const resetBtn = button('Reset line', () => {
      animating = false;
      cancelAnimationFrame(raf);
      w = -0.5; b = -0.4; bestSoFar = Infinity;
      draw();
    }, true);
    onLeave(() => { animating = false; cancelAnimationFrame(raf); });

    root.appendChild(demoPanel(
      'Fit the line',
      'Drag the yellow handles to minimize MSE. Red bars = residual errors (their squared average is what we minimize).',
      cv.canvas,
      h('div', { class: 'controls' }, [fitBtn, resetBtn]),
      legend([['#58a6ff', 'data points'], ['#39d2c0', 'model line ŷ = wx + b'], ['#f85149', 'residuals'], ['#e3b341', 'drag handles']]),
      stats.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Fit the Line</div>
        Drag a line to minimize error against a fresh noisy scatter, then see how close you got to the real least-squares fit. <a href="../games/fit-the-line/" style="color:var(--accent);font-weight:700;">Play Fit the Line →</a>
      </div>

      <h3>What did gradient descent just do?</h3>
      <p>It computed which direction to nudge <code>w</code> and <code>b</code> so the MSE decreases fastest — the <strong>gradient</strong> — and took a small step that way, repeatedly. You'll dissect exactly how in the next lesson.</p>
      <p>For plain linear regression there's even a closed-form solution (the <em>normal equation</em>), but gradient descent is the method that scales up to neural networks with billions of parameters, so it's the one worth internalizing.</p>
      <h3>Beyond one input</h3>
      <p>Real problems have many features. The model becomes a weighted sum — geometrically a plane (or hyperplane) instead of a line, but the idea is identical:</p>
      <div class="formula">ŷ = w₁x₁ + w₂x₂ + … + w_d x_d + b</div>
      <div class="callout callout-info"><div class="callout-title">📌 Takeaways</div>
      <ul>
        <li>A model is just a function with tunable knobs (parameters <code>w</code>, <code>b</code>).</li>
        <li>A <strong>loss function</strong> (MSE) turns "how good is this line?" into a single number.</li>
        <li>Training = systematically turning the knobs to shrink the loss.</li>
      </ul></div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — The normal equation, R-squared, and regression assumptions</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>For multiple linear regression y = Xw + epsilon, the optimal weights that minimize MSE have a closed-form solution called the <strong>normal equation</strong>:</p>
          <div class="formula">w* = (X<sup>T</sup>X)<sup>-1</sup> X<sup>T</sup>y</div>
          <p>This comes from setting the gradient of the MSE to zero: nabla_w MSE = -2X<sup>T</sup>(y - Xw) = 0, which rearranges to X<sup>T</sup>Xw = X<sup>T</sup>y. When X<sup>T</sup>X is invertible, you get the formula above. The computational cost is O(d<sup>3</sup>) for the matrix inverse (d = number of features), which is why gradient descent is preferred when d is large.</p>
          <p>The <strong>coefficient of determination R-squared</strong> measures how much variance in y the model explains:</p>
          <div class="formula">R² = 1 − SS<sub>res</sub> / SS<sub>tot</sub> = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − y-bar)²</div>
          <p>R² = 1 means the model explains all variance (perfect fit). R² = 0 means it does no better than predicting the mean. R² can be negative if the model is worse than the mean — which happens with an inappropriate model or when evaluating on new data.</p>

          <h4>Intuition</h4>
          <p>The normal equation finds the point where the residual vector (y - Xw) is orthogonal to the column space of X — geometrically, it projects y onto the subspace spanned by the features. MSE uses squared errors rather than absolute errors because (1) it yields a smooth, differentiable loss with a unique minimum, (2) it corresponds to maximum likelihood estimation when the errors are normally distributed, and (3) it penalizes large errors disproportionately, which is desirable when big mistakes are much worse than small ones.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Linear regression assumes y is a linear function of x."</div>
          <p><strong>✅ Reality:</strong> "Linear" refers to the parameters, not the input. You can model curves by including polynomial features (x², x³) or transformations (log x, sqrt x) — the model is still linear in the weights w. The key assumption is linearity in parameters: y = w₁·f₁(x) + w₂·f₂(x) + ... + b.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "A high R² means the model is good and trustworthy."</div>
          <p><strong>✅ Reality:</strong> R² always increases (or stays the same) when you add more features, even useless random ones. Use <strong>adjusted R²</strong> that penalizes model complexity, or better yet, evaluate on held-out test data. A high R² on training data with a low R² on test data is a classic sign of overfitting.</p>

          <h4>Key Assumptions of Linear Regression</h4>
          <p>For the normal equation to give the Best Linear Unbiased Estimator (BLUE, via the Gauss-Markov theorem), these assumptions must hold: (1) <strong>Linearity</strong> — the true relationship is linear in parameters; (2) <strong>Independence</strong> — observations are independent of each other; (3) <strong>Homoscedasticity</strong> — the variance of residuals is constant across all values of x; (4) <strong>No multicollinearity</strong> — features are not perfectly correlated (otherwise X<sup>T</sup>X is singular). For valid confidence intervals, you additionally need (5) <strong>Normality</strong> — residuals are normally distributed.</p>

          <h4>Historical Context</h4>
          <p>The method of least squares was independently developed by Adrien-Marie Legendre (published 1805) and Carl Friedrich Gauss (who claimed to have used it since 1795). Gauss applied it to predict the orbit of the asteroid Ceres from limited observations — a triumph that made the method famous. Francis Galton coined the term "regression" in the 1880s while studying the heights of parents and children: tall parents tended to have children closer to the average height, a phenomenon he called "regression toward mediocrity" (now "regression to the mean"). The term stuck even though modern regression has nothing inherently to do with this biological observation.</p>
        </div>
      </details>
    `));
  },
};
