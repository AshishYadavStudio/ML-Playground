// Lesson: Unsupervised Learning — clustering, dimensionality reduction, anomaly detection
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, randn, rand, makeScale, drawGrid, drawPoint, CLASS_COLORS, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'unsupervised-learning',
  emoji: '🧩',
  title: 'Unsupervised Learning',
  level: 'Beginner',
  blurb: 'No labels, no teacher — find hidden structure in raw data: groups, patterns, and oddballs.',

  render(root) {
    root.appendChild(html(`
      <p>Supervised learning needs a teacher handing over the right answers. But most of the world's data has <strong>no labels at all</strong> — just raw observations. <strong>Unsupervised learning</strong> finds structure in that raw data with nobody telling it what to look for.</p>
      <div class="formula">given only x₁, x₂, x₃, … (no answers) &nbsp;→&nbsp; discover groups, patterns, or anomalies</div>
      <p>Three main jobs: <strong>clustering</strong> (group similar things), <strong>dimensionality reduction</strong> (simplify without losing the essence), and <strong>anomaly detection</strong> (spot what doesn't fit).</p>

      <h3>1 · Clustering: find the groups</h3>
      <p>Below are data points with <strong>no labels</strong> — all grey, no categories given. Press <em>Discover</em> and watch the algorithm find natural groupings entirely on its own.</p>
    `));

    // ---- clustering demo ----
    seed(14);
    const centers = [{ x: -0.45, y: -0.35 }, { x: 0.5, y: -0.15 }, { x: 0.0, y: 0.55 }];
    let points = [];
    for (let i = 0; i < 120; i++) {
      const c = centers[i % 3];
      points.push({ x: clamp(c.x + randn() * 0.16, -1, 1), y: clamp(c.y + randn() * 0.16, -1, 1), cluster: -1 });
    }

    const cv = makeCanvas(420);
    const scale = makeScale(cv);
    let k = 3;
    let centroids = [];
    let revealed = false;
    let running = false, timer = null, iters = 0;
    const stats = statRow(['Labels given', 'Clusters found', 'Iterations']);

    function initCentroids() {
      centroids = Array.from({ length: k }, () => ({ x: rand() * 1.4 - 0.7, y: rand() * 1.4 - 0.7 }));
      points.forEach(p => p.cluster = -1);
      revealed = false; iters = 0;
    }
    initCentroids();

    function stepKMeans() {
      for (const p of points) {
        let best = 0, bd = Infinity;
        centroids.forEach((c, i) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = i; } });
        p.cluster = best;
      }
      let moved = 0;
      centroids.forEach((c, i) => {
        const mine = points.filter(p => p.cluster === i);
        if (!mine.length) return;
        const nx = mine.reduce((s, p) => s + p.x, 0) / mine.length;
        const ny = mine.reduce((s, p) => s + p.y, 0) / mine.length;
        moved += Math.hypot(nx - c.x, ny - c.y); c.x = nx; c.y = ny;
      });
      iters++;
      return moved;
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      drawGrid(cv, scale);
      for (const p of points) {
        const col = revealed && p.cluster >= 0 ? CLASS_COLORS[p.cluster % CLASS_COLORS.length] : '#8b96b2';
        drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), col, 4.5);
      }
      if (revealed) {
        centroids.forEach((c, i) => {
          const px = scale.toX(c.x), py = scale.toY(c.y);
          ctx.strokeStyle = '#05070c'; ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(px - 9, py - 9); ctx.lineTo(px + 9, py + 9); ctx.moveTo(px + 9, py - 9); ctx.lineTo(px - 9, py + 9); ctx.stroke();
          ctx.strokeStyle = CLASS_COLORS[i % CLASS_COLORS.length]; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(px - 8, py - 8); ctx.lineTo(px + 8, py + 8); ctx.moveTo(px + 8, py - 8); ctx.lineTo(px - 8, py + 8); ctx.stroke();
        });
      }
      stats.set('Labels given', 'none (0)');
      stats.set('Clusters found', revealed ? String(k) : '—');
      stats.set('Iterations', String(iters));
    }
    cv.onResize(draw);

    function stopRun() { running = false; clearTimeout(timer); discBtn.textContent = '🔍 Discover clusters'; }
    function loop() {
      if (!running) return;
      const moved = stepKMeans();
      draw();
      if (moved < 1e-4 || iters > 40) { stopRun(); }
      else timer = setTimeout(loop, 350);
    }
    onLeave(stopRun);

    const discBtn = button('🔍 Discover clusters', () => {
      if (running) { stopRun(); return; }
      revealed = true; running = true;
      discBtn.textContent = '⏸ Pause';
      loop();
    });
    const resetBtn = button('↺ Reset (hide labels)', () => { stopRun(); initCentroids(); draw(); }, true);
    const kS = slider('k (groups to find)', { min: 2, max: 5, step: 1, value: 3 }, v => { k = v; stopRun(); initCentroids(); draw(); });

    root.appendChild(demoPanel(
      'Clustering: structure from nothing',
      'Grey = unlabeled raw data. The algorithm never sees any categories — it groups points purely by closeness. Try k = 2 or 5 to see it always obeys the k you ask for.',
      cv.canvas,
      h('div', { class: 'controls' }, [discBtn, resetBtn, kS.el]),
      legend([['#8b96b2', 'unlabeled input'], [CLASS_COLORS[0], 'discovered group'], ['#e6edf3', '✕ cluster center']]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>2 · Anomaly detection: spot the oddball</h3>
      <p>Model what "normal" looks like, then flag anything far from it. Drag the sensitivity — points beyond the boundary are flagged as anomalies (fraud, faulty sensors, intrusions).</p>
    `));

    // ---- anomaly demo ----
    seed(21);
    const normalPts = [];
    for (let i = 0; i < 90; i++) normalPts.push({ x: clamp(randn() * 0.28, -1, 1), y: clamp(randn() * 0.28, -1, 1) });
    const anomalies = [{ x: 0.75, y: 0.6 }, { x: -0.7, y: 0.55 }, { x: 0.65, y: -0.7 }, { x: -0.6, y: -0.65 }];
    const allA = [...normalPts.map(p => ({ ...p, real: 'normal' })), ...anomalies.map(p => ({ ...p, real: 'anomaly' }))];
    const cv2 = makeCanvas(360);
    const scale2 = makeScale(cv2);
    let thr = 0.62;
    const stats2 = statRow(['Threshold radius', 'Flagged as anomaly']);

    function drawA() {
      const { ctx } = cv2;
      ctx.clearRect(0, 0, cv2.W, cv2.H);
      drawGrid(cv2, scale2);
      // "normal" region circle centred at origin
      const cx = scale2.toX(0), cy = scale2.toY(0);
      const rpx = Math.abs(scale2.toX(thr) - scale2.toX(0));
      ctx.beginPath(); ctx.arc(cx, cy, rpx, 0, 7);
      ctx.fillStyle = 'rgba(79,214,197,0.06)'; ctx.fill();
      ctx.strokeStyle = 'rgba(79,214,197,0.6)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      let flagged = 0;
      for (const p of allA) {
        const dist = Math.hypot(p.x, p.y);
        const isAnom = dist > thr;
        if (isAnom) flagged++;
        drawPoint(ctx, scale2.toX(p.x), scale2.toY(p.y), isAnom ? '#f87171' : '#4fd6c5', isAnom ? 6 : 4);
      }
      stats2.set('Threshold radius', thr.toFixed(2));
      stats2.set('Flagged as anomaly', String(flagged));
    }
    cv2.onResize(drawA);
    const thrS = slider('Sensitivity (radius)', { min: 0.3, max: 0.95, step: 0.01, value: 0.62, fmt: v => v.toFixed(2) }, v => { thr = v; drawA(); });

    root.appendChild(demoPanel(
      'Anomaly detection',
      'Teal = looks normal; red = flagged as anomalous. Tighten the radius and you catch more oddballs — but also more false alarms (the precision/recall trade-off returns!).',
      cv2.canvas,
      h('div', { class: 'controls' }, [thrS.el]),
      legend([['#4fd6c5', 'normal'], ['#f87171', 'anomaly']]),
      stats2.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Cluster Quest</div>
        Place centroids by eye to group unlabeled points, then see how close your eye got to real K-Means. <a href="../games/cluster-quest/" style="color:var(--accent);font-weight:700;">Play Cluster Quest →</a>
      </div>

      <h3>3 · Dimensionality reduction: simplify</h3>
      <p>The third job squeezes data with hundreds of features down to two or three — keeping the important variation so you can <em>see</em> it. That's a whole lesson of its own: see <strong>PCA &amp; Dimensionality Reduction</strong> in the Python/Classical track.</p>

      <h3>The unsupervised toolbox</h3>
      <table class="info-table">
        <tr><th>Job</th><th>Algorithms</th><th>Real-world use</th></tr>
        <tr><td><b>Clustering</b></td><td>K-Means, DBSCAN, hierarchical</td><td>Customer segments, grouping news, organizing photos</td></tr>
        <tr><td><b>Dimensionality reduction</b></td><td>PCA, t-SNE, UMAP, autoencoders</td><td>Visualization, compression, denoising, speeding up models</td></tr>
        <tr><td><b>Anomaly detection</b></td><td>Isolation Forest, one-class SVM, autoencoders</td><td>Fraud, network intrusion, equipment failure</td></tr>
      </table>

      <div class="callout callout-warn"><div class="callout-title">⚠️ Harder to evaluate</div>
      With no labels there's no simple "accuracy". Are 3 clusters better than 4? It depends on your goal — unsupervised results need human judgment to interpret, unlike supervised learning's clean test score.</div>
      <div class="callout callout-tip"><div class="callout-title">💡 Why it's the future's fuel</div>
      The internet is a near-infinite ocean of <em>unlabeled</em> text and images. Modern AI (including the LLMs lesson) is largely <strong>self-supervised</strong> — a clever twist where the data labels itself ("predict the next word") — unlocking that ocean without human annotators.</div>
    `));
  },
};
