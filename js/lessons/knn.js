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
  },
};
