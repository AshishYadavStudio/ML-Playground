// Lesson: Data, Features & Train/Test Split
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, randn, rand, makeScale, drawGrid, drawPoint, CLASS_COLORS,
} from '../utils.js';

export default {
  id: 'data-features',
  emoji: '📦',
  title: 'Data, Features & Splits',
  level: 'Beginner',
  blurb: 'Garbage in, garbage out. Feature scaling and why we always hold out test data.',

  render(root) {
    root.appendChild(html(`
      <p>Models don't see the world — they see <strong>numbers in a table</strong>. Each row is an <em>example</em>, each column a <em>feature</em>. How you prepare those numbers often matters more than which algorithm you pick.</p>
      <h3>Feature scaling: why it matters</h3>
      <p>Imagine predicting whether someone buys a house from two features: <code>age</code> (20–70) and <code>income</code> (20,000–200,000). Income's raw numbers are ~3000× larger, so any distance-based or gradient-based method will be utterly dominated by income and nearly ignore age.</p>
      <p><strong>Standardization</strong> fixes this: subtract the mean and divide by the standard deviation, so every feature has mean 0 and spread 1.</p>
      <div class="formula">x′ = (x − μ) / σ &nbsp;&nbsp;&nbsp; (standardization) &nbsp;&nbsp;&nbsp;&nbsp; x′ = (x − min) / (max − min) &nbsp;&nbsp;&nbsp; (min-max scaling)</div>
    `));

    // ---- Demo 1: scaling toggle ----
    seed(11);
    const raw = [];
    for (let i = 0; i < 80; i++) {
      const label = i % 2;
      raw.push({
        age: 45 + (label ? 8 : -8) + randn() * 8,          // 20..70
        income: 100000 + (label ? 30000 : -30000) + randn() * 28000, // huge scale
        label,
      });
    }
    const cv = makeCanvas(380);
    const scale = makeScale(cv, 40);
    let scaled = false;

    function normalize(vals) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
      return v => (v - mean) / sd;
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      drawGrid(cv, scale);
      let pts;
      if (scaled) {
        const nA = normalize(raw.map(p => p.age));
        const nI = normalize(raw.map(p => p.income));
        pts = raw.map(p => ({ x: nA(p.age) / 3, y: nI(p.income) / 3, label: p.label }));
      } else {
        // plot raw values mapped naively into the same [-1,1] canvas using a shared scale
        // shared scale = the larger feature's range, so age collapses to a sliver.
        const allVals = raw.flatMap(p => [p.age, p.income]);
        const lo = Math.min(...allVals), hi = Math.max(...allVals);
        const m = v => ((v - lo) / (hi - lo)) * 2 - 1;
        pts = raw.map(p => ({ x: m(p.age), y: m(p.income), label: p.label }));
      }
      for (const p of pts) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label]);
      ctx.fillStyle = '#8b96a8';
      ctx.font = '12px Segoe UI';
      ctx.fillText(scaled ? 'age (standardized) →' : 'age (raw, same axis units as income) →', scale.toX(-0.35), cv.H - 8);
      ctx.save();
      ctx.translate(14, scale.toY(-0.2));
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(scaled ? 'income (standardized) →' : 'income (raw) →', 0, 0);
      ctx.restore();
    }
    cv.onResize(draw);

    const toggleBtn = button('✨ Standardize features', () => {
      scaled = !scaled;
      toggleBtn.textContent = scaled ? '↩ Show raw scales' : '✨ Standardize features';
      draw();
    });

    root.appendChild(demoPanel(
      'Feature scaling',
      'Raw view: both features drawn in the same units — age gets squashed into a vertical sliver and carries almost no visible information. Standardize to reveal the true structure.',
      cv.canvas,
      h('div', { class: 'controls' }, [toggleBtn]),
      legend([[CLASS_COLORS[0], "didn't buy"], [CLASS_COLORS[1], 'bought']]),
    ));

    // ---- Demo 2: train/test split ----
    root.appendChild(html(`
      <h3>Train / test split: the golden rule</h3>
      <p>A model's score on data it trained on is <strong>meaningless</strong> — it may have simply memorized the answers. Before doing anything else, we lock away a slice of the data (the <em>test set</em>) and only touch it once, at the very end, to get an honest estimate of real-world performance.</p>
    `));

    seed(23);
    const N = 60;
    const all = Array.from({ length: N }, () => ({ x: rand() * 1.8 - 0.9, y: rand() * 1.8 - 0.9, r: rand() }));
    const cv2 = makeCanvas(340);
    const scale2 = makeScale(cv2, 30);
    let testFrac = 0.25;
    const stats2 = statRow(['Training examples', 'Test examples']);

    function draw2() {
      const { ctx, W, H } = cv2;
      ctx.clearRect(0, 0, W, H);
      drawGrid(cv2, scale2);
      let nTest = 0;
      for (const p of all) {
        const isTest = p.r < testFrac;
        if (isTest) nTest++;
        drawPoint(ctx, scale2.toX(p.x), scale2.toY(p.y), isTest ? '#e3b341' : '#58a6ff', 6);
      }
      stats2.set('Training examples', String(N - nTest));
      stats2.set('Test examples', String(nTest));
    }
    cv2.onResize(draw2);

    const s = slider('Test fraction', { min: 0.05, max: 0.6, step: 0.05, value: 0.25, fmt: v => (v * 100).toFixed(0) + '%' }, v => { testFrac = v; draw2(); });

    root.appendChild(demoPanel(
      'Slicing the dataset',
      'Drag the slider — yellow points are held out for testing and the model never sees them during training. Typical splits: 70–80% train, 20–30% test.',
      cv2.canvas,
      h('div', { class: 'controls' }, [s.el]),
      legend([['#58a6ff', 'training set'], ['#e3b341', 'test set (locked away)']]),
      stats2.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-warn"><div class="callout-title">⚠️ Data leakage</div>
      If any information from the test set sneaks into training — even indirectly, like computing the scaling mean μ over <em>all</em> data before splitting — your test score becomes optimistically wrong. Always split <em>first</em>, then fit scalers on the training set only.</div>
      <h3>Types of features</h3>
      <table class="info-table">
        <tr><th>Type</th><th>Examples</th><th>Typical encoding</th></tr>
        <tr><td><b>Numerical</b></td><td>age, price, temperature</td><td>Standardize or min-max scale</td></tr>
        <tr><td><b>Categorical</b></td><td>color, country, product type</td><td>One-hot encoding (one 0/1 column per category)</td></tr>
        <tr><td><b>Ordinal</b></td><td>small / medium / large</td><td>Integer with meaningful order (1, 2, 3)</td></tr>
        <tr><td><b>Text / image / audio</b></td><td>reviews, photos</td><td>Learned embeddings (see the Advanced section!)</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Rule of thumb</div>
      In practice, data scientists spend 60–80% of their time on data cleaning and feature preparation. Better data beats a fancier model almost every time.</div>
    `));
  },
};
