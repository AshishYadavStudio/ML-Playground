// Lesson: Ensemble Methods — bagging & boosting turn many weak learners into one strong one
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend, selectBox,
  seed, dataXor, dataSpiral, dataMoons, makeScale, drawGrid, drawPoint, paintHeatmap, CLASS_COLORS, clamp,
} from '../utils.js';

export default {
  id: 'ensemble-methods',
  emoji: '🌲',
  title: 'Ensemble Methods',
  level: 'Intermediate',
  blurb: 'Many weak models > one strong model. Bagging, Random Forests, Boosting, XGBoost — the winners of tabular ML.',

  render(root) {
    root.appendChild(html(`
      <p>One shallow decision tree is a wobbly, high-variance predictor. Train a hundred of them differently and average their answers, though, and something magical happens: the errors <em>cancel</em>, and the ensemble beats any single member. That's the entire idea behind the algorithms that still win most tabular-data competitions.</p>
      <div class="cards">
        <div class="card"><div class="card-icon">🌲</div><h4>Bagging (parallel)</h4><p>Train many models <em>independently</em> on random subsets of the data. Average their predictions. Random Forests are bagging + random feature subsets per split.</p></div>
        <div class="card"><div class="card-icon">🚀</div><h4>Boosting (sequential)</h4><p>Train models <em>one after another</em>, each one focusing on what the previous ones got wrong. AdaBoost, Gradient Boosting, XGBoost, LightGBM.</p></div>
      </div>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Train many weak learners:</strong> Each model (usually a shallow decision tree) is trained on a different version of the data — a random resample (bagging) or a reweighted version (boosting).</li>
          <li><strong>Introduce diversity:</strong> In bagging, each tree sees a bootstrap sample (~63% of data) and random feature subsets. In boosting, each tree focuses on the mistakes of the previous round by upweighting misclassified examples.</li>
          <li><strong>Combine predictions:</strong> For bagging, take a majority vote (classification) or average (regression). For boosting, use a weighted vote where better-performing trees get more say.</li>
          <li><strong>Errors cancel out:</strong> Because each model makes different mistakes (they saw different data or focused on different errors), averaging them washes away individual noise — leaving the signal.</li>
          <li><strong>Result:</strong> The ensemble is more accurate and stable than any single member, often dramatically so.</li>
        </ol>
      </div>
      <h3>Try it: watch weak learners become a strong one</h3>
      <p>The dataset below is <strong>non-linear</strong> — a single depth-2 tree can barely do better than chance. Add more trees and watch the ensemble's decision boundary sharpen. Switch to <em>Boosting</em> and see how each new tree focuses on the mistakes.</p>
    `));

    // ---- demo setup ----
    seed(51);
    const DATASETS = { moons: dataMoons, xor: dataXor, spiral: dataSpiral };
    let dsName = 'moons';
    let mode = 'bagging';
    let numTrees = 1;
    let points = DATASETS[dsName](160, 0.09);
    let treeCache = { bagging: [], boosting: [], key: '' };

    const cv = makeCanvas(420);
    const scale = makeScale(cv);
    const stats = statRow(['Trees used', 'Single-tree accuracy', 'Ensemble accuracy', 'Improvement']);

    // ---- tiny axis-aligned decision stump (depth up to 2) ----
    function trainStump(pts, weights) {
      // Try all splits on x and y, pick the one minimizing weighted error for the best +/- label
      let best = { err: Infinity };
      const w = weights || pts.map(() => 1 / pts.length);
      for (const axis of ['x', 'y']) {
        const sorted = [...pts].sort((a, b) => a[axis] - b[axis]);
        for (let i = 0; i < sorted.length - 1; i++) {
          const t = (sorted[i][axis] + sorted[i + 1][axis]) / 2;
          for (const flip of [false, true]) {
            let err = 0;
            for (let k = 0; k < pts.length; k++) {
              const pred = (pts[k][axis] > t) !== flip ? 1 : 0;
              if (pred !== pts[k].label) err += w[k];
            }
            if (err < best.err) best = { err, axis, t, flip };
          }
        }
      }
      return {
        predict: p => ((p[best.axis] > best.t) !== best.flip ? 1 : 0),
        err: best.err,
      };
    }

    // Depth-2 tree: root split + one split per child (all axis-aligned)
    function trainTree2(pts, sampleWeights) {
      const root = trainStump(pts, sampleWeights);
      // partition
      const left = [], right = [];
      const lw = [], rw = [];
      pts.forEach((p, i) => {
        const goRight = (p[root._axis || '_'] > root._t) === false ? true : false;
        // easier: recompute using predict
        const isRightSide = root.predict(p) === 1;
        (isRightSide ? right : left).push(p);
        if (sampleWeights) (isRightSide ? rw : lw).push(sampleWeights[i]);
      });
      const leftStump = left.length > 2 ? trainStump(left, sampleWeights ? lw : null) : null;
      const rightStump = right.length > 2 ? trainStump(right, sampleWeights ? rw : null) : null;
      return {
        predict: p => {
          if (root.predict(p) === 1) return rightStump ? rightStump.predict(p) : (right.filter(q => q.label === 1).length * 2 >= right.length ? 1 : 0);
          return leftStump ? leftStump.predict(p) : (left.filter(q => q.label === 1).length * 2 >= left.length ? 1 : 0);
        },
      };
    }

    // Bagging: bootstrap sample the training data
    function trainBag(pts, N) {
      const trees = [];
      for (let i = 0; i < N; i++) {
        const boot = [];
        for (let k = 0; k < pts.length; k++) boot.push(pts[Math.floor(Math.random() * pts.length)]);
        trees.push(trainTree2(boot));
      }
      return {
        predict: p => {
          let vote = 0;
          for (const t of trees) vote += t.predict(p);
          return vote * 2 >= trees.length ? 1 : 0;
        },
        prob: p => {
          let vote = 0;
          for (const t of trees) vote += t.predict(p);
          return vote / trees.length;
        },
        trees,
      };
    }

    // AdaBoost-style boosting
    function trainBoost(pts, N) {
      let weights = pts.map(() => 1 / pts.length);
      const stumps = [];
      const alphas = [];
      for (let i = 0; i < N; i++) {
        const stump = trainStump(pts, weights);
        const err = Math.max(0.001, Math.min(0.499, stump.err));
        const alpha = 0.5 * Math.log((1 - err) / err);
        stumps.push(stump);
        alphas.push(alpha);
        // reweight: increase weight on misclassified
        weights = weights.map((w, k) => {
          const correct = stump.predict(pts[k]) === pts[k].label;
          return w * Math.exp(correct ? -alpha : alpha);
        });
        const z = weights.reduce((a, b) => a + b, 0);
        weights = weights.map(w => w / z);
      }
      return {
        predict: p => {
          let s = 0;
          for (let i = 0; i < stumps.length; i++) {
            const y = stumps[i].predict(p) === 1 ? 1 : -1;
            s += alphas[i] * y;
          }
          return s > 0 ? 1 : 0;
        },
        prob: p => {
          let s = 0;
          for (let i = 0; i < stumps.length; i++) {
            const y = stumps[i].predict(p) === 1 ? 1 : -1;
            s += alphas[i] * y;
          }
          return 1 / (1 + Math.exp(-2 * s));
        },
      };
    }

    function accuracyOn(model, pts) {
      let c = 0;
      for (const p of pts) if (model.predict(p) === p.label) c++;
      return c / pts.length;
    }

    function ensureCached() {
      const key = dsName + '::' + mode;
      if (treeCache.key === key) return;
      // pre-train up to 50 for whichever mode/dataset
      treeCache.key = key;
      treeCache.singleAcc = accuracyOn(trainTree2(points), points);
      treeCache.progression = [];
      // build a fresh ensemble at each N; simpler and still fast for N<=50
      for (let n = 1; n <= 50; n++) {
        const m = (mode === 'bagging') ? trainBag(points, n) : trainBoost(points, n);
        treeCache.progression.push({ n, model: m, acc: accuracyOn(m, points) });
      }
    }

    function currentModel() {
      return treeCache.progression[numTrees - 1].model;
    }

    function draw() {
      ensureCached();
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      const model = currentModel();
      paintHeatmap(cv, scale, (x, y) => model.prob({ x, y }), 44);
      drawGrid(cv, scale);
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 4.5);

      const acc = treeCache.progression[numTrees - 1].acc;
      const single = treeCache.singleAcc;
      stats.set('Trees used', String(numTrees));
      stats.set('Single-tree accuracy', (single * 100).toFixed(1) + '%');
      stats.set('Ensemble accuracy', (acc * 100).toFixed(1) + '%');
      stats.set('Improvement', ((acc - single) * 100).toFixed(1) + '%');
    }
    cv.onResize(draw);

    const modeSel = selectBox('Ensemble mode', [
      { value: 'bagging', label: '🌲 Bagging (parallel)' },
      { value: 'boosting', label: '🚀 Boosting (sequential)' },
    ], v => { mode = v; treeCache.key = ''; draw(); }, 'bagging');
    const dsSel = selectBox('Dataset', [
      { value: 'moons', label: '🌙 Moons' },
      { value: 'xor', label: '❎ XOR' },
      { value: 'spiral', label: '🌀 Spiral' },
    ], v => { dsName = v; points = DATASETS[dsName](160, 0.09); treeCache.key = ''; draw(); }, 'moons');
    const nS = slider('Number of trees', { min: 1, max: 50, step: 1, value: 1 }, v => { numTrees = v; draw(); });
    const goBtn = button('▶ Grow to 50', () => {
      let n = numTrees;
      const step = () => {
        n = Math.min(50, n + 2);
        numTrees = n;
        nS.set(n);
        draw();
        if (n < 50) setTimeout(step, 100);
      };
      step();
    });

    root.appendChild(demoPanel(
      'Weak learners become one strong learner',
      'Background = ensemble probability (orange → blue). Slide the tree count up and watch the boundary sharpen.',
      cv.canvas,
      h('div', { class: 'controls' }, [modeSel.el, dsSel.el, nS.el, goBtn]),
      legend([[CLASS_COLORS[0], 'class 0'], [CLASS_COLORS[1], 'class 1']]),
      stats.el,
    ));

    draw();

    root.appendChild(html(`
      <h3>Bagging vs Boosting — how they differ</h3>
      <table class="info-table">
        <tr><th></th><th>🌲 Bagging (Random Forest)</th><th>🚀 Boosting (XGBoost, LightGBM)</th></tr>
        <tr><td><b>Order</b></td><td>Parallel — trees don't know about each other</td><td>Sequential — each tree fixes prior mistakes</td></tr>
        <tr><td><b>What varies</b></td><td>Bootstrap sample + random features per split</td><td>Sample <em>weights</em> — hard cases get heavier</td></tr>
        <tr><td><b>Combine by</b></td><td>Majority vote / average</td><td>Weighted vote (better trees weigh more)</td></tr>
        <tr><td><b>Reduces</b></td><td><b>Variance</b> (unstable models cancel out)</td><td><b>Bias</b> (each round closes the gap)</td></tr>
        <tr><td><b>Overfits when</b></td><td>Rarely — more trees is usually safe</td><td>Yes — need early stopping and shallow trees</td></tr>
      </table>

      <h3>The Random Forest recipe</h3>
      <ol>
        <li><strong>Bootstrap</strong> the training set — sample N points <em>with replacement</em> from the original N. ~37% are left out ("out-of-bag" for free validation).</li>
        <li><strong>Grow a deep tree</strong> — but at each split, only consider a <em>random subset of features</em> (e.g. √d out of d). This prevents all trees from copying the same dominant feature.</li>
        <li><strong>Repeat</strong> for 100–1000 trees.</li>
        <li><strong>Predict</strong>: majority vote (classification) or average (regression).</li>
      </ol>

      <h3>The Gradient Boosting recipe (in one line)</h3>
      <div class="formula">Fₜ(x) = Fₜ₋₁(x) + η · h_t(x) &nbsp; where h_t is trained to predict the residuals of Fₜ₋₁</div>
      <p>Each new tree <code>h_t</code> is a tiny "patch" that predicts <em>where the current ensemble is wrong</em>. Multiply by a small learning rate η (typically 0.05–0.1), add it in, repeat. XGBoost, LightGBM and CatBoost are all industrial-strength implementations of this idea, with clever regularization, GPU support, and handling of categoricals.</p>

      <div class="callout callout-tip"><div class="callout-title">💡 Practitioner's rule</div>
      For <em>tabular data</em> (spreadsheets, CSVs, most business data), <strong>gradient-boosted trees</strong> (XGBoost / LightGBM / CatBoost) are the default that a deep neural network almost never beats. Neural nets dominate images, audio, and text — not everything. Knowing which tool to reach for is half the job.</div>

      <div class="callout callout-info"><div class="callout-title">📌 Real-world winners</div>
      Random Forests power fraud detection, feature importance for medical studies, and Kinect's body-pose recognition. Gradient boosting won Kaggle's "Higgs Boson" challenge, forms the backbone of Yandex/CatBoost's ranking, and remains the go-to for credit scoring, ad-CTR prediction, and just about anything with a spreadsheet of features.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — the math behind ensembles</summary>
        <div class="deep-dive-body">
          <h4>Why Bagging Reduces Variance</h4>
          <p>If you average M independent estimators each with variance σ², the variance of the average is σ²/M. Bootstrap samples aren't fully independent (they share ~63% of data), but the correlation ρ between trees is low enough that the variance still drops substantially:</p>
          <div class="formula">Var(ensemble) = ρσ² + (1−ρ)σ²/M</div>
          <p>Random Forests further reduce ρ by randomizing features at each split — even correlated trees become more independent.</p>

          <h4>AdaBoost Weight Update</h4>
          <p>AdaBoost trains weak learners sequentially. After each round, misclassified examples get heavier weights:</p>
          <div class="formula">αₜ = ½ ln((1 − εₜ) / εₜ) &nbsp;&nbsp;&nbsp; wᵢ ← wᵢ · exp(−αₜ · yᵢ · hₜ(xᵢ))</div>
          <p>αₜ is the learner's voting weight (better learners vote louder). εₜ is its weighted error rate. The exponential reweighting means a single misclassified point can dominate the next round — this is both AdaBoost's power and its vulnerability to outliers.</p>

          <h4>Gradient Boosting — Residual Fitting</h4>
          <p>Gradient boosting generalizes AdaBoost: each new tree fits the <em>negative gradient of the loss</em> (for MSE, this is simply the residuals):</p>
          <div class="formula">Fₜ(x) = Fₜ₋₁(x) + η · hₜ(x) &nbsp; where hₜ fits the pseudo-residuals rᵢ = −∂L/∂F(xᵢ)</div>
          <p>The learning rate η (0.01–0.1) shrinks each tree's contribution, requiring more trees but preventing overfitting. This is why XGBoost uses 500–3000 tiny trees rather than 10 large ones.</p>

          <h4>Stacking</h4>
          <p>Instead of simple voting, <strong>stacking</strong> trains a meta-learner on top. Base models (RF, SVM, NN) each make predictions, and a simple model (logistic regression) learns the best way to combine them. This captures complementary strengths — one model might excel on linear patterns while another handles nonlinearities.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "More trees in a Random Forest will eventually overfit."</div>
          <p><strong>✅ Reality:</strong> Random Forests are remarkably resistant to overfitting with more trees. The variance keeps decreasing (or plateaus) while bias stays constant. Adding trees past the plateau just wastes compute, but it won't hurt accuracy — unlike boosting, where too many rounds can overfit.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Ensembles are always better than single models."</div>
          <p><strong>✅ Reality:</strong> If the base learners are already strong and highly correlated (e.g. all trained on the same data with the same features), ensembling provides little benefit. The power comes from <em>diversity</em> — different errors canceling out.</p>

          <h4>Historical Context</h4>
          <p>Leo Breiman introduced bagging in 1996 and Random Forests in 2001. Yoav Freund and Robert Schapire proposed AdaBoost in 1996 (winning the Gödel Prize in 2003). Jerome Friedman formalized Gradient Boosting in 2001. The modern era began with Tianqi Chen's XGBoost (2014), followed by Microsoft's LightGBM (2017) and Yandex's CatBoost (2017), which optimized speed, memory, and categorical feature handling.</p>
        </div>
      </details>
    `));
  },
};
