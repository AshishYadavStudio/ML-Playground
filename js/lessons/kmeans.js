// Lesson: K-Means Clustering — step through assign/update, add your own points
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend, pointerPos,
  seed, randn, rand, makeScale, drawGrid, drawPoint, CLASS_COLORS, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'kmeans',
  emoji: '🧲',
  title: 'K-Means Clustering',
  level: 'Intermediate',
  blurb: 'Unsupervised learning: find hidden groups with no labels at all. Step through the algorithm by hand.',

  render(root) {
    root.appendChild(html(`
      <p>Everything so far used <em>labeled</em> data. But often you only have raw data and a hunch that it contains groups: customer segments, gene families, topics in documents. <strong>Clustering</strong> finds those groups automatically — this is <strong>unsupervised learning</strong>.</p>
      <p>K-Means is the classic. Pick k (the number of clusters you want), then alternate two steps until nothing moves:</p>
      <ol>
        <li><strong>Assign:</strong> give every point to its nearest centroid (the ✕ markers).</li>
        <li><strong>Update:</strong> move each centroid to the average of the points assigned to it.</li>
      </ol>
      <div class="formula">minimize &nbsp; Σ ‖xᵢ − c(xᵢ)‖² &nbsp;&nbsp; — total squared distance from points to their assigned centroid ("inertia")</div>
      <h3>Try it: run the dance manually</h3>
      <p>Press <strong>Assign</strong> and <strong>Update</strong> alternately (or Auto-run). <strong>Click the canvas to add your own points</strong> and see the clusters adapt. Re-randomize the centroids to discover that K-Means can settle into different answers depending on where it starts!</p>
    `));

    seed(53);
    const centers = [{ x: -0.5, y: -0.4 }, { x: 0.55, y: -0.1 }, { x: 0.0, y: 0.6 }];
    let points = [];
    for (let i = 0; i < 120; i++) {
      const c = centers[i % 3];
      points.push({ x: clamp(c.x + randn() * 0.17, -1, 1), y: clamp(c.y + randn() * 0.17, -1, 1), cluster: -1 });
    }

    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    let k = 3;
    let centroids = [];
    let phase = 'assign'; // next action
    let iter = 0;
    let running = false, timer = null;
    const stats = statRow(['Iteration', 'Next step', 'Inertia']);

    function randomCentroids() {
      centroids = Array.from({ length: k }, () => ({ x: rand() * 1.6 - 0.8, y: rand() * 1.6 - 0.8 }));
      points.forEach(p => p.cluster = -1);
      phase = 'assign';
      iter = 0;
    }
    randomCentroids();

    function inertia() {
      let s = 0;
      for (const p of points) {
        if (p.cluster < 0) return NaN;
        s += (p.x - centroids[p.cluster].x) ** 2 + (p.y - centroids[p.cluster].y) ** 2;
      }
      return s;
    }

    function stepAssign() {
      for (const p of points) {
        let best = 0, bd = Infinity;
        centroids.forEach((c, i) => {
          const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
          if (d < bd) { bd = d; best = i; }
        });
        p.cluster = best;
      }
      phase = 'update';
    }
    function stepUpdate() {
      let moved = 0;
      centroids.forEach((c, i) => {
        const mine = points.filter(p => p.cluster === i);
        if (mine.length === 0) return;
        const nx = mine.reduce((s, p) => s + p.x, 0) / mine.length;
        const ny = mine.reduce((s, p) => s + p.y, 0) / mine.length;
        moved += Math.hypot(nx - c.x, ny - c.y);
        c.x = nx; c.y = ny;
      });
      phase = 'assign';
      iter++;
      return moved;
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      drawGrid(cv, scale);
      // assignment lines (light)
      ctx.lineWidth = 0.7;
      for (const p of points) {
        if (p.cluster < 0) continue;
        ctx.strokeStyle = CLASS_COLORS[p.cluster % CLASS_COLORS.length] + '2e';
        ctx.beginPath();
        ctx.moveTo(scale.toX(p.x), scale.toY(p.y));
        ctx.lineTo(scale.toX(centroids[p.cluster].x), scale.toY(centroids[p.cluster].y));
        ctx.stroke();
      }
      for (const p of points) {
        const col = p.cluster >= 0 ? CLASS_COLORS[p.cluster % CLASS_COLORS.length] : '#8b96a8';
        drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), col, 4.5);
      }
      // centroids as X
      centroids.forEach((c, i) => {
        const px = scale.toX(c.x), py = scale.toY(c.y);
        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(px - 9, py - 9); ctx.lineTo(px + 9, py + 9);
        ctx.moveTo(px + 9, py - 9); ctx.lineTo(px - 9, py + 9);
        ctx.stroke();
        ctx.strokeStyle = CLASS_COLORS[i % CLASS_COLORS.length];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px - 8, py - 8); ctx.lineTo(px + 8, py + 8);
        ctx.moveTo(px + 8, py - 8); ctx.lineTo(px - 8, py + 8);
        ctx.stroke();
      });
      const inn = inertia();
      stats.set('Iteration', String(iter));
      stats.set('Next step', phase === 'assign' ? '① assign points' : '② move centroids');
      stats.set('Inertia', isNaN(inn) ? '—' : inn.toFixed(2));
    }
    cv.onResize(draw);

    function doStep() {
      if (phase === 'assign') stepAssign();
      else {
        const moved = stepUpdate();
        if (moved < 1e-4 && running) stopRun('✓ Converged — nothing moves anymore.');
      }
      draw();
    }
    function stopRun(msg) {
      running = false;
      clearTimeout(timer);
      runBtn.textContent = '▶ Auto-run';
      if (msg) note.textContent = msg;
    }
    function loop() {
      if (!running) return;
      doStep();
      timer = setTimeout(loop, 550);
    }
    onLeave(() => stopRun());

    cv.canvas.addEventListener('pointerdown', e => {
      const p = pointerPos(cv.canvas, e);
      points.push({ x: clamp(scale.fromX(p.x), -1, 1), y: clamp(scale.fromY(p.y), -1, 1), cluster: -1 });
      draw();
    });

    const stepBtn = button('Step ▸', () => { stopRun(); doStep(); });
    const runBtn = button('▶ Auto-run', () => {
      if (running) { stopRun(); return; }
      running = true;
      note.textContent = '';
      runBtn.textContent = '⏸ Pause';
      loop();
    });
    const randBtn = button('🎲 Re-randomize centroids', () => { stopRun(); note.textContent = ''; randomCentroids(); draw(); }, true);
    const kS = slider('k (clusters)', { min: 2, max: 6, step: 1, value: 3 }, v => { k = v; stopRun(); note.textContent = ''; randomCentroids(); draw(); });
    const note = h('div', { class: 'demo-hint', style: { marginTop: '10px', color: '#3fb950' } }, '');

    root.appendChild(demoPanel(
      'The assign–update dance',
      'Click canvas to add points. ✕ = centroids. Watch inertia only ever decrease — that guarantees convergence.',
      cv.canvas,
      h('div', { class: 'controls' }, [stepBtn, runBtn, randBtn, kS.el]),
      stats.el,
      note,
    ));

    root.appendChild(html(`
      <h3>Things you can discover in the demo</h3>
      <ul>
        <li><strong>Local optima:</strong> re-randomize a few times — sometimes two centroids land in one blob and split it, while another blob gets swallowed whole. Same data, different answer! Real implementations run many random restarts (or use the smarter <em>k-means++</em> initialization) and keep the lowest-inertia result.</li>
        <li><strong>Choosing k:</strong> the algorithm never complains about a bad k — it just carves the data into however many pieces you asked for. The <em>elbow method</em> plots inertia vs k and looks for the bend.</li>
        <li><strong>Shape bias:</strong> K-Means assumes round, similar-sized clusters (it's all squared Euclidean distance). Crescent or ring shapes break it — DBSCAN or spectral clustering handle those.</li>
      </ul>
      <h3>The unsupervised family</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🧲</div><h4>Clustering</h4><p>K-Means, DBSCAN, hierarchical — find groups.</p></div>
        <div class="card"><div class="card-icon">🗜️</div><h4>Dimensionality reduction</h4><p>PCA, t-SNE, UMAP — squeeze many features into few while keeping structure. Powers every "map of the data" visualization.</p></div>
        <div class="card"><div class="card-icon">🚨</div><h4>Anomaly detection</h4><p>Model what "normal" looks like, flag what doesn't fit: fraud, machine failures, network intrusions.</p></div>
      </div>
      <div class="callout callout-tip"><div class="callout-title">💡 Where you've met K-Means today</div>
      Image compression (cluster pixel colors, keep only k of them), customer segmentation, organizing photo libraries, and initializing more sophisticated models.</div>
    `));
  },
};
