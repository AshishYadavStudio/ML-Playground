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

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Start with a prior belief:</strong> Before seeing any evidence, estimate how likely the hypothesis is. For a rare disease affecting 1% of people, your prior P(H) = 0.01.</li>
          <li><strong>Observe evidence:</strong> You receive a piece of data — a positive test result, a flagged email, a suspicious transaction. This is your evidence E.</li>
          <li><strong>Evaluate the likelihood:</strong> Ask "if the hypothesis were true, how probable is this evidence?" That is P(E|H). A 99%-sensitive test gives P(+|disease) = 0.99.</li>
          <li><strong>Account for false alarms:</strong> Also ask "if the hypothesis were false, how probable is this evidence?" — that is P(E|not H). This is where most intuition fails: even a small false-alarm rate applied to a huge healthy population produces many positives.</li>
          <li><strong>Compute the posterior:</strong> Combine everything via Bayes' formula: P(H|E) = P(E|H) · P(H) / P(E). The denominator P(E) is the total probability of seeing the evidence under all hypotheses, ensuring the answer is a proper probability.</li>
        </ol>
      </div>

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

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Bayesian inference, odds form, and the base rate fallacy</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>Bayes' theorem is derived directly from the definition of conditional probability. Since P(A and B) = P(A|B) · P(B) = P(B|A) · P(A), dividing both sides by P(B) gives:</p>
          <div class="formula">P(A|B) = P(B|A) · P(A) / P(B)</div>
          <p>The denominator P(B) — the marginal likelihood — is often expanded using the law of total probability:</p>
          <div class="formula">P(E) = P(E|H) · P(H) + P(E|not H) · P(not H)</div>
          <p>An equivalent and often more intuitive formulation uses <strong>odds</strong>. Define the prior odds as O(H) = P(H)/P(not H) and the <strong>likelihood ratio</strong> (or Bayes factor) as LR = P(E|H)/P(E|not H). Then:</p>
          <div class="formula">Posterior odds = Prior odds × Likelihood ratio &nbsp;&nbsp; → &nbsp;&nbsp; O(H|E) = O(H) · LR</div>
          <p>This form makes sequential updating trivial: each new independent piece of evidence just multiplies the running odds by its own likelihood ratio.</p>

          <h4>Intuition</h4>
          <p>Think of Bayes' theorem as a conversation between your prior knowledge and the new evidence. The prior encodes "how common is this in the population?" while the likelihood ratio encodes "how much more does this evidence point toward the hypothesis than away from it?" A test with a likelihood ratio of 100 (very discriminating) can overwhelm a low prior, but a test with LR = 10 barely budges a 1-in-10,000 prior — you go from 1:10,000 to 1:1,000, still far from certain.</p>
          <p>The medical test paradox works because people anchor on the test's accuracy (99%) and forget to account for the enormous base of healthy people who can produce false positives. In a population of 10,000 with 1% prevalence, 100 are sick and 9,900 are healthy. The test catches 99 sick people and falsely flags 99 healthy people — so about half of all positives are false alarms.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "A 99% accurate test means a positive result is 99% reliable."</div>
          <p><strong>✅ Reality:</strong> Test accuracy (sensitivity/specificity) and predictive value (posterior probability) are fundamentally different quantities. The predictive value depends critically on the base rate (prevalence). With a rare condition, even an excellent test produces mostly false positives.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Bayesian reasoning is subjective because the prior is a guess, so it's less rigorous than frequentist methods."</div>
          <p><strong>✅ Reality:</strong> The prior is explicit, auditable, and gets washed out by enough data. With sufficient evidence, Bayesian and frequentist approaches converge. The advantage of making assumptions explicit is that you can examine and challenge them — unlike hidden assumptions in frequentist procedures.</p>

          <h4>Historical Context</h4>
          <p>The theorem is named after Reverend Thomas Bayes (1701-1761), an English Presbyterian minister and amateur mathematician. His essay "An Essay towards solving a Problem in the Doctrine of Chances" was published posthumously in 1763 by his friend Richard Price. Pierre-Simon Laplace independently rediscovered and generalized the result in 1774, developing much of what we now call Bayesian inference. For most of the 20th century, Bayesian methods were controversial in statistics — the frequentist school dominated. The computational revolution (especially Markov Chain Monte Carlo methods in the 1990s) made Bayesian inference practical for complex models and led to its resurgence across machine learning, genetics, and astrophysics.</p>
        </div>
      </details>
    `));
  },
};
