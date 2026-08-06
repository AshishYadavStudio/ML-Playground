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
  },
};
