// Lesson: Support Vector Machines — max margin (draggable points) + the kernel trick
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend, pointerPos,
  seed, randn, makeScale, drawGrid, drawPoint, CLASS_COLORS, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'svm',
  emoji: '🛣️',
  title: 'Support Vector Machines',
  level: 'Intermediate',
  blurb: 'Not just any separating line — the one with the widest safety margin. Drag points and watch it react.',

  render(root) {
    root.appendChild(html(`
      <p>Many lines can separate two classes — which one should you pick? The SVM's answer: the one with the <strong>widest possible margin</strong>, the thickest "street" you can draw between the classes. A wide margin means new points near the boundary are less likely to be misclassified.</p>
      <div class="formula">maximize margin &nbsp;⇔&nbsp; minimize ‖w‖² &nbsp; subject to &nbsp; yᵢ(w·xᵢ + b) ≥ 1 &nbsp; for every point</div>
      <p>The remarkable part: the final boundary depends <strong>only on the few points touching the street's edges</strong> — the <em>support vectors</em>. Every other point could be deleted without changing anything.</p>
      <h3>Try it: drag the points</h3>
      <p>The boundary retrains live as you drag. Notice that dragging an interior point does <em>nothing</em>, while dragging a highlighted support vector reshapes the whole street. Lower <strong>C</strong> to let the model tolerate points inside the margin (a "soft margin") — more stability, less purity.</p>
    `));

    seed(71);
    let points = [];
    for (let i = 0; i < 22; i++) {
      if (i % 2 === 0) points.push({ x: clamp(-0.45 + randn() * 0.22, -0.95, 0.95), y: clamp(-0.35 + randn() * 0.22, -0.95, 0.95), label: -1 });
      else points.push({ x: clamp(0.45 + randn() * 0.22, -0.95, 0.95), y: clamp(0.35 + randn() * 0.22, -0.95, 0.95), label: 1 });
    }

    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    let C = 10;
    let W = { w1: 0.5, w2: 0.5, b: 0 };
    let dragging = null;
    const stats = statRow(['Margin width', 'Support vectors', 'Violations']);

    // train linear soft-margin SVM by subgradient descent on hinge loss (fast, small n)
    function train() {
      let w1 = W.w1, w2 = W.w2, b = W.b;
      const lam = 1 / (C * points.length);
      for (let t = 1; t <= 900; t++) {
        const lr = 1 / (lam * (t + 50)) / points.length * 0.8;
        let g1 = lam * w1 * points.length, g2 = lam * w2 * points.length, gb = 0;
        for (const p of points) {
          if (p.label * (w1 * p.x + w2 * p.y + b) < 1) {
            g1 -= p.label * p.x;
            g2 -= p.label * p.y;
            gb -= p.label;
          }
        }
        w1 -= lr * g1; w2 -= lr * g2; b -= lr * gb * 0.5;
      }
      W = { w1, w2, b };
    }

    function marginOf(p) { return p.label * (W.w1 * p.x + W.w2 * p.y + W.b); }

    function lineSeg(off) {
      // w1*x + w2*y + b = off  → clip to box
      const pts = [];
      const { w1, w2, b } = W;
      for (const x of [-1, 1]) if (Math.abs(w2) > 1e-6) pts.push({ x, y: (off - b - w1 * x) / w2 });
      for (const y of [-1, 1]) if (Math.abs(w1) > 1e-6) pts.push({ x: (off - b - w2 * y) / w1, y });
      return pts.filter(p => p.x >= -1.02 && p.x <= 1.02 && p.y >= -1.02 && p.y <= 1.02).slice(0, 2);
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      // margin band fill
      const s0 = lineSeg(-1), s1 = lineSeg(1);
      if (s0.length === 2 && s1.length === 2) {
        ctx.fillStyle = 'rgba(188,140,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(scale.toX(s0[0].x), scale.toY(s0[0].y));
        ctx.lineTo(scale.toX(s0[1].x), scale.toY(s0[1].y));
        ctx.lineTo(scale.toX(s1[1].x), scale.toY(s1[1].y));
        ctx.lineTo(scale.toX(s1[0].x), scale.toY(s1[0].y));
        ctx.closePath();
        ctx.fill();
      }
      drawGrid(cv, scale);
      // margin edges + boundary
      for (const [off, style, width] of [[-1, 'rgba(188,140,255,0.7)', 1.5], [1, 'rgba(188,140,255,0.7)', 1.5], [0, '#e6edf3', 2.5]]) {
        const seg = lineSeg(off);
        if (seg.length < 2) continue;
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        if (off !== 0) ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(scale.toX(seg[0].x), scale.toY(seg[0].y));
        ctx.lineTo(scale.toX(seg[1].x), scale.toY(seg[1].y));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      let sv = 0, viol = 0;
      for (const p of points) {
        const m = marginOf(p);
        const col = CLASS_COLORS[p.label === 1 ? 1 : 0];
        drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), col, 6);
        if (m < 1.05) { // support vector or violator
          sv++;
          if (m < 0) viol++;
          ctx.beginPath();
          ctx.arc(scale.toX(p.x), scale.toY(p.y), 10, 0, 2 * Math.PI);
          ctx.strokeStyle = m < 0 ? '#f85149' : '#e3b341';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
      const norm = Math.hypot(W.w1, W.w2);
      stats.set('Margin width', norm > 1e-9 ? (2 / norm).toFixed(3) : '—');
      stats.set('Support vectors', String(sv));
      stats.set('Violations', String(viol));
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointerdown', e => {
      const p = pointerPos(cv.canvas, e);
      let best = null, bd = 20;
      for (const pt of points) {
        const d = Math.hypot(p.x - scale.toX(pt.x), p.y - scale.toY(pt.y));
        if (d < bd) { bd = d; best = pt; }
      }
      dragging = best;
      if (dragging) cv.canvas.setPointerCapture(e.pointerId);
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const p = pointerPos(cv.canvas, e);
      dragging.x = clamp(scale.fromX(p.x), -1, 1);
      dragging.y = clamp(scale.fromY(p.y), -1, 1);
      train();
      draw();
    });
    cv.canvas.addEventListener('pointerup', () => { dragging = null; });

    const cS = slider('C (margin hardness)', { min: 0.1, max: 50, step: 0.1, value: 10, fmt: v => v.toFixed(1) }, v => { C = v; train(); draw(); });
    const retrainBtn = button('↺ Retrain', () => { W = { w1: 0.5, w2: 0.5, b: 0 }; train(); draw(); }, true);

    train();
    root.appendChild(demoPanel(
      'The widest street',
      'White line = decision boundary; dashed purple = margin edges. Yellow rings = support vectors (they alone define the street). Red rings = margin violators.',
      cv.canvas,
      h('div', { class: 'controls' }, [cS.el, retrainBtn]),
      legend([[CLASS_COLORS[0], 'class −1'], [CLASS_COLORS[1], 'class +1'], ['#e3b341', 'support vector'], ['#f85149', 'inside margin']]),
      stats.el,
    ));

    // ---- kernel trick: 1D lift animation ----
    root.appendChild(html(`
      <h3>The kernel trick: separate the inseparable</h3>
      <p>These 1-D points — blue in the middle, orange on the outsides — cannot be split by any single threshold. But add a computed feature, <code>z = x²</code>, and lift each point to height z: suddenly a straight line separates them perfectly. The SVM's famous <strong>kernel trick</strong> computes such lifts implicitly — even into infinite-dimensional spaces (RBF kernel) — without ever materializing the coordinates.</p>
    `));

    const cv2 = makeCanvas(340);
    let liftT = 0; // 0 = flat, 1 = lifted
    let animating = false, raf = null;
    const pts1d = [];
    seed(77);
    for (let i = 0; i < 26; i++) {
      const inner = i % 2 === 0;
      const x = inner ? randn() * 0.16 : (Math.random() > 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.3);
      pts1d.push({ x: clamp(x, -0.95, 0.95), label: inner ? 1 : 0 });
    }

    function draw2() {
      const { ctx, W: w, H: hgt } = cv2;
      ctx.clearRect(0, 0, w, hgt);
      const pad = 40;
      const toX = x => pad + (x + 1) / 2 * (w - 2 * pad);
      const toY = z => hgt - 40 - z * (hgt - 90);
      // axis
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(w - pad, toY(0)); ctx.stroke();
      // parabola guide when lifting
      if (liftT > 0.01) {
        ctx.strokeStyle = 'rgba(139,150,168,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let x = -1; x <= 1; x += 0.02) {
          const px = toX(x), py = toY(x * x * liftT);
          x <= -1 + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // separating line at z = 0.16 (between inner ~0.03 and outer ~0.3+)
      if (liftT > 0.6) {
        const zCut = 0.17 * liftT;
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pad, toY(zCut)); ctx.lineTo(w - pad, toY(zCut)); ctx.stroke();
        ctx.fillStyle = '#8b96a8';
        ctx.font = '11px Segoe UI';
        ctx.fillText('a straight cut now separates them!', pad + 6, toY(zCut) - 8);
      }
      for (const p of pts1d) {
        drawPoint(ctx, toX(p.x), toY(p.x * p.x * liftT), CLASS_COLORS[p.label], 6);
      }
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('x →', w - pad + 8, toY(0) + 4);
      if (liftT > 0.01) {
        ctx.save(); ctx.translate(16, hgt / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('z = x² →', 0, 0); ctx.restore();
      }
    }
    cv2.onResize(draw2);

    function animLift(target) {
      animating = true;
      cancelAnimationFrame(raf);
      (function step() {
        if (!animating) return;
        liftT += (target - liftT) * 0.08;
        if (Math.abs(target - liftT) < 0.005) { liftT = target; animating = false; }
        draw2();
        if (animating) raf = requestAnimationFrame(step);
      })();
    }
    onLeave(() => { animating = false; cancelAnimationFrame(raf); });

    root.appendChild(demoPanel(
      'Lift-off: the kernel trick in 1-D',
      'Blue points hide between orange ones — unseparable on the line. Press lift to add the feature z = x².',
      cv2.canvas,
      h('div', { class: 'controls' }, [
        button('🚀 Lift to z = x²', () => animLift(1)),
        button('↩ Flatten', () => animLift(0), true),
      ]),
    ));

    root.appendChild(html(`
      <h3>Common kernels</h3>
      <table class="info-table">
        <tr><th>Kernel</th><th>Implicit feature space</th><th>Boundary shapes</th></tr>
        <tr><td><b>Linear</b></td><td>The original features</td><td>Straight lines / hyperplanes</td></tr>
        <tr><td><b>Polynomial</b></td><td>All feature products up to degree d</td><td>Curved, polynomial surfaces</td></tr>
        <tr><td><b>RBF (Gaussian)</b></td><td>Infinite-dimensional!</td><td>Arbitrarily wiggly, locality-based</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 SVMs in perspective</div>
      Before deep learning took over, kernel SVMs were the state of the art for a decade (they read handwritten zip codes for the US Postal Service). Today they remain excellent for small-to-medium datasets with well-engineered features — and the margin idea lives on everywhere, from margin-based losses in deep nets to RLHF reward models.</div>
    `));
  },
};
