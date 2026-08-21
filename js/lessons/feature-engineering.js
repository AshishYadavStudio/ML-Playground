// Lesson: Feature Engineering — encoding, transforms, interactions, selection
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, selectBox,
  seed, rand, randn, makeScale, drawGrid, drawPoint, paintHeatmap, CLASS_COLORS, clamp,
} from '../utils.js';

export default {
  id: 'feature-engineering',
  emoji: '🛠️',
  title: 'Feature Engineering',
  level: 'Intermediate',
  blurb: 'The 80% of ML nobody tweets about. Encode, transform, combine — where good models secretly come from.',

  render(root) {
    root.appendChild(html(`
      <p>"Coming up with features is difficult, time-consuming, requires expert knowledge. Applied machine learning is basically feature engineering." — Andrew Ng. Below are the moves every practitioner reaches for before touching a model.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Understand the domain:</strong> Before touching the data, learn what each column means. Domain knowledge is what separates a good feature engineer from someone blindly running algorithms — knowing that "distance to nearest subway" matters for apartment pricing is insight no algorithm will discover on its own.</li>
          <li><strong>Encode categoricals:</strong> Convert text features into numbers: one-hot encoding for unordered categories (color, country), ordinal encoding for ordered ones (small/medium/large), or target encoding for high-cardinality features (zip codes).</li>
          <li><strong>Transform distributions:</strong> Apply log, square root, or power transforms to skewed features so that models — especially linear ones — can work with roughly normal distributions and equal-magnitude scales.</li>
          <li><strong>Create interaction features:</strong> Multiply, divide, or combine existing features to capture relationships the model can't learn on its own. For example, "price per square foot" = price / area encodes a relationship that a linear model would miss with raw price and area alone.</li>
          <li><strong>Select and prune:</strong> Remove redundant or noisy features using correlation analysis, L1 regularization, or tree-based importance scores. Fewer, better features reduce overfitting, speed up training, and improve interpretability.</li>
        </ol>
      </div>

      <h3>1 · Encoding categoricals into numbers</h3>
      <p>Most models eat numbers, not strings. The choice of encoding matters more than people realize.</p>
      <table class="info-table">
        <tr><th>Method</th><th>Turns "color = red/green/blue" into</th><th>Use when</th></tr>
        <tr><td><b>One-hot</b></td><td>3 columns: [1,0,0], [0,1,0], [0,0,1]</td><td>No ordering; few categories; linear models &amp; NNs</td></tr>
        <tr><td><b>Ordinal / Label</b></td><td>1 column: 0, 1, 2</td><td>Only if categories have real order (S/M/L)</td></tr>
        <tr><td><b>Target encoding</b></td><td>Replace with mean of target for that category</td><td>Very high cardinality (zip codes, user IDs) — beware leakage</td></tr>
        <tr><td><b>Embedding</b></td><td>Learned dense vector per category</td><td>Neural nets; huge cardinalities</td></tr>
      </table>

      <h3>2 · Feature transforms</h3>
      <p>The distribution of a feature matters as much as its values. Skewed features often help enormously after a transform.</p>
      <ul>
        <li><strong>Log / log(1+x):</strong> tames long-tailed money, counts, followers. A linear model on log-income treats "10× as rich" as one unit, which is closer to how the world actually works.</li>
        <li><strong>Standardization (z-score):</strong> subtract mean, divide by std. Puts all features on the same scale so distances (KNN, K-Means) and gradients (SGD) behave.</li>
        <li><strong>Binning / discretization:</strong> convert continuous into buckets ("under 30 / 30–50 / over 50"). Helps trees split cleanly and gives linear models non-linear steps.</li>
        <li><strong>Sqrt / Box-Cox / Yeo-Johnson:</strong> more general power transforms to pull distributions toward normal.</li>
      </ul>

      <h3>3 · Interactions: the feature that solves the puzzle</h3>
      <p>Below is a classic <strong>XOR-style</strong> dataset. Neither raw feature <code>x</code> nor <code>y</code> alone predicts anything — but the sign of <code>x·y</code> is the entire signal. Toggle features on and off and watch a logistic regression flip between useless and perfect.</p>
    `));

    seed(101);
    // XOR-ish data
    const points = [];
    for (let i = 0; i < 200; i++) {
      const x = rand() * 2 - 1, y = rand() * 2 - 1;
      const label = (x > 0) !== (y > 0) ? 1 : 0;
      // add noise
      points.push({ x: clamp(x + randn() * 0.03, -0.99, 0.99), y: clamp(y + randn() * 0.03, -0.99, 0.99), label });
    }

    let useX = true, useY = true, useXY = false, useX2 = false;
    const cv = makeCanvas(400);
    const scale = makeScale(cv);
    const stats = statRow(['Features', 'Params trained', 'Accuracy']);

    // Compute feature vector for a raw point
    function featurize(x, y) {
      const feats = [];
      if (useX) feats.push(x);
      if (useY) feats.push(y);
      if (useXY) feats.push(x * y);
      if (useX2) feats.push(x * x - y * y);
      return feats;
    }

    // Train logistic regression on the current feature set (batch GD)
    let W = [], b = 0;
    function train() {
      const first = featurize(0, 0);
      W = new Array(first.length).fill(0);
      b = 0;
      if (!W.length) return;
      const lr = 0.35;
      for (let epoch = 0; epoch < 400; epoch++) {
        let gb = 0;
        const gW = W.map(() => 0);
        for (const p of points) {
          const f = featurize(p.x, p.y);
          let z = b;
          for (let i = 0; i < W.length; i++) z += W[i] * f[i];
          const pr = 1 / (1 + Math.exp(-z));
          const err = pr - p.label;
          gb += err;
          for (let i = 0; i < W.length; i++) gW[i] += err * f[i];
        }
        const n = points.length;
        b -= lr * gb / n;
        for (let i = 0; i < W.length; i++) W[i] -= lr * gW[i] / n;
      }
    }

    function predict(x, y) {
      const f = featurize(x, y);
      if (!f.length) return 0.5;
      let z = b;
      for (let i = 0; i < W.length; i++) z += W[i] * f[i];
      return 1 / (1 + Math.exp(-z));
    }

    function accuracy() {
      let c = 0;
      for (const p of points) if ((predict(p.x, p.y) > 0.5 ? 1 : 0) === p.label) c++;
      return c / points.length;
    }

    function draw() {
      train();
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      paintHeatmap(cv, scale, (x, y) => predict(x, y), 44);
      drawGrid(cv, scale);
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 4.5);
      const featNames = [];
      if (useX) featNames.push('x');
      if (useY) featNames.push('y');
      if (useXY) featNames.push('x·y');
      if (useX2) featNames.push('x²−y²');
      stats.set('Features', featNames.length ? featNames.join(', ') : '(none)');
      stats.set('Params trained', String(W.length + 1));
      stats.set('Accuracy', (accuracy() * 100).toFixed(1) + '%');
    }
    cv.onResize(draw);

    function toggleBtn(label, getter, setter) {
      const b = h('button', { class: 'btn' + (getter() ? '' : ' secondary') }, (getter() ? '✓ ' : '') + label);
      b.addEventListener('click', () => {
        setter(!getter());
        b.className = 'btn' + (getter() ? '' : ' secondary');
        b.textContent = (getter() ? '✓ ' : '') + label;
        draw();
      });
      return b;
    }

    root.appendChild(demoPanel(
      'Toggle features → watch a linear model win or lose',
      'Same 200 points, same logistic regression. Only the input features change.',
      cv.canvas,
      h('div', { class: 'controls' }, [
        toggleBtn('x', () => useX, v => useX = v),
        toggleBtn('y', () => useY, v => useY = v),
        toggleBtn('x · y (interaction)', () => useXY, v => useXY = v),
        toggleBtn('x² − y² (quadratic)', () => useX2, v => useX2 = v),
      ]),
      legend([[CLASS_COLORS[0], 'class 0'], [CLASS_COLORS[1], 'class 1']]),
      stats.el,
    ));

    draw();

    root.appendChild(html(`
      <h3>What just happened</h3>
      <ul>
        <li>With only <code>x</code> and <code>y</code>, logistic regression gets ~50% — a coin flip. Its boundary is a straight line, and no straight line separates XOR quadrants.</li>
        <li>Add <code>x·y</code> as a feature and the same model instantly hits ~99%. You didn't switch algorithms — you gave the algorithm the <em>right feature to look at</em>.</li>
        <li>This is the entire spirit of feature engineering: encode <em>domain knowledge</em> as features so simpler, faster, more interpretable models can win.</li>
      </ul>

      <h3>4 · Feature selection: less is often more</h3>
      <p>Once you have candidates, drop the useless ones. Extra features add noise, slow training, and — for many models — actively hurt accuracy.</p>
      <table class="info-table">
        <tr><th>Method</th><th>How it picks</th><th>Notes</th></tr>
        <tr><td><b>Univariate stats</b></td><td>Correlation / chi² / mutual info with target</td><td>Cheap; misses interactions</td></tr>
        <tr><td><b>L1 regularization (Lasso)</b></td><td>Shrinks unhelpful coefficients to exactly 0</td><td>Selection built into the model fit</td></tr>
        <tr><td><b>Tree feature importance</b></td><td>How much each feature reduced impurity across splits</td><td>Free from any tree ensemble; be careful with correlated features</td></tr>
        <tr><td><b>Permutation importance</b></td><td>Shuffle one feature — how much does accuracy drop?</td><td>Model-agnostic; handles correlations better</td></tr>
        <tr><td><b>SHAP values</b></td><td>Game-theoretic per-prediction contribution</td><td>Standard for explanation on tabular boosters</td></tr>
      </table>

      <h3>Common domain-driven features</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">📅</div><h4>Datetime</h4><p>Split a timestamp into day-of-week, hour, is_weekend, days_since_signup. Cyclic features (sin/cos of hour) let linear models see periodicity.</p></div>
        <div class="card"><div class="card-icon">📍</div><h4>Geo</h4><p>Lat/long → distance-to-city-center, cluster ID, or a haversine distance to a reference point.</p></div>
        <div class="card"><div class="card-icon">📝</div><h4>Text (before embeddings)</h4><p>Length, TF-IDF, sentiment score, named-entity counts.</p></div>
        <div class="card"><div class="card-icon">🕰️</div><h4>Aggregates</h4><p>Rolling means, lags, deltas ("price change vs 7-day average") — the backbone of time-series and user-behavior features.</p></div>
      </div>

      <div class="callout callout-warn"><div class="callout-title">⚠️ Target leakage — the #1 way people fool themselves</div>
      A feature that <em>uses information from the future</em> (or from the target itself) will look magical in cross-validation and disintegrate in production. Classic culprits: aggregates computed over the whole dataset (including test), target encoding without proper out-of-fold construction, or "user's next purchase" features that in reality won't exist at inference time.</div>

      <div class="callout callout-tip"><div class="callout-title">💡 Deep learning didn't kill feature engineering</div>
      Neural nets learn features automatically for <em>images, audio, and text</em>. For tabular data, gradient-boosted trees on hand-crafted features still routinely beat deep nets — because in that regime the human still knows more about the domain than a shallow MLP does. Feature engineering is where domain expertise turns into models that ship.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Interaction Terms, Polynomial Features & Domain Knowledge</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>A linear model predicts y = w₁x₁ + w₂x₂ + b. It can only learn a flat plane through feature space — no curves, no interactions. <strong>Polynomial features</strong> expand the feature space:</p>
          <div class="formula">Original: [x₁, x₂] &nbsp;→&nbsp; Degree 2: [x₁, x₂, x₁², x₂², x₁·x₂]</div>
          <p>Now the "linear" model is actually fitting y = w₁x₁ + w₂x₂ + w₃x₁² + w₄x₂² + w₅x₁x₂ + b — a full quadratic surface. The model is still linear <em>in its parameters</em> (the weights), but nonlinear in the original features. This trick lets simple, fast, interpretable models capture complex curved boundaries.</p>
          <p><strong>Interaction terms</strong> (like x₁·x₂) capture the idea that the effect of one feature depends on another. For example, the effect of "has a pool" on house price depends on "average temperature" — a pool in Phoenix is worth more than a pool in Alaska. Without the interaction feature, a linear model can't represent this dependency.</p>
          <p>The danger of polynomial features is combinatorial explosion. With d features and degree p, the number of terms grows as:</p>
          <div class="formula">C(d + p, p) = (d + p)! / (d! · p!)</div>
          <p>With 100 features and degree 2, that's 5,151 terms. Degree 3 gives 176,851. Regularization (L1/L2) becomes essential to prevent overfitting in this expanded space.</p>

          <h4>Intuition</h4>
          <p>Feature engineering is the art of encoding what you know about the world into numbers a model can use. Consider predicting taxi ride duration. Raw features: pickup time, pickup lat/long, dropoff lat/long. Engineered features that encode domain knowledge: haversine distance between pickup and dropoff, time of day (rush hour or not), day of week (weekday vs weekend), whether it's raining. A model with these engineered features will vastly outperform one using raw coordinates, because you've pre-computed the relationships the model would struggle to discover.</p>
          <p>The XOR demo above illustrates this perfectly: no linear boundary separates the four quadrants, but the single feature x*y perfectly encodes the "same sign" vs "different sign" pattern. One brilliant feature beats a more complex model.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> More features always improve model performance.</div>
          <p><strong>✅ Reality:</strong> The <strong>curse of dimensionality</strong> means that adding features without adding proportionally more training data makes the problem harder, not easier. In high dimensions, all points become roughly equidistant, distances lose meaning, and models need exponentially more data to fill the space. A model with 5 well-chosen features often beats one with 500 noisy features.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> Feature engineering is obsolete because deep learning learns features automatically.</div>
          <p><strong>✅ Reality:</strong> Deep learning excels at learning features from raw perceptual data (images, audio, text) where humans can't easily articulate the patterns. But for <strong>tabular data</strong> — the bread and butter of most industry ML — hand-crafted features combined with gradient-boosted trees (XGBoost, LightGBM) still win most Kaggle competitions and production deployments. The reason: tabular data is low-dimensional with rich domain structure that a few hundred engineered features capture better than a neural network discovers from scratch.</p>

          <h4>Historical Context</h4>
          <p>Feature engineering has been central to ML since its earliest days. The kernel trick in SVMs (Boser, Guyon & Vapnik, 1992) is essentially automatic feature engineering — mapping data to a higher-dimensional space where it becomes linearly separable, without explicitly computing the transformed features. The term "feature engineering" became prominent in the 2010s Kaggle competition era, where competitions were consistently won by better features rather than better algorithms. Andrew Ng's widely cited observation that "applied machine learning is basically feature engineering" captures a truth that persists today: the 2023-2024 wave of tabular ML benchmarks continues to show that XGBoost with domain features outperforms deep neural networks on most structured data tasks.</p>
        </div>
      </details>
    `));
  },
};
