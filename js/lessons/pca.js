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
    `));
  },
};
