// Lesson: Decision Trees — grow a tree split by split, watch regions form
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, dataXor, makeScale, drawGrid, drawPoint, CLASS_COLORS,
} from '../utils.js';

export default {
  id: 'decision-trees',
  emoji: '🌳',
  title: 'Decision Trees & Forests',
  level: 'Intermediate',
  blurb: 'Twenty questions with data: watch a tree carve space into rectangles, one greedy split at a time.',

  render(root) {
    root.appendChild(html(`
      <p>A decision tree plays <em>twenty questions</em> with your data: "Is x &gt; 0.3? Is y &gt; −0.5?" Each question splits the space with an axis-aligned cut, and each leaf region predicts the majority class inside it.</p>
      <p>Training is <strong>greedy</strong>: at every node, try all possible cuts on all features and keep the one that makes the two children as <em>pure</em> as possible (measured by <strong>Gini impurity</strong> or entropy):</p>
      <div class="formula">Gini = 1 − Σ pₖ² &nbsp;&nbsp;&nbsp; (0 = pure leaf, 0.5 = perfect 50/50 mix for 2 classes)</div>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Start with all data:</strong> Begin at the root with every training point in one group. The tree asks: "What single yes/no question best separates the classes?"</li>
          <li><strong>Try every possible split:</strong> For each feature and each threshold value, measure how "pure" the resulting two groups would be using Gini impurity (or entropy). Pick the split that produces the purest children.</li>
          <li><strong>Recurse:</strong> Apply the same process to each child node — find the best split for that subset of data. Keep going until a stopping condition is met (max depth, minimum samples, or pure leaves).</li>
          <li><strong>Assign leaf predictions:</strong> Each leaf predicts the majority class of the training points that ended up in it.</li>
          <li><strong>Classify new points:</strong> A new data point walks down the tree, answering each yes/no question, until it lands in a leaf. That leaf's majority class is the prediction.</li>
        </ol>
      </div>
      <h3>Try it: grow the tree yourself</h3>
      <p>This XOR-style dataset is <em>impossible</em> for a single straight line (try it mentally!) — but trivial for a tree. Press <strong>Grow one split</strong> repeatedly and watch the greedy algorithm carve the plane. Then use the depth slider to see overfitting appear as tiny sliver-regions around noise points.</p>
    `));

    seed(37);
    const points = dataXor(150, 0.06);
    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    let maxDepth = 6;
    let numSplits = 0; // splits revealed so far (grow animation)
    const stats = statRow(['Splits shown', 'Leaves', 'Train accuracy']);

    // ---- build full tree once (greedy CART), record split order (BFS) ----
    function gini(pts) {
      if (pts.length === 0) return 0;
      const p1 = pts.filter(p => p.label === 1).length / pts.length;
      return 1 - p1 * p1 - (1 - p1) * (1 - p1);
    }
    let splitCounter = 0;
    function buildTree(pts, depth, region) {
      const node = { pts, depth, region, order: Infinity };
      const p1 = pts.filter(p => p.label === 1).length;
      node.pred = p1 * 2 >= pts.length ? 1 : 0;
      if (depth >= 12 || pts.length < 4 || gini(pts) === 0) return node;
      // find best split
      let best = null;
      for (const axis of ['x', 'y']) {
        const vals = [...new Set(pts.map(p => p[axis]))].sort((a, b) => a - b);
        for (let i = 1; i < vals.length; i++) {
          const t = (vals[i - 1] + vals[i]) / 2;
          const L = pts.filter(p => p[axis] <= t), R = pts.filter(p => p[axis] > t);
          if (L.length === 0 || R.length === 0) continue;
          const score = (L.length * gini(L) + R.length * gini(R)) / pts.length;
          if (!best || score < best.score) best = { axis, t, score, L, R };
        }
      }
      if (!best || best.score >= gini(pts) - 1e-9) return node;
      node.axis = best.axis;
      node.t = best.t;
      return node.pending = best, node; // children attached in BFS order below
    }
    // BFS growth so "grow one split" reveals splits in intuitive order
    const rootRegion = { x0: -1, x1: 1, y0: -1, y1: 1 };
    const treeRoot = buildTree(points, 0, rootRegion);
    const queue = [treeRoot];
    const splitOrder = [];
    while (queue.length) {
      const node = queue.shift();
      if (!node.pending) continue;
      const { axis, t, L, R } = node.pending;
      delete node.pending;
      node.order = splitCounter++;
      splitOrder.push(node);
      const rL = { ...node.region }, rR = { ...node.region };
      if (axis === 'x') { rL.x1 = t; rR.x0 = t; } else { rL.y1 = t; rR.y0 = t; }
      node.left = buildTree(L, node.depth + 1, rL);
      node.right = buildTree(R, node.depth + 1, rR);
      queue.push(node.left, node.right);
    }
    const totalSplits = splitCounter;

    // classify with current visible tree (limited by numSplits and maxDepth)
    function visibleLeaf(node) {
      return node.order >= numSplits || node.depth >= maxDepth || !node.left;
    }
    function classify(x, y, node = treeRoot) {
      if (visibleLeaf(node)) return node;
      const goLeft = node.axis === 'x' ? x <= node.t : y <= node.t;
      return classify(x, y, goLeft ? node.left : node.right);
    }

    function collectLeaves(node, out = []) {
      if (visibleLeaf(node)) { out.push(node); return out; }
      collectLeaves(node.left, out);
      collectLeaves(node.right, out);
      return out;
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      // paint leaf regions
      const leaves = collectLeaves(treeRoot);
      for (const leaf of leaves) {
        const r = leaf.region;
        ctx.fillStyle = leaf.pred === 1 ? 'rgba(88,166,255,0.14)' : 'rgba(240,136,62,0.14)';
        ctx.fillRect(scale.toX(r.x0), scale.toY(r.y1), scale.toX(r.x1) - scale.toX(r.x0), scale.toY(r.y0) - scale.toY(r.y1));
      }
      drawGrid(cv, scale);
      // split lines
      (function drawSplits(node) {
        if (visibleLeaf(node)) return;
        const r = node.region;
        ctx.strokeStyle = 'rgba(230,237,243,0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (node.axis === 'x') {
          ctx.moveTo(scale.toX(node.t), scale.toY(r.y0));
          ctx.lineTo(scale.toX(node.t), scale.toY(r.y1));
        } else {
          ctx.moveTo(scale.toX(r.x0), scale.toY(node.t));
          ctx.lineTo(scale.toX(r.x1), scale.toY(node.t));
        }
        ctx.stroke();
        drawSplits(node.left);
        drawSplits(node.right);
      })(treeRoot);
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 4.5);

      let correct = 0;
      for (const p of points) if (classify(p.x, p.y).pred === p.label) correct++;
      stats.set('Splits shown', `${Math.min(numSplits, totalSplits)} / ${totalSplits}`);
      stats.set('Leaves', String(leaves.length));
      stats.set('Train accuracy', (correct / points.length * 100).toFixed(1) + '%');
    }
    cv.onResize(draw);

    const growBtn = button('🌱 Grow one split', () => { numSplits = Math.min(numSplits + 1, totalSplits); draw(); });
    const allBtn = button('Grow fully', () => { numSplits = totalSplits; draw(); }, true);
    const resetBtn = button('Reset', () => { numSplits = 0; draw(); }, true);
    const depthS = slider('Max depth', { min: 1, max: 12, step: 1, value: 6 }, v => { maxDepth = v; draw(); });

    root.appendChild(demoPanel(
      'Carving space, one question at a time',
      'Each white line is one yes/no question. Shaded regions show what each leaf would predict.',
      cv.canvas,
      h('div', { class: 'controls' }, [growBtn, allBtn, resetBtn, depthS.el]),
      legend([[CLASS_COLORS[0], 'class orange'], [CLASS_COLORS[1], 'class blue'], ['#e6edf3', 'split boundaries']]),
      stats.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Decision Tree: 20 Questions</div>
        Pick the splits yourself — classify a dataset perfectly with the shallowest tree you can build. <a href="../games/decision-tree-20-questions/" style="color:var(--accent);font-weight:700;">Play Decision Tree: 20 Questions →</a>
      </div>

      <h3>Reading the trade-offs</h3>
      <ul>
        <li>The first 2–3 splits capture the real XOR structure — huge accuracy jumps.</li>
        <li>Later splits chase individual noisy points, carving absurd slivers: the tree version of <strong>overfitting</strong>. Limiting <em>max depth</em> (or minimum samples per leaf) is the tree's regularization knob.</li>
        <li>Trees are wonderfully <strong>interpretable</strong>: you can read the learned rules out loud.</li>
      </ul>
      <h3>From one tree to a forest 🌲🌲🌲</h3>
      <p>Single trees are unstable — change a few points and the whole structure can flip. The fix is beautifully simple: <strong>train many diverse trees and average them.</strong></p>
      <div class="cards">
        <div class="card"><div class="card-icon">🌲</div><h4>Random Forest</h4><p>Train hundreds of trees, each on a random resample of the data <em>and</em> random subsets of features. Majority vote. Robust, hard to overfit, great default.</p></div>
        <div class="card"><div class="card-icon">🚀</div><h4>Gradient Boosting (XGBoost / LightGBM)</h4><p>Train small trees <em>sequentially</em>, each one correcting the errors of the ensemble so far. Consistently wins tabular-data competitions to this day.</p></div>
      </div>
      <div class="callout callout-tip"><div class="callout-title">💡 Practitioner's secret</div>
      For tabular/spreadsheet-style data, gradient-boosted trees still routinely beat deep neural networks. Deep learning dominates images, audio, and text — not every problem. Choosing the right tool <em>is</em> the skill.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — splitting criteria and tree theory</summary>
        <div class="deep-dive-body">
          <h4>Gini Impurity vs. Entropy</h4>
          <p>Both measure how "mixed" a node is. For K classes with proportions p₁, p₂, …, p_K:</p>
          <div class="formula">Gini = 1 − Σ pₖ² &nbsp;&nbsp;&nbsp;&nbsp; Entropy = −Σ pₖ log₂ pₖ</div>
          <p>A pure node (all one class) has Gini = 0 and Entropy = 0. A 50/50 split has Gini = 0.5 and Entropy = 1.0. In practice, they produce nearly identical trees — scikit-learn defaults to Gini because it's slightly faster (no logarithm).</p>

          <h4>Information Gain</h4>
          <p>The best split maximizes the <strong>information gain</strong> — the parent's impurity minus the weighted average of the children's impurities:</p>
          <div class="formula">Gain = H(parent) − [nₗ/n · H(left) + nᵣ/n · H(right)]</div>
          <p>The greedy algorithm tries every feature and every threshold, computes this gain, and picks the split with the highest value.</p>

          <h4>Pruning</h4>
          <p>A fully grown tree memorizes the training data (every leaf is pure). To generalize, we prune:</p>
          <ul>
            <li><strong>Pre-pruning:</strong> Stop splitting early — set max_depth, min_samples_split, or min_samples_leaf. Simple and fast.</li>
            <li><strong>Post-pruning (cost-complexity):</strong> Grow the full tree, then remove branches that don't improve validation accuracy enough to justify their complexity. scikit-learn's <code>ccp_alpha</code> parameter controls this.</li>
          </ul>

          <h4>Intuition</h4>
          <p>A decision tree is a flowchart that a domain expert might draw by hand — "if age > 40 and cholesterol > 200, flag as high risk." The algorithm just automates finding the best questions to ask. The rectangular decision boundaries are a direct consequence of axis-aligned splits: each question only looks at one feature at a time, creating "cuts" parallel to the axes.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Decision trees always find the globally optimal tree."</div>
          <p><strong>✅ Reality:</strong> Finding the optimal tree is NP-complete. The greedy algorithm (CART, ID3, C4.5) finds a locally optimal split at each node, which may not lead to the globally best tree. That's one reason ensembles (Random Forests, Gradient Boosting) work so well — they compensate for single trees' suboptimality.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Trees can't handle continuous features."</div>
          <p><strong>✅ Reality:</strong> Trees handle continuous features natively by testing thresholds. They also handle missing values gracefully (surrogate splits) and need no feature scaling — one of their genuine advantages over SVMs and neural networks.</p>

          <h4>Historical Context</h4>
          <p>The CART algorithm (Classification and Regression Trees) was published by Breiman, Friedman, Olshen, and Stone in 1984. Around the same time, Ross Quinlan developed ID3 (1986) and later C4.5 (1993), which used entropy-based splitting. Leo Breiman then introduced Random Forests in 2001, and Jerome Friedman formalized Gradient Boosting in 2001 — both built directly on the CART foundation.</p>
        </div>
      </details>
    `));
  },
};
