// Lesson: K-Nearest Neighbors — move the query point, tune k, see the vote
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend, pointerPos,
  seed, dataMoons, makeScale, drawGrid, drawPoint, paintHeatmap, CLASS_COLORS, clamp,
} from '../utils.js';

export default {
  id: 'knn',
  emoji: '🏘️',
  title: 'K-Nearest Neighbors',
  level: 'Beginner',
  blurb: 'No training at all: just ask the neighbors. Drag the mystery point and change k.',

  render(root) {
    root.appendChild(html(`
      <p>K-Nearest Neighbors (KNN) is machine learning at its most honest: to classify a new point, <strong>find the k closest training examples and let them vote</strong>. That's the whole algorithm. There is no training phase — the "model" <em>is</em> the dataset.</p>
      <div class="formula">prediction(x) = majority label among the k points nearest to x</div>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Store the training data:</strong> There is no explicit training phase — the entire dataset is memorized as-is. This makes KNN a "lazy learner."</li>
          <li><strong>Receive a new query point:</strong> When a new, unlabeled data point arrives, compute its distance to every single training example (typically Euclidean distance).</li>
          <li><strong>Sort and select neighbors:</strong> Rank all training points by distance and pick the k closest ones — these are the "neighbors" that get a vote.</li>
          <li><strong>Count the votes:</strong> Among the k neighbors, whichever class label appears most often wins. Ties can be broken randomly or by distance weighting.</li>
          <li><strong>Output the prediction:</strong> Assign the majority class to the query point. For regression tasks, output the average of the neighbors' values instead.</li>
        </ol>
      </div>
      <h3>Try it: interrogate the neighborhood</h3>
      <p><strong>Drag the white mystery point</strong> anywhere. Lines connect it to its k nearest neighbors; the circle shows the neighborhood radius. Toggle the background map to see the full decision regions — then slide k and watch the map morph from jagged (k=1) to smooth (k=25).</p>
    `));

    seed(29);
    const points = dataMoons(130, 0.10);
    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    let k = 5;
    let query = { x: 0.1, y: 0.35 };
    let showMap = false;
    let dragging = false;
    const stats = statRow(['k', 'Votes: orange', 'Votes: blue', 'Prediction']);

    function neighbors(x, y, kk) {
      return points
        .map(p => ({ p, d: (p.x - x) ** 2 + (p.y - y) ** 2 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, kk);
    }
    function vote(x, y, kk) {
      const ns = neighbors(x, y, kk);
      const c1 = ns.filter(n => n.p.label === 1).length;
      return { c0: kk - c1, c1, frac: c1 / kk, ns };
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      if (showMap) paintHeatmap(cv, scale, (x, y) => vote(x, y, k).frac, 38);
      drawGrid(cv, scale);
      const { c0, c1, ns } = vote(query.x, query.y, k);
      // neighborhood circle
      const rad = Math.sqrt(ns[ns.length - 1].d);
      const pxRad = Math.abs(scale.toX(query.x + rad) - scale.toX(query.x));
      ctx.beginPath();
      ctx.arc(scale.toX(query.x), scale.toY(query.y), pxRad, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(230,237,243,0.35)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      // connectors
      for (const n of ns) {
        ctx.strokeStyle = CLASS_COLORS[n.p.label] + 'aa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(scale.toX(query.x), scale.toY(query.y));
        ctx.lineTo(scale.toX(n.p.x), scale.toY(n.p.y));
        ctx.stroke();
      }
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 4.5);
      // highlight neighbors
      for (const n of ns) {
        ctx.beginPath();
        ctx.arc(scale.toX(n.p.x), scale.toY(n.p.y), 8, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // query point
      const pred = c1 > c0 ? 1 : 0;
      drawPoint(ctx, scale.toX(query.x), scale.toY(query.y), '#e6edf3', 9);
      ctx.beginPath();
      ctx.arc(scale.toX(query.x), scale.toY(query.y), 4, 0, 2 * Math.PI);
      ctx.fillStyle = CLASS_COLORS[pred];
      ctx.fill();

      stats.set('k', String(k));
      stats.set('Votes: orange', String(c0));
      stats.set('Votes: blue', String(c1));
      stats.set('Prediction', pred === 1 ? '🔵 blue' : '🟠 orange');
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointerdown', e => {
      dragging = true;
      cv.canvas.setPointerCapture(e.pointerId);
      const p = pointerPos(cv.canvas, e);
      query = { x: clamp(scale.fromX(p.x), -1, 1), y: clamp(scale.fromY(p.y), -1, 1) };
      draw();
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const p = pointerPos(cv.canvas, e);
      query = { x: clamp(scale.fromX(p.x), -1, 1), y: clamp(scale.fromY(p.y), -1, 1) };
      draw();
    });
    cv.canvas.addEventListener('pointerup', () => { dragging = false; });

    const kS = slider('k (neighbors)', { min: 1, max: 25, step: 2, value: 5 }, v => { k = v; draw(); });
    const mapBtn = button('🗺️ Toggle decision map', () => { showMap = !showMap; draw(); }, true);

    root.appendChild(demoPanel(
      'Ask the neighbors',
      'Drag the white point. Highlighted rings = the k voters; dashed circle = neighborhood boundary.',
      cv.canvas,
      h('div', { class: 'controls' }, [kS.el, mapBtn]),
      legend([[CLASS_COLORS[0], 'class orange'], [CLASS_COLORS[1], 'class blue'], ['#e6edf3', 'mystery point (drag me)']]),
      stats.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: KNN Detective</div>
        Guess a mystery point's class by eye before K-Nearest Neighbors reveals its verdict — then tune K and watch the answer shift. <a href="../games/knn-detective/" style="color:var(--accent);font-weight:700;">Play KNN Detective →</a>
      </div>

      <h3>The role of k — bias vs variance again</h3>
      <ul>
        <li><strong>k = 1:</strong> every training point rules its own little kingdom. Zero training error, extremely jagged boundary, very sensitive to noise — classic <em>overfitting</em>.</li>
        <li><strong>k = 25:</strong> the boundary becomes smooth and stable, but fine details get averaged away — drift toward <em>underfitting</em>. (Take k = all points and you always predict the majority class!)</li>
        <li>In practice: choose k with cross-validation; odd k avoids tie votes.</li>
      </ul>
      <h3>Strengths &amp; weaknesses</h3>
      <table class="info-table">
        <tr><th>👍 Strengths</th><th>👎 Weaknesses</th></tr>
        <tr><td>No training; trivially simple; naturally handles multi-class; boundary can be any shape</td><td>Prediction is slow (search all points); memory-hungry; struggles in high dimensions; distances need scaled features</td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The curse of dimensionality</div>
      In high-dimensional spaces, <em>everything is far from everything</em> — the ratio between the nearest and farthest neighbor distance approaches 1, and "nearest" stops meaning anything. KNN shines in low dimensions with meaningful distance metrics, e.g. on learned embeddings (see the Embeddings lesson).</div>
      <div class="callout callout-tip"><div class="callout-title">💡 Where you've met KNN today</div>
      "Customers who bought this also bought…", face-recognition lookup, image deduplication, and vector-database retrieval behind modern AI chat systems are all nearest-neighbor searches at heart.</div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Distance Metrics and the Curse of Dimensionality</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>KNN relies entirely on a distance function. The most common choices belong to the <strong>Minkowski family</strong>:</p>
          <div class="formula">d(x, y) = (Σ |xᵢ − yᵢ|ᵖ)^(1/p)</div>
          <p><strong>p = 2</strong> gives <strong>Euclidean distance</strong> — straight-line distance, the default. <strong>p = 1</strong> gives <strong>Manhattan distance</strong> — sum of absolute differences along each axis, like walking on a city grid. <strong>p → ∞</strong> gives <strong>Chebyshev distance</strong> — the maximum difference along any single axis. The choice of p changes the shape of the "neighborhood ball": circles for p=2, diamonds for p=1, squares for p=∞.</p>
          <h4>The Curse of Dimensionality</h4>
          <p>In high dimensions, distances become almost meaningless. Consider a unit hypercube in d dimensions. The volume of an inscribed hypersphere relative to the cube is:</p>
          <div class="formula">V_sphere / V_cube = π^(d/2) / (2^d · Γ(d/2 + 1))</div>
          <p>At d = 10 this ratio is about 0.25%; by d = 100 it is astronomically small. This means almost all data points end up in the "corners" far from the center, and the ratio of nearest-to-farthest neighbor distance approaches 1. When all points are roughly equidistant, the notion of "nearest neighbor" loses meaning.</p>
          <h4>Weighted KNN</h4>
          <p>Standard KNN gives every neighbor an equal vote. <strong>Distance-weighted KNN</strong> gives closer neighbors more influence by weighting each vote as 1/d(x, neighbor). This makes the boundary smoother and often improves accuracy, especially at larger k values.</p>
          <h4>Intuition</h4>
          <p>KNN embodies the simplest inductive assumption: "similar inputs produce similar outputs." It makes no assumption about the shape of the decision boundary — the boundary emerges organically from the data layout. This flexibility is its greatest strength and its greatest weakness: it can model any boundary shape, but it needs dense data to do so.</p>
          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "KNN is too simple to be useful in practice."</div>
          <p><strong>✅ Reality:</strong> KNN (and its approximate variants) powers billion-scale retrieval systems. Vector databases like Pinecone, Weaviate, and FAISS use approximate nearest-neighbor search to find relevant documents, images, and embeddings. The algorithm is simple; the engineering to make it fast at scale is where the sophistication lives.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "You should always use Euclidean distance."</div>
          <p><strong>✅ Reality:</strong> Euclidean distance treats all features equally and is sensitive to scale. If one feature ranges from 0 to 1000 while another ranges from 0 to 1, the first feature dominates. Always <strong>normalize or standardize features</strong> before applying KNN, and consider domain-specific distance metrics (e.g., cosine similarity for text embeddings).</p>
          <h4>Historical Context</h4>
          <p>The nearest-neighbor rule was first analyzed by Evelyn Fix and Joseph Hodges in 1951 (unpublished until 1989). Cover and Hart proved in 1967 that as the dataset grows to infinity, 1-NN's error rate is at most twice the Bayes-optimal rate — a remarkable guarantee for such a simple algorithm. Today, approximate nearest-neighbor algorithms (locality-sensitive hashing, HNSW graphs) make KNN practical even on billions of high-dimensional vectors.</p>
        </div>
      </details>
    `));
  },
};
