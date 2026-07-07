// Lesson: Naive Bayes — interactive spam filter, evidence multiplying live
import {
  h, html, makeCanvas, demoPanel, statRow, button,
} from '../utils.js';

// Toy vocabulary with P(word | spam) and P(word | ham), "learned" from a tiny corpus.
const VOCAB = [
  { w: 'free',     spam: 0.60, ham: 0.05 },
  { w: 'winner',   spam: 0.45, ham: 0.02 },
  { w: 'money',    spam: 0.50, ham: 0.10 },
  { w: 'click',    spam: 0.40, ham: 0.08 },
  { w: 'urgent',   spam: 0.35, ham: 0.06 },
  { w: 'prize',    spam: 0.38, ham: 0.02 },
  { w: 'meeting',  spam: 0.04, ham: 0.35 },
  { w: 'project',  spam: 0.03, ham: 0.40 },
  { w: 'lunch',    spam: 0.02, ham: 0.25 },
  { w: 'report',   spam: 0.05, ham: 0.30 },
  { w: 'tomorrow', spam: 0.08, ham: 0.32 },
  { w: 'thanks',   spam: 0.06, ham: 0.45 },
];
const PRIOR_SPAM = 0.4;

export default {
  id: 'naive-bayes',
  emoji: '📬',
  title: 'Naive Bayes',
  level: 'Intermediate',
  blurb: 'The spam filter classic: multiply evidence word by word, watch Bayes\' theorem work live.',

  render(root) {
    root.appendChild(html(`
      <p>Your inbox's spam filter has been doing machine learning since the 1990s. <strong>Naive Bayes</strong> flips the question around using Bayes' theorem: instead of "what's the probability this email is spam?", ask "how likely would these exact words be <em>if</em> it were spam vs. <em>if</em> it were normal?"</p>
      <div class="formula">P(spam | words) ∝ P(spam) · P(w₁|spam) · P(w₂|spam) · … &nbsp;&nbsp; ("naive" = assume words are independent)</div>
      <p>Training is just counting: what fraction of spam emails contain "free"? What fraction of normal emails do? The table below was "learned" that way from a toy corpus.</p>
      <h3>Try it: compose an email</h3>
      <p><strong>Click words to add them to the email.</strong> Each word multiplies both running scores — watch the verdict gauge swing as spammy and hammy words fight it out. Notice one strong word can be outvoted by several mild ones: evidence is multiplicative.</p>
    `));

    let selected = new Set(['free', 'meeting']);
    const cv = makeCanvas(320);
    const stats = statRow(['P(spam | email)', 'Verdict']);

    function compute() {
      let ls = Math.log(PRIOR_SPAM), lh = Math.log(1 - PRIOR_SPAM);
      const steps = [{ label: 'prior', spam: PRIOR_SPAM, ham: 1 - PRIOR_SPAM }];
      for (const v of VOCAB) {
        if (selected.has(v.w)) {
          ls += Math.log(v.spam);
          lh += Math.log(v.ham);
          steps.push({ label: v.w, spam: v.spam, ham: v.ham });
        }
      }
      const pSpam = 1 / (1 + Math.exp(lh - ls));
      return { pSpam, steps };
    }

    function draw() {
      const { pSpam, steps } = compute();
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);

      // evidence bars: each step shows P(w|spam) vs P(w|ham)
      const n = steps.length;
      const barAreaW = W - 210;
      const rowH = Math.min(34, (H - 90) / Math.max(1, n));
      ctx.font = '12px Segoe UI';
      steps.forEach((s, i) => {
        const y = 20 + i * rowH;
        ctx.fillStyle = '#c9d4e3';
        ctx.textAlign = 'right';
        ctx.fillText(s.label === 'prior' ? 'prior P(class)' : `"${s.label}"`, 105, y + rowH / 2 + 4);
        ctx.textAlign = 'left';
        // spam bar (up) and ham bar (down) side by side
        const bw = barAreaW / 2 - 10;
        ctx.fillStyle = 'rgba(248,81,73,0.75)';
        ctx.fillRect(115, y + rowH / 2 - 9, s.spam * bw, 8);
        ctx.fillStyle = 'rgba(63,185,80,0.75)';
        ctx.fillRect(115, y + rowH / 2 + 1, s.ham * bw, 8);
        ctx.fillStyle = '#8b96a8';
        ctx.font = '10px Consolas';
        ctx.fillText(s.spam.toFixed(2), 118 + s.spam * bw, y + rowH / 2 - 1);
        ctx.fillText(s.ham.toFixed(2), 118 + s.ham * bw, y + rowH / 2 + 9);
        ctx.font = '12px Segoe UI';
      });
      ctx.fillStyle = '#f85149';
      ctx.fillText('■ P(word | spam)', 115, H - 44);
      ctx.fillStyle = '#3fb950';
      ctx.fillText('■ P(word | normal)', 235, H - 44);

      // verdict gauge
      const gx = W - 80, gy = H / 2 - 20, gr = Math.min(62, W * 0.09);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 2.25);
      ctx.stroke();
      const ang = Math.PI * 0.75 + pSpam * Math.PI * 1.5;
      const grad = ctx.createLinearGradient(gx - gr, gy, gx + gr, gy);
      grad.addColorStop(0, '#3fb950');
      grad.addColorStop(1, '#f85149');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, Math.PI * 0.75, ang);
      ctx.stroke();
      ctx.fillStyle = pSpam > 0.5 ? '#f85149' : '#3fb950';
      ctx.font = 'bold 16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText((pSpam * 100).toFixed(0) + '%', gx, gy + 6);
      ctx.font = '11px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText('spam probability', gx, gy + gr + 24);
      ctx.textAlign = 'left';

      stats.set('P(spam | email)', (pSpam * 100).toFixed(1) + '%');
      stats.set('Verdict', pSpam > 0.5 ? '🚫 SPAM' : '✅ inbox');
      renderChips();
    }
    cv.onResize(draw);

    // word chips
    const chipBox = h('div', { class: 'controls', style: { gap: '8px' } });
    function renderChips() {
      chipBox.innerHTML = '';
      for (const v of VOCAB) {
        const on = selected.has(v.w);
        const spammy = v.spam > v.ham;
        const chip = h('button', {
          class: 'btn secondary',
          style: {
            padding: '5px 12px',
            borderColor: on ? (spammy ? '#f85149' : '#3fb950') : 'var(--border)',
            background: on ? (spammy ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)') : 'var(--bg-card)',
          },
          onclick: () => {
            if (on) selected.delete(v.w); else selected.add(v.w);
            draw();
          },
        }, (on ? '✓ ' : '+ ') + v.w);
        chipBox.appendChild(chip);
      }
    }
    const clearBtn = button('Clear email', () => { selected = new Set(); draw(); }, true);

    root.appendChild(demoPanel(
      'Build-a-spam-filter',
      'Click words to put them in the email. Bars show each word\'s likelihood under spam (red) vs normal (green) — the class whose bars stay taller wins.',
      h('div', {}, [chipBox]),
      cv.canvas,
      h('div', { class: 'controls' }, [clearBtn]),
      stats.el,
    ));
    renderChips();

    root.appendChild(html(`
      <h3>Why "naive" — and why it works anyway</h3>
      <p>The independence assumption is obviously false ("free" and "winner" co-occur constantly in spam). But classification only needs the <em>right class to win</em>, not perfectly calibrated probabilities — and with many words voting, the winner is usually right even when the naive math is off. Bonus: training is one pass of counting, so it scales to millions of documents effortlessly.</p>
      <h3>Bayes' theorem, spelled out</h3>
      <div class="formula">P(spam | words) = P(words | spam) · P(spam) / P(words)</div>
      <ul>
        <li><strong>P(spam)</strong> — the <em>prior</em>: how common spam is before reading a single word (40% in our demo).</li>
        <li><strong>P(words | spam)</strong> — the <em>likelihood</em>: how typical these words are for spam.</li>
        <li><strong>P(spam | words)</strong> — the <em>posterior</em>: our updated belief after seeing the evidence.</li>
      </ul>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The zero problem</div>
      If a word never appeared in training spam, P(word|spam) = 0 and one multiplication nukes the whole product. The fix — <strong>Laplace smoothing</strong> — pretends every word was seen at least once (add 1 to all counts). Tiny trick, essential in practice.</div>
      <div class="callout callout-tip"><div class="callout-title">💡 Where Naive Bayes shines today</div>
      Spam and abuse filtering, language identification, quick text-classification baselines, and medical triage systems. When you have little data and need something working <em>this afternoon</em>, Naive Bayes is still a superb first move.</div>
    `));
  },
};
