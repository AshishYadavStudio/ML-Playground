// Lesson: PCA & Dimensionality Reduction — rotate the projection axis, find max variance
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, pointerPos,
  seed, randn, makeScale, drawGrid, drawPoint, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'pca',
  emoji: '🗜️',
  title: 'PCA & Dimensionality Reduction',
  level: 'Intermediate',
  blurb: 'Squash 2-D data onto the one line that keeps the most information. Rotate the axis and feel it.',

  render(root) {
    root.appendChild(html(`
      <p>Real datasets often have hundreds of correlated features — but the <em>interesting variation</em> usually lives in far fewer directions. <strong>Principal Component Analysis (PCA)</strong> finds the directions along which the data varies the most, so you can keep those and throw the rest away: compression with minimal information loss.</p>
      <div class="formula">PC1 = the direction of maximum variance &nbsp;·&nbsp; PC2 = max variance ⊥ PC1 &nbsp;·&nbsp; … (eigenvectors of the covariance matrix)</div>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Center the data:</strong> Subtract the mean of each feature so the cloud is centered at the origin. PCA finds directions of variance, and centering ensures those directions pass through zero.</li>
          <li><strong>Compute the covariance matrix:</strong> This d×d matrix captures how every pair of features varies together. Diagonal entries are variances; off-diagonals are covariances.</li>
          <li><strong>Find eigenvectors and eigenvalues:</strong> The eigenvectors of the covariance matrix are the principal components — the orthogonal directions of maximum variance. The eigenvalues tell you how much variance each direction captures.</li>
          <li><strong>Sort and select:</strong> Rank components by eigenvalue (largest first). Keep the top k components that capture enough variance (e.g. 95%). Discard the rest.</li>
          <li><strong>Project:</strong> Multiply each data point by the k selected eigenvectors to get its new k-dimensional coordinates. You've compressed d features into k with minimal information loss.</li>
        </ol>
      </div>
      <h3>Try it: be the algorithm</h3>
      <p>Below is a correlated 2-D cloud. <strong>Drag anywhere to rotate the projection axis</strong> — each point drops perpendicularly onto it (that's the projection, i.e. what survives if we keep only this one number per point). Your goal: rotate until the projected points are <em>as spread out as possible</em>. Then press <em>Find PC1</em> and see how close you got.</p>
    `));

    seed(83);
    // correlated cloud
    const points = [];
    for (let i = 0; i < 90; i++) {
      const t = randn() * 0.55, n = randn() * 0.16;
      points.push({ x: clamp(t * 0.86 - n * 0.5, -1, 1), y: clamp(t * 0.5 + n * 0.86, -1, 1) });
    }
    const mx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const my = points.reduce((s, p) => s + p.y, 0) / points.length;
    points.forEach(p => { p.x -= mx; p.y -= my; });

    // true PCA via covariance eigen-decomposition (2x2 closed form)
    let sxx = 0, sxy = 0, syy = 0;
    for (const p of points) { sxx += p.x * p.x; sxy += p.x * p.y; syy += p.y * p.y; }
    sxx /= points.length; sxy /= points.length; syy /= points.length;
    const theta1 = 0.5 * Math.atan2(2 * sxy, sxx - syy); // PC1 angle
    const totalVar = sxx + syy;

    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    let angle = 0.15;
    let showProjOnly = false;
    let animating = false, raf = null;
    const stats = statRow(['Axis angle', 'Variance captured', 'Best possible (PC1)']);

    function varianceAlong(a) {
      const ux = Math.cos(a), uy = Math.sin(a);
      let s = 0;
      for (const p of points) { const t = p.x * ux + p.y * uy; s += t * t; }
      return s / points.length;
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      drawGrid(cv, scale);
      const ux = Math.cos(angle), uy = Math.sin(angle);
      // axis line
      ctx.strokeStyle = '#e3b341';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(scale.toX(-1.1 * ux), scale.toY(-1.1 * uy));
      ctx.lineTo(scale.toX(1.1 * ux), scale.toY(1.1 * uy));
      ctx.stroke();
      // PC2 (perpendicular) faint
      ctx.strokeStyle = 'rgba(139,150,168,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(scale.toX(-1.1 * -uy), scale.toY(-1.1 * ux));
      ctx.lineTo(scale.toX(1.1 * -uy), scale.toY(1.1 * ux));
      ctx.stroke();
      ctx.setLineDash([]);

      for (const p of points) {
        const t = p.x * ux + p.y * uy;
        const projX = t * ux, projY = t * uy;
        if (!showProjOnly) {
          // projection line
          ctx.strokeStyle = 'rgba(88,166,255,0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(scale.toX(p.x), scale.toY(p.y));
          ctx.lineTo(scale.toX(projX), scale.toY(projY));
          ctx.stroke();
          drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), '#58a6ff', 4);
        }
        drawPoint(ctx, scale.toX(projX), scale.toY(projY), '#39d2c0', 4);
      }
      const v = varianceAlong(angle);
      stats.set('Axis angle', (angle * 180 / Math.PI).toFixed(1) + '°');
      stats.set('Variance captured', (v / totalVar * 100).toFixed(1) + '%');
      stats.set('Best possible (PC1)', (varianceAlong(theta1) / totalVar * 100).toFixed(1) + '%');
    }
    cv.onResize(draw);

    let dragging = false;
    cv.canvas.addEventListener('pointerdown', e => {
      dragging = true;
      cv.canvas.setPointerCapture(e.pointerId);
      const p = pointerPos(cv.canvas, e);
      angle = Math.atan2(scale.fromY(p.y), scale.fromX(p.x));
      draw();
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const p = pointerPos(cv.canvas, e);
      angle = Math.atan2(scale.fromY(p.y), scale.fromX(p.x));
      draw();
    });
    cv.canvas.addEventListener('pointerup', () => { dragging = false; });

    function animateTo(target) {
      animating = true;
      cancelAnimationFrame(raf);
      // normalize angle difference
      let diff = target - angle;
      while (diff > Math.PI / 2) diff -= Math.PI;
      while (diff < -Math.PI / 2) diff += Math.PI;
      const goal = angle + diff;
      (function step() {
        if (!animating) return;
        angle += (goal - angle) * 0.1;
        if (Math.abs(goal - angle) < 0.002) { angle = goal; animating = false; }
        draw();
        if (animating) raf = requestAnimationFrame(step);
      })();
    }
    onLeave(() => { animating = false; cancelAnimationFrame(raf); });

    const findBtn = button('🎯 Find PC1 (max variance)', () => animateTo(theta1));
    const worstBtn = button('Find worst axis', () => animateTo(theta1 + Math.PI / 2), true);
    const projBtn = button('Toggle: projected only', () => { showProjOnly = !showProjOnly; draw(); }, true);

    root.appendChild(demoPanel(
      'The variance-maximizing axis',
      'Blue = original 2-D points; teal = their 1-D projections onto the yellow axis. Drag to rotate. More spread in the teal points = more information kept.',
      cv.canvas,
      h('div', { class: 'controls' }, [findBtn, worstBtn, projBtn]),
      legend([['#58a6ff', 'original data'], ['#39d2c0', 'projection (kept)'], ['#e3b341', 'projection axis'], ['#8b96a8', 'PC2 (discarded)']]),
      stats.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Rotate to Compress</div>
        Rotate the axis by hand across three fresh point clouds and race the true principal component for maximum captured variance. <a href="../games/rotate-to-compress/" style="color:var(--accent);font-weight:700;">Play Rotate to Compress →</a>
      </div>

      <h3>What just happened</h3>
      <ul>
        <li>PC1 captures ~90% of this data's variance — keeping <strong>1 number instead of 2</strong> per point loses almost nothing. Real use: 784-pixel digit images → 50 PCA components with ~95% variance kept.</li>
        <li>The "worst axis" is exactly PC2 — perpendicular to PC1. The components form a new, rotated coordinate system ordered by importance.</li>
        <li>Toggle "projected only" to see what the compressed dataset actually looks like: a 1-D strip.</li>
      </ul>
      <h3>How it's computed</h3>
      <p>Center the data, form the covariance matrix, take its <strong>eigenvectors</strong> — those are the components, and the eigenvalues are the variances along them. Keep the top-k. (In practice: <code>sklearn.decomposition.PCA(n_components=k)</code>.)</p>
      <h3>PCA vs its modern cousins</h3>
      <table class="info-table">
        <tr><th>Method</th><th>Type</th><th>Best for</th></tr>
        <tr><td><b>PCA</b></td><td>Linear</td><td>Compression, denoising, speeding up other models, whitening</td></tr>
        <tr><td><b>t-SNE / UMAP</b></td><td>Nonlinear, neighborhood-preserving</td><td>2-D visualization of clusters in high-dim data (embeddings!)</td></tr>
        <tr><td><b>Autoencoders</b></td><td>Nonlinear, learned</td><td>Deep compression; see the Generative AI lesson</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Rule of thumb</div>
      Plot the cumulative explained-variance curve and keep enough components to reach 90–95%. If PC1+PC2 alone capture most of it, your "high-dimensional" data was secretly low-dimensional all along — a very common and very useful discovery.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — eigenvectors, variance, and when PCA fails</summary>
        <div class="deep-dive-body">
          <h4>The Eigenvalue Decomposition</h4>
          <p>The covariance matrix Σ of centered data X is:</p>
          <div class="formula">Σ = (1/n) XᵀX</div>
          <p>PCA decomposes this into Σ = VΛVᵀ, where V is the matrix of eigenvectors (the principal components) and Λ is a diagonal matrix of eigenvalues (the variance along each component). The i-th eigenvalue λᵢ tells you exactly how much variance PC_i captures.</p>

          <h4>Explained Variance Ratio</h4>
          <div class="formula">explained_ratio(PCᵢ) = λᵢ / Σⱼ λⱼ</div>
          <p>If PC1 has eigenvalue 9.2 and the total variance is 10.0, PC1 alone captures 92% of the information. The cumulative explained variance curve tells you how many components you need — the "scree plot" shows this as a bar chart, and the "elbow" is where you cut.</p>

          <h4>SVD — The Practical Algorithm</h4>
          <p>In practice, nobody computes the covariance matrix explicitly (it's expensive and numerically unstable for many features). Instead, PCA uses the <strong>Singular Value Decomposition</strong> (SVD) of the centered data matrix X = UΣVᵀ directly. The right singular vectors V are the principal components, and the singular values are the square roots of the eigenvalues. scikit-learn's PCA uses randomized SVD for large datasets.</p>

          <h4>Intuition</h4>
          <p>Imagine shining a flashlight at a 3D object and looking at the shadow on a wall. PCA picks the wall angle that makes the shadow as big and detailed as possible — maximizing the spread (variance) of the projected points. A bad angle would collapse the shadow into a thin line, losing most of the shape information.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "PCA finds the most important features."</div>
          <p><strong>✅ Reality:</strong> PCA finds the most important <em>directions</em>, which are typically <em>combinations</em> of all original features. PC1 might be "0.6 × height + 0.8 × weight" — not a single feature. If you want to select actual features, use feature selection methods, not PCA.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "PCA preserves all the structure in the data."</div>
          <p><strong>✅ Reality:</strong> PCA only preserves <em>linear</em> structure. If the meaningful variation is along a curve or manifold (e.g. a Swiss roll), PCA will flatten it. For nonlinear dimensionality reduction, use t-SNE, UMAP, or autoencoders.</p>

          <h4>Historical Context</h4>
          <p>Karl Pearson introduced PCA in 1901 as a way to find "lines and planes of closest fit." Harold Hotelling independently developed it in 1933. For decades it was computed via full eigendecomposition (O(d³) for d features), limiting it to small datasets. The randomized SVD algorithm (Halko, Martinsson, Tropp, 2011) made PCA practical for millions of features, enabling modern applications like face recognition (eigenfaces) and genomics.</p>
        </div>
      </details>
    `));
  },
};
