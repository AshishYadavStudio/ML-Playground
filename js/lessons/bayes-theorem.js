// Lesson: Bayes' Theorem — the medical-test paradox via probability rectangles
import {
  h, html, makeCanvas, demoPanel, slider, statRow, legend,
} from '../utils.js';

export default {
  id: 'bayes-theorem',
  emoji: '🎲',
  title: "Bayes' Theorem",
  level: 'Beginner',
  blurb: 'The math of updating beliefs when evidence arrives — and why "99% accurate" often means 9% likely.',

  render(root) {
    root.appendChild(html(`
      <p>Bayes' theorem answers the single most useful question in probabilistic reasoning: <em>"I observed some evidence — what should I now believe?"</em> It's the machinery behind spam filters, medical diagnosis, A/B testing, and every reasoning system that updates when the data comes in.</p>
      <div class="formula">P(H | E) = P(E | H) · P(H) / P(E) &nbsp;&nbsp; posterior = likelihood · prior / marginal</div>
      <ul>
        <li><strong>Prior P(H):</strong> what you believed before seeing the evidence.</li>
        <li><strong>Likelihood P(E | H):</strong> how well the hypothesis <em>predicts</em> the evidence you saw.</li>
        <li><strong>Posterior P(H | E):</strong> your updated belief now that you've seen the evidence.</li>
      </ul>

      <h3>The medical test paradox</h3>
      <p>A rare disease affects 1% of the population. A test is 99% accurate. You test positive. What's the probability you actually have the disease? Most people say "99%." The right answer is closer to <strong>50%</strong> — and the picture below shows exactly why.</p>
    `));

    let prevalence = 0.01;
    let sensitivity = 0.99; // P(+ | disease)
    let specificity = 0.99; // P(− | healthy)

    const cv = makeCanvas(360);
    const stats = statRow(['P(disease)', 'P(+ | disease)', 'P(− | healthy)', 'P(disease | +)']);

    function computePosterior() {
      const p = prevalence;
      const s = sensitivity;
      const sp = specificity;
      const tp = p * s;                 // true positive rate
      const fp = (1 - p) * (1 - sp);    // false positive rate
      const posterior = tp / (tp + fp);
      return { tp, fp, posterior, fn: p * (1 - s), tn: (1 - p) * sp };
    }

    function draw() {
      const { tp, fp, fn, tn, posterior } = computePosterior();
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const pad = 28;
      const rectX = pad + 60;
      const rectY = pad + 20;
      const rectW = W - pad - rectX - 12;
      const rectH = H - pad - rectY - 42;

      const diseaseW = rectW * prevalence;

      // Diseased column: split into TP (test+) and FN (test−)
      ctx.fillStyle = 'rgba(240,136,62,0.85)';
      ctx.fillRect(rectX, rectY, diseaseW * sensitivity, rectH);
      ctx.fillStyle = 'rgba(240,136,62,0.28)';
      ctx.fillRect(rectX + diseaseW * sensitivity, rectY, diseaseW * (1 - sensitivity), rectH);
      // Healthy column: split into FP (test+) and TN (test−)
      ctx.fillStyle = 'rgba(88,166,255,0.28)';
      ctx.fillRect(rectX + diseaseW, rectY, (rectW - diseaseW) * (1 - specificity), rectH);
      ctx.fillStyle = 'rgba(88,166,255,0.85)';
      ctx.fillRect(rectX + diseaseW + (rectW - diseaseW) * (1 - specificity), rectY, (rectW - diseaseW) * specificity, rectH);

      // Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(rectX, rectY, rectW, rectH);

      // Vertical divider between disease and healthy
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(rectX + diseaseW, rectY);
      ctx.lineTo(rectX + diseaseW, rectY + rectH);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#c3cde0';
      ctx.font = 'bold 12px Segoe UI';
      // Left cap: disease vs healthy
      ctx.save();
      ctx.translate(rectX - 8, rectY + rectH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('has disease', 0, 0);
      ctx.restore();

      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8b96b2';
      ctx.fillText('Population (rectangle area = 100%)', rectX, rectY - 6);
      ctx.textAlign = 'center';
      ctx.fillText('healthy', rectX + diseaseW + (rectW - diseaseW) / 2, rectY + rectH + 16);
      ctx.fillText('disease', rectX + diseaseW / 2, rectY + rectH + 16);

      // Bottom summary
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(240,136,62,0.9)';
      ctx.font = 'bold 11px Consolas';
      ctx.fillText('■', rectX, H - 14);
      ctx.fillStyle = '#c3cde0';
      ctx.fillText('true positives: ' + (tp * 100).toFixed(2) + '%', rectX + 12, H - 14);
      ctx.fillStyle = 'rgba(88,166,255,0.9)';
      ctx.fillText('■', rectX + 160, H - 14);
      ctx.fillStyle = '#c3cde0';
      ctx.fillText('false positives: ' + (fp * 100).toFixed(2) + '%', rectX + 172, H - 14);

      stats.set('P(disease)', (prevalence * 100).toFixed(2) + '%');
      stats.set('P(+ | disease)', (sensitivity * 100).toFixed(1) + '%');
      stats.set('P(− | healthy)', (specificity * 100).toFixed(1) + '%');
      stats.set('P(disease | +)', (posterior * 100).toFixed(1) + '%');
    }
    cv.onResize(draw);

    const prevS = slider('Prevalence P(disease)', { min: 0.001, max: 0.5, step: 0.001, value: 0.01, fmt: v => (v * 100).toFixed(1) + '%' }, v => { prevalence = v; draw(); });
    const senS = slider('Sensitivity P(+ | disease)', { min: 0.5, max: 0.999, step: 0.001, value: 0.99, fmt: v => (v * 100).toFixed(1) + '%' }, v => { sensitivity = v; draw(); });
    const specS = slider('Specificity P(− | healthy)', { min: 0.5, max: 0.999, step: 0.001, value: 0.99, fmt: v => (v * 100).toFixed(1) + '%' }, v => { specificity = v; draw(); });

    root.appendChild(demoPanel(
      'The medical test paradox, drawn to scale',
      'Solid orange = correctly-flagged sick people. Faded blue = false alarms. The rare positive is drowned by the far larger healthy population.',
      cv.canvas,
      h('div', { class: 'controls' }, [prevS.el, senS.el, specS.el]),
      legend([['#f0883e', 'true positives'], ['rgba(240,136,62,0.28)', 'false negatives'], ['rgba(88,166,255,0.28)', 'false positives'], ['#58a6ff', 'true negatives']]),
      stats.el,
    ));

    draw();

    root.appendChild(html(`
      <h3>Reading the picture</h3>
      <p>The rectangle is the whole population. Its width splits by disease status; its height plays no role. With prevalence 1%, the "disease" strip is thin. Even a 99% specific test flags 1% of the huge healthy strip — and that tiny percentage of a big number ends up <em>bigger</em> than the true positives in the thin sick strip. Two orange blobs, similar size — so being positive puts you at roughly 50%, not 99%.</p>
      <p><strong>Try it:</strong> crank the prevalence up to 20%. Now the disease strip is fat, true positives dominate false positives, and P(disease | +) jumps toward 96%. Same test, different context, wildly different meaning.</p>

      <h3>Bayes in plain English</h3>
      <div class="formula">P(cause | effect) = P(effect | cause) · P(cause) / P(effect)</div>
      <ul>
        <li>You can't skip the <strong>prior</strong>. Rare things stay rare after even strong evidence — one positive test, one flagged transaction, one hit search result.</li>
        <li>Strong evidence is a <em>ratio</em>: how much more likely under H than under not-H. That ratio (the <strong>likelihood ratio</strong>) multiplies your prior odds into your posterior odds.</li>
        <li>Multiple independent pieces of evidence compound — each one multiplies the odds. Two mildly-informative tests can beat one very strong one.</li>
      </ul>

      <h3>Where you meet Bayes in ML</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">📧</div><h4>Naive Bayes classifiers</h4><p>Multiply prior × per-word likelihoods → posterior over classes. Still competitive for text at near-zero cost. See the Naive Bayes lesson.</p></div>
        <div class="card"><div class="card-icon">🎛️</div><h4>Bayesian hyperparameter tuning</h4><p>Start with a prior over which hyperparameters work; update with each experiment; explore where uncertainty is highest.</p></div>
        <div class="card"><div class="card-icon">🧠</div><h4>Bayesian neural networks</h4><p>Weights are distributions, not point values. Predictions come with calibrated uncertainty — critical for medicine, autonomy, and RL.</p></div>
        <div class="card"><div class="card-icon">🧪</div><h4>A/B testing</h4><p>Bayesian A/B testing gives you "P(B is better than A)" directly — often more actionable than a p-value.</p></div>
      </div>

      <div class="callout callout-tip"><div class="callout-title">💡 The base rate is everything</div>
      Screening for a 1-in-100,000 disease with a 99% accurate test flags 1000 healthy people for every real case caught. Same math explains why "AI can detect X with 95% accuracy" headlines about rare events are usually much less useful than they sound — the false-positive tsunami swamps the true signal.</div>
    `));
  },
};
