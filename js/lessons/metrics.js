// Lesson: Evaluation Metrics — threshold slider, confusion matrix, ROC curve
import {
  h, html, makeCanvas, demoPanel, slider, statRow, legend,
  seed, randn, clamp,
} from '../utils.js';

export default {
  id: 'metrics',
  emoji: '🎯',
  title: 'Evaluation Metrics',
  level: 'Beginner',
  blurb: 'Accuracy lies. Precision, recall, ROC curves — and an interactive threshold to feel the trade-off.',

  render(root) {
    root.appendChild(html(`
      <p>Your model outputs a <strong>score</strong> (e.g. "82% probability of disease"). To act, you pick a <strong>threshold</strong>: above it → predict positive. Where you put that threshold creates a trade-off that no single accuracy number can capture.</p>
      <h3>The four outcomes</h3>
      <table class="info-table">
        <tr><th></th><th>Actually positive</th><th>Actually negative</th></tr>
        <tr><td><b>Predicted positive</b></td><td style="color:#3fb950">True Positive (TP) ✓</td><td style="color:#f85149">False Positive (FP) — false alarm</td></tr>
        <tr><td><b>Predicted negative</b></td><td style="color:#f85149">False Negative (FN) — missed case</td><td style="color:#3fb950">True Negative (TN) ✓</td></tr>
      </table>
      <div class="formula">Precision = TP / (TP + FP) &nbsp;&nbsp;·&nbsp;&nbsp; Recall = TP / (TP + FN) &nbsp;&nbsp;·&nbsp;&nbsp; F1 = 2·P·R / (P + R) &nbsp;&nbsp;·&nbsp;&nbsp; Accuracy = (TP+TN) / all</div>
      <h3>Try it: slide the threshold</h3>
      <p>Below are the model's scores for sick patients (orange) and healthy patients (blue) — the distributions overlap, as they always do in real life. <strong>Drag the threshold</strong> and watch every metric respond.</p>
    `));

    // Generate two overlapping score distributions
    seed(47);
    const pos = Array.from({ length: 120 }, () => clamp(0.66 + randn() * 0.15, 0.01, 0.99));
    const neg = Array.from({ length: 180 }, () => clamp(0.38 + randn() * 0.15, 0.01, 0.99));

    const cv = makeCanvas(300);
    const roc = makeCanvas(300);
    let thr = 0.5;
    const stats = statRow(['Accuracy', 'Precision', 'Recall', 'F1', 'TP', 'FP', 'FN', 'TN']);

    function confusion(t) {
      const TP = pos.filter(s => s >= t).length;
      const FN = pos.length - TP;
      const FP = neg.filter(s => s >= t).length;
      const TN = neg.length - FP;
      return { TP, FN, FP, TN };
    }

    function drawHist() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const bins = 40;
      const pad = 30;
      const bw = (W - 2 * pad) / bins;
      const hp = new Array(bins).fill(0), hn = new Array(bins).fill(0);
      for (const s of pos) hp[Math.min(bins - 1, Math.floor(s * bins))]++;
      for (const s of neg) hn[Math.min(bins - 1, Math.floor(s * bins))]++;
      const maxC = Math.max(...hp, ...hn);
      for (let i = 0; i < bins; i++) {
        const x = pad + i * bw;
        const scoreMid = (i + 0.5) / bins;
        const predPos = scoreMid >= thr;
        // negatives (blue)
        const hN = hn[i] / maxC * (H - 70);
        ctx.fillStyle = predPos ? 'rgba(248,81,73,0.75)' : 'rgba(88,166,255,0.75)'; // FP shows red
        ctx.fillRect(x, H - 35 - hN, bw - 1, hN);
        // positives (orange) stacked visually above with slight offset via alpha overlay
        const hP = hp[i] / maxC * (H - 70);
        ctx.fillStyle = predPos ? 'rgba(240,136,62,0.85)' : 'rgba(139,148,158,0.65)'; // FN shows grey
        ctx.fillRect(x + bw * 0.15, H - 35 - hP, bw * 0.7, hP);
      }
      // threshold line
      const tx = pad + thr * (W - 2 * pad);
      ctx.strokeStyle = '#e3b341';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(tx, 12); ctx.lineTo(tx, H - 30); ctx.stroke();
      ctx.fillStyle = '#e3b341';
      ctx.font = 'bold 12px Segoe UI';
      ctx.fillText('threshold = ' + thr.toFixed(2), Math.min(tx + 6, W - 120), 20);
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('model score 0 → 1  (predict positive right of the line)', pad, H - 12);
    }

    function drawRoc() {
      const { ctx, W, H } = roc;
      ctx.clearRect(0, 0, W, H);
      const pad = 36;
      const toX = fpr => pad + fpr * (W - 2 * pad);
      const toY = tpr => H - pad - tpr * (H - 2 * pad);
      // axes + diagonal
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(toX(0), toY(0)); ctx.lineTo(toX(1), toY(1)); ctx.stroke();
      ctx.setLineDash([]);
      // curve
      ctx.strokeStyle = '#bc8cff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let auc = 0, prevFpr = 1, prevTpr = 1;
      ctx.moveTo(toX(1), toY(1));
      for (let t = 0; t <= 1.001; t += 0.01) {
        const { TP, FN, FP, TN } = confusion(t);
        const tpr = TP / (TP + FN), fpr = FP / (FP + TN);
        ctx.lineTo(toX(fpr), toY(tpr));
        auc += (prevFpr - fpr) * (tpr + prevTpr) / 2;
        prevFpr = fpr; prevTpr = tpr;
      }
      ctx.stroke();
      // current point
      const { TP, FN, FP, TN } = confusion(thr);
      const tpr = TP / (TP + FN), fpr = FP / (FP + TN);
      ctx.beginPath();
      ctx.arc(toX(fpr), toY(tpr), 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#e3b341';
      ctx.fill();
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('False Positive Rate →', W / 2 - 55, H - 10);
      ctx.save(); ctx.translate(12, H / 2 + 55); ctx.rotate(-Math.PI / 2);
      ctx.fillText('True Positive Rate (Recall) →', 0, 0); ctx.restore();
      ctx.fillStyle = '#bc8cff';
      ctx.font = 'bold 13px Segoe UI';
      ctx.fillText('AUC = ' + auc.toFixed(3), W - 120, pad + 18);
    }

    function update() {
      const { TP, FN, FP, TN } = confusion(thr);
      const P = TP + FP > 0 ? TP / (TP + FP) : 0;
      const R = TP / (TP + FN);
      stats.set('Accuracy', (((TP + TN) / (pos.length + neg.length)) * 100).toFixed(1) + '%');
      stats.set('Precision', (P * 100).toFixed(1) + '%');
      stats.set('Recall', (R * 100).toFixed(1) + '%');
      stats.set('F1', (P + R > 0 ? (2 * P * R / (P + R)) : 0).toFixed(3));
      stats.set('TP', String(TP)); stats.set('FP', String(FP));
      stats.set('FN', String(FN)); stats.set('TN', String(TN));
      drawHist();
      drawRoc();
    }
    cv.onResize(update);
    roc.onResize(update);

    const tS = slider('Decision threshold', { min: 0.02, max: 0.98, step: 0.01, value: 0.5, fmt: v => v.toFixed(2) }, v => { thr = v; update(); });

    root.appendChild(demoPanel(
      'Threshold ↔ trade-off',
      'Left of the line = predicted healthy, right = predicted sick. Red bars are false alarms (FP); grey bars are missed cases (FN).',
      cv.canvas,
      h('div', { class: 'controls' }, [tS.el]),
      legend([['#f0883e', 'sick, correctly flagged (TP)'], ['#8b949e', 'sick, missed (FN)'], ['#58a6ff', 'healthy, correctly cleared (TN)'], ['#f85149', 'healthy, false alarm (FP)']]),
      stats.el,
      h('div', { style: { marginTop: '16px' } }, [
        h('div', { class: 'demo-hint' }, 'The ROC curve traces (FPR, TPR) across every possible threshold; the yellow dot is your current choice. Area Under the Curve (AUC) summarizes the model independent of any threshold — 1.0 is perfect, 0.5 is coin-flipping.'),
        roc.canvas,
      ]),
    ));

    root.appendChild(html(`
      <h3>Why accuracy alone lies</h3>
      <p>Suppose only 1% of patients are sick. A model that predicts <em>"healthy" for everyone</em> is 99% accurate — and 100% useless. With imbalanced classes, always look at precision and recall.</p>
      <h3>Which metric should you care about?</h3>
      <table class="info-table">
        <tr><th>Situation</th><th>Costly mistake</th><th>Optimize for</th></tr>
        <tr><td>Cancer screening</td><td>Missing a sick patient (FN)</td><td><b>Recall</b> — lower the threshold</td></tr>
        <tr><td>Spam filter</td><td>Deleting a real email (FP)</td><td><b>Precision</b> — raise the threshold</td></tr>
        <tr><td>Balanced needs</td><td>Both matter</td><td><b>F1 score</b> (harmonic mean of P &amp; R)</td></tr>
        <tr><td>Comparing models</td><td>—</td><td><b>AUC</b> (threshold-independent)</td></tr>
      </table>
      <h3>For regression problems</h3>
      <ul>
        <li><strong>MSE / RMSE</strong> — punishes large errors heavily (RMSE is in the original units).</li>
        <li><strong>MAE</strong> — mean absolute error; more robust to outliers.</li>
        <li><strong>R²</strong> — fraction of variance explained; 1.0 is perfect, 0 means "no better than predicting the mean."</li>
      </ul>
      <div class="callout callout-tip"><div class="callout-title">💡 Big idea</div>
      A model gives you scores; <em>you</em> choose the operating point. The right threshold is a business/ethics decision about which mistake hurts more — not a math decision.</div>
    `));
  },
};
