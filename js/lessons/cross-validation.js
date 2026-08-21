// Lesson: Cross-Validation — animated K-fold with score variance
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, rand, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'cross-validation',
  emoji: '🔁',
  title: 'Cross-Validation',
  level: 'Beginner',
  blurb: 'One test set can lie. Rotate through many, and get an honest score plus how much you should trust it.',

  render(root) {
    root.appendChild(html(`
      <p>A single train/test split gives you <em>one</em> number. That number depends on which points happened to land in the test set — a lucky split flatters the model, an unlucky one damns it. <strong>Cross-validation</strong> fixes this by running the split many times and averaging.</p>
      <div class="formula">K-fold CV: split data into K equal folds → for each fold, train on K−1 and test on that one → average the K scores</div>
      <p>You get two things: an honest performance estimate, and — from the spread of the K scores — a sense of how <em>reliable</em> that estimate is.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Shuffle and partition the data:</strong> Randomly divide your dataset into K equally-sized subsets called "folds." With 100 samples and K=5, each fold contains 20 samples.</li>
          <li><strong>Hold out one fold as the test set:</strong> In each round, designate one fold as the test set and combine the remaining K-1 folds into the training set.</li>
          <li><strong>Train and evaluate:</strong> Fit the model from scratch on the training folds, then measure its performance (accuracy, MSE, etc.) on the held-out fold.</li>
          <li><strong>Rotate and repeat:</strong> Move to the next fold as the test set and repeat. After K rounds, every data point has been tested exactly once.</li>
          <li><strong>Aggregate the scores:</strong> Report the mean of the K scores as your performance estimate and the standard deviation as a measure of reliability. A large std signals that your model's quality depends heavily on which data it sees.</li>
        </ol>
      </div>

      <h3>Watch K-fold happen</h3>
      <p>Each row below is one CV round: green = training data, orange = held-out test fold. Change K, press <em>Run CV</em>, and watch the scores appear. Notice how the individual folds disagree — that spread is why one train/test split alone can badly mislead you.</p>
    `));

    let K = 5;
    let running = false, timer = null;
    let scores = []; // per fold
    const N = 60; // dataset size for the animation
    let dataset = [];

    seed(31);
    // Toy dataset: score of a "model" on each point (random around 0.85 with some outliers)
    for (let i = 0; i < N; i++) dataset.push({ correct: rand() < (0.75 + rand() * 0.2) ? 1 : 0 });

    const cv = makeCanvas(360);
    const stats = statRow(['K', 'Mean score', 'Std deviation', 'Best / Worst fold']);

    function draw(activeFold = -1) {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const rowH = Math.min(28, (H - 60) / K);
      const cellW = (W - 200) / N;
      const ox = 32, oy = 30;

      // Header
      ctx.fillStyle = '#8b96b2';
      ctx.font = '11px Segoe UI';
      ctx.fillText('Data points →', ox, 16);
      ctx.fillText('Fold score', W - 155, 16);

      const foldSize = Math.floor(N / K);
      for (let f = 0; f < K; f++) {
        const y = oy + f * (rowH + 4);
        // fold indices for test
        const testStart = f * foldSize;
        const testEnd = f === K - 1 ? N : testStart + foldSize;
        // labels
        ctx.fillStyle = f === activeFold ? '#e3b341' : '#8b96b2';
        ctx.font = f === activeFold ? 'bold 11px Segoe UI' : '11px Segoe UI';
        ctx.fillText('Fold ' + (f + 1), 2, y + rowH * 0.65);
        // cells
        for (let i = 0; i < N; i++) {
          const isTest = i >= testStart && i < testEnd;
          const x = ox + i * cellW;
          if (isTest) ctx.fillStyle = f === activeFold ? '#fb923c' : 'rgba(251,146,60,0.55)';
          else ctx.fillStyle = f === activeFold ? '#3fb950' : 'rgba(63,185,80,0.32)';
          ctx.fillRect(x + 0.5, y, cellW - 1, rowH - 1);
        }
        // score
        const score = scores[f];
        if (score != null) {
          ctx.fillStyle = f === activeFold ? '#e3b341' : '#c3cde0';
          ctx.font = 'bold 12px Consolas';
          ctx.fillText((score * 100).toFixed(1) + '%', W - 150, y + rowH * 0.65);
          // bar
          const barX = W - 90;
          const barW = 82;
          ctx.fillStyle = 'rgba(88,166,255,0.25)';
          ctx.fillRect(barX, y + rowH * 0.15, barW, rowH * 0.55);
          ctx.fillStyle = '#58a6ff';
          ctx.fillRect(barX, y + rowH * 0.15, barW * score, rowH * 0.55);
        }
      }
      // legend
      ctx.fillStyle = '#3fb950';
      ctx.fillRect(ox, H - 20, 12, 10);
      ctx.fillStyle = '#c3cde0'; ctx.font = '11px Segoe UI';
      ctx.fillText('training', ox + 18, H - 11);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(ox + 90, H - 20, 12, 10);
      ctx.fillStyle = '#c3cde0';
      ctx.fillText('test fold', ox + 108, H - 11);
    }
    cv.onResize(() => draw());

    function foldScore(fold) {
      const foldSize = Math.floor(N / K);
      const start = fold * foldSize;
      const end = fold === K - 1 ? N : start + foldSize;
      let correct = 0, total = 0;
      for (let i = start; i < end; i++) {
        total++;
        if (dataset[i].correct) correct++;
      }
      return total ? correct / total : 0;
    }

    function updateStats() {
      const valid = scores.filter(s => s != null);
      if (!valid.length) {
        stats.set('K', String(K));
        stats.set('Mean score', '—');
        stats.set('Std deviation', '—');
        stats.set('Best / Worst fold', '—');
        return;
      }
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
      const variance = valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length;
      const std = Math.sqrt(variance);
      const best = Math.max(...valid), worst = Math.min(...valid);
      stats.set('K', String(K));
      stats.set('Mean score', (mean * 100).toFixed(1) + '% ± ' + (std * 100).toFixed(1));
      stats.set('Std deviation', (std * 100).toFixed(2) + '%');
      stats.set('Best / Worst fold', (best * 100).toFixed(1) + '% / ' + (worst * 100).toFixed(1) + '%');
    }

    function reset() {
      scores = new Array(K).fill(null);
      updateStats();
      draw();
    }
    reset();

    function runCV() {
      if (running) return;
      running = true;
      runBtn.disabled = true;
      let f = 0;
      const stepFold = () => {
        if (!running || f >= K) {
          running = false;
          runBtn.disabled = false;
          draw();
          updateStats();
          return;
        }
        draw(f);
        setTimeout(() => {
          scores[f] = foldScore(f);
          updateStats();
          draw(f);
          f++;
          timer = setTimeout(stepFold, 350);
        }, 400);
      };
      stepFold();
    }
    onLeave(() => { running = false; clearTimeout(timer); });

    const kS = slider('K (folds)', { min: 2, max: 10, step: 1, value: 5 }, v => { K = v; reset(); });
    const runBtn = button('▶ Run CV', () => runCV());
    const resetBtn = button('↺ Reset', () => reset(), true);
    const shuffleBtn = button('🎲 Shuffle data', () => {
      // Reseed to get a different dataset — shows how CV smooths out luck of the split
      seed(Math.floor(Math.random() * 1e6));
      dataset = [];
      for (let i = 0; i < N; i++) dataset.push({ correct: rand() < (0.7 + rand() * 0.25) ? 1 : 0 });
      reset();
    }, true);

    root.appendChild(demoPanel(
      'K-Fold Cross-Validation',
      'Each row is one round. The dataset is split K ways; every fold takes its turn being the held-out test set.',
      cv.canvas,
      h('div', { class: 'controls' }, [kS.el, runBtn, resetBtn, shuffleBtn]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>Picking K</h3>
      <table class="info-table">
        <tr><th>K</th><th>Cost</th><th>Estimate</th><th>Use when</th></tr>
        <tr><td><b>K = 5</b> or <b>10</b></td><td>Cheap</td><td>Slight optimistic bias; low variance</td><td>Default for most problems</td></tr>
        <tr><td><b>K = N</b> (Leave-One-Out)</td><td>Expensive — N trainings</td><td>Nearly unbiased; high variance</td><td>Small datasets only</td></tr>
        <tr><td><b>Stratified K-Fold</b></td><td>Same</td><td>Preserves class ratios in each fold</td><td>Imbalanced classification</td></tr>
        <tr><td><b>TimeSeriesSplit</b></td><td>Same</td><td>Train only on past → test on future</td><td>Time series (no leakage!)</td></tr>
      </table>

      <h3>Why the standard deviation matters as much as the mean</h3>
      <p>Two models can both average 84% accuracy — but if one's folds range 82–86% and the other's range 74–94%, the second isn't really 84%: it's a coin flip on which slice of data you happen to test on. Always report <strong>mean ± std</strong>, not just mean.</p>

      <h3>Nested CV: tuning hyperparameters without cheating</h3>
      <p>If you tune your hyperparameters on the same folds you evaluate with, you've secretly fit to those folds — your reported score is optimistic. The clean fix is <strong>nested cross-validation</strong>: an outer loop for evaluation, an inner loop (on each outer training set) for tuning.</p>
      <div class="formula">Outer K-fold → for each outer fold, run inner K-fold on the outer training data to pick hyperparameters → evaluate the tuned model on the outer test fold → average outer scores</div>

      <div class="callout callout-warn"><div class="callout-title">⚠️ The #1 leakage trap</div>
      Fit your <strong>scaler / imputer / encoder inside</strong> the CV loop, not on the whole dataset first. Fitting <code>StandardScaler</code> on all your data before splitting leaks information from the test fold into training — your reported score will be too high, and your production model will disappoint. sklearn's <code>Pipeline</code> makes this correct by default.</div>

      <div class="callout callout-tip"><div class="callout-title">💡 Rule of thumb</div>
      Small dataset (&lt;1k rows): use 10-fold CV — the extra passes are cheap and the estimate gets much more reliable. Medium (10k–1M): 5-fold. Huge (millions): a single held-out set is usually fine because sample noise is already small.</div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Stratification, leave-one-out, and nested CV theory</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>The K-fold CV estimator of generalization error is:</p>
          <div class="formula">CV(K) = (1/K) Σ_{k=1}^{K} L(f_{-k}, D_k)</div>
          <p>where f_{-k} is the model trained on all data except fold k, D_k is fold k, and L is the loss function. This estimator is approximately unbiased for the expected error of a model trained on (K-1)/K of the data — slightly pessimistic compared to the full-data model since each fold's model sees less data.</p>
          <p>The variance of the CV estimator is harder to pin down. The K fold-level scores are <strong>not independent</strong> — each pair of folds shares most of their training data. Bengio and Grandvalet (2004) showed there is no universal unbiased estimator of the variance of K-fold CV. In practice, the standard deviation of the K scores divided by sqrt(K) underestimates uncertainty, so report the raw standard deviation rather than a standard error.</p>

          <h4>Stratified K-Fold</h4>
          <p>In classification with imbalanced classes (e.g., 95% negative, 5% positive), a random split might leave some folds with zero positive examples. <strong>Stratified K-fold</strong> ensures each fold has approximately the same class distribution as the full dataset. This reduces variance in the CV estimate and prevents training folds from having a distorted view of the class balance.</p>
          <p>For regression problems, stratification can be approximated by binning the target variable into quantiles and stratifying on those bins.</p>

          <h4>Leave-One-Out Cross-Validation (LOOCV)</h4>
          <p>LOOCV is K-fold CV with K = n (one sample per fold). Each model trains on n-1 points and is tested on the one left out. It is nearly unbiased (the training set is almost the full dataset), but has two drawbacks: (1) it requires n full model trainings — expensive unless the model has a shortcut (linear regression has one: the PRESS statistic), and (2) because each pair of training sets differs by only 2 points, the n models are highly correlated, leading to high-variance estimates. In practice, 5- or 10-fold usually gives a better bias-variance trade-off for the estimator itself.</p>

          <h4>Nested Cross-Validation</h4>
          <p>When you use CV to both select hyperparameters and estimate performance, the outer score is optimistically biased — you peeked at the test folds through your hyperparameter choices. <strong>Nested CV</strong> fixes this with two loops:</p>
          <div class="formula">Outer loop (K_out folds): for each outer fold → Inner loop (K_in folds on the outer training set): tune hyperparameters → Retrain with best hyperparameters on full outer training set → Evaluate on outer test fold</div>
          <p>The outer scores are now honest: the test data in each outer fold was never used for any decision. The total cost is K_out × K_in × (number of hyperparameter settings) model fits, which is expensive but gives a trustworthy estimate.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Leave-one-out CV always gives the best estimate because it uses the most training data."</div>
          <p><strong>✅ Reality:</strong> LOOCV is nearly unbiased but has the highest variance among K-fold estimators because all n training sets are almost identical (they overlap in n-2 points). The high correlation between fold scores means the average is unstable. For most practical purposes, 10-fold CV with stratification gives a better bias-variance trade-off for the estimator.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Cross-validation makes your model better."</div>
          <p><strong>✅ Reality:</strong> CV does not improve the model — it gives you a more honest <em>measurement</em> of how good (or bad) the model already is. It is an evaluation tool, not a training algorithm. It does enable better model selection (choosing between candidate models), which indirectly leads to better final models, but CV itself does not change any model's parameters.</p>

          <h4>Historical Context</h4>
          <p>Cross-validation was introduced by Seymour Geisser and the concept of the "predictive sample reuse" method appeared in his work from the 1970s. The modern K-fold procedure was developed by Mervyn Stone (1974) and refined by Stone (1977). The landmark paper by Ron Kohavi (1995), "A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection," provided the empirical evidence that 10-fold stratified CV offers the best practical balance — a recommendation that remains standard today, over 25 years later.</p>
        </div>
      </details>
    `));
  },
};
