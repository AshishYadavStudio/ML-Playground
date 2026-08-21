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
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Organize data into a table:</strong> Each row is one example (a patient, a house, a transaction). Each column is a feature (age, price, zip code). The last column is typically the target variable you want to predict.</li>
          <li><strong>Split before anything else:</strong> Randomly divide data into a training set (70-80%) and a test set (20-30%). The test set is locked away and never touched until final evaluation — this prevents data leakage.</li>
          <li><strong>Handle missing values:</strong> Fill gaps with the column mean/median (numerical) or mode (categorical), or drop incomplete rows — but compute fill values from the training set only.</li>
          <li><strong>Encode categorical features:</strong> Convert text labels ("red," "blue") into numbers using one-hot encoding (one binary column per category) or ordinal encoding (for ordered categories like S/M/L).</li>
          <li><strong>Scale numerical features:</strong> Standardize (subtract mean, divide by standard deviation) or min-max scale each numeric column so that no single feature dominates by virtue of having larger raw numbers. Fit the scaler on training data, then apply it to both train and test.</li>
        </ol>
      </div>

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

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Data Leakage & Feature Scaling Math</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p><strong>Standardization</strong> (z-score normalization) transforms each feature so it has mean 0 and standard deviation 1:</p>
          <div class="formula">x' = (x − μ) / σ &nbsp;&nbsp; where &nbsp; μ = (1/n) Σ xᵢ &nbsp; and &nbsp; σ = √[(1/n) Σ (xᵢ − μ)²]</div>
          <p><strong>Min-Max scaling</strong> maps values to the [0, 1] range:</p>
          <div class="formula">x' = (x − x<sub>min</sub>) / (x<sub>max</sub> − x<sub>min</sub>)</div>
          <p><strong>Why scaling matters mathematically:</strong> Gradient descent updates parameters proportionally to the gradient, which depends on feature magnitudes. If feature A ranges 0-1 and feature B ranges 0-100,000, the gradient landscape is an extremely elongated ellipse, causing the optimizer to zig-zag slowly. After scaling, the landscape is roughly circular, and gradient descent converges much faster. Distance-based methods (KNN, K-Means, SVM) are even more affected: unscaled Euclidean distance is dominated by the largest-magnitude feature.</p>

          <h4>Intuition</h4>
          <p>Imagine measuring the similarity of houses using distance. One feature is "number of bedrooms" (1-6) and another is "price in dollars" (100,000-1,000,000). Without scaling, two houses differing by $1,000 in price would seem more different than two houses differing by 5 bedrooms — even though the bedroom difference is far more meaningful. Scaling puts every feature on equal footing so the algorithm weighs them fairly.</p>
          <p>Note that <strong>tree-based models</strong> (decision trees, random forests, gradient boosting) are immune to scaling because they split on individual features one at a time and only care about the ordering of values, not their magnitude.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> You can compute the mean and standard deviation on the entire dataset before splitting into train/test.</div>
          <p><strong>✅ Reality:</strong> This is the most common form of <strong>data leakage</strong>. Computing statistics on all data lets information from the test set "leak" into training through the scaling parameters. The correct procedure: split first, compute μ and σ from the training set only, then apply those same values to transform the test set. The test set's own mean and std are never used. In scikit-learn, this means calling <code>scaler.fit(X_train)</code> then <code>scaler.transform(X_test)</code> — never <code>scaler.fit(X_all)</code>.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> An 80/20 train/test split is always appropriate.</div>
          <p><strong>✅ Reality:</strong> The ideal split ratio depends on dataset size. With 100 examples, a 50/50 split might be better (each set needs enough data). With 10 million examples, even a 99/1 split gives 100,000 test examples — more than enough. For small datasets, <strong>k-fold cross-validation</strong> is preferred: split data into k folds, train on k−1, test on the remaining one, and rotate — giving you k test scores from all data without leakage.</p>

          <h4>Historical Context</h4>
          <p>The train/test split methodology was formalized in the 1990s as the ML community matured. The devastating impact of data leakage was highlighted by Claudia Perlich's work on KDD Cup competitions (2008), where many top submissions were later found to exploit subtle leakage. Cross-validation was introduced by Seymour Geisser in 1975. The importance of proper data pipelines was cemented by the "Unreasonable Effectiveness of Data" paper (Halevy, Norvig, Pereira, 2009), which argued that simple models on clean, large data beat complex models on poor data — a lesson that remains central to modern ML practice.</p>
        </div>
      </details>
    `));
  },
};
