// Lesson: From Concepts to Code — annotated sklearn & PyTorch, with pipeline animation
import {
  h, html, makeCanvas, demoPanel, button, selectBox,
} from '../utils.js';
import { onLeave } from '../app.js';

const SNIPPETS = {
  sklearn: {
    name: 'scikit-learn: complete workflow',
    stages: ['load', 'split', 'scale', 'train', 'predict', 'evaluate'],
    lines: [
      { code: 'from sklearn.model_selection import train_test_split', stage: null, note: 'scikit-learn: the standard toolbox for classical ML. Everything shares one API.' },
      { code: 'from sklearn.preprocessing import StandardScaler', stage: null, note: 'Import the tools we need. Each is a class with the same fit/transform pattern.' },
      { code: 'from sklearn.linear_model import LogisticRegression', stage: null, note: 'The model — see the Logistic Regression lesson for what\'s inside.' },
      { code: '', stage: null, note: '' },
      { code: 'X, y = load_data()          # features (n, d), labels (n,)', stage: 'load', note: 'X: one row per example, one column per feature. y: the answers. (Data & Features lesson.)' },
      { code: 'X_tr, X_te, y_tr, y_te = train_test_split(', stage: 'split', note: 'Lock away 20% as the test set BEFORE doing anything else — the golden rule.' },
      { code: '    X, y, test_size=0.2, random_state=42)', stage: 'split', note: 'random_state pins the shuffle so results are reproducible.' },
      { code: '', stage: null, note: '' },
      { code: 'scaler = StandardScaler().fit(X_tr)   # μ, σ from TRAIN only', stage: 'scale', note: 'fit() learns the means/stds from training data only — no test-set leakage!' },
      { code: 'X_tr = scaler.transform(X_tr)', stage: 'scale', note: 'Apply the scaling: every feature now has mean 0, std 1.' },
      { code: 'X_te = scaler.transform(X_te)', stage: 'scale', note: 'The SAME transform (train μ, σ) is applied to test data.' },
      { code: '', stage: null, note: '' },
      { code: 'model = LogisticRegression(C=1.0)', stage: 'train', note: 'C is inverse regularization strength — the λ knob from the Overfitting lesson.' },
      { code: 'model.fit(X_tr, y_tr)        # gradient descent happens here', stage: 'train', note: 'One line hides everything you learned: loss, gradients, iterations to convergence.' },
      { code: '', stage: null, note: '' },
      { code: 'preds = model.predict(X_te)', stage: 'predict', note: 'Applies the learned weights to unseen rows. predict_proba() gives raw probabilities.' },
      { code: 'print(accuracy_score(y_te, preds))    # honest estimate', stage: 'evaluate', note: 'Evaluated on data the model never saw — this number you can trust. (Metrics lesson.)' },
    ],
  },
  pytorch: {
    name: 'PyTorch: neural net training loop',
    stages: ['model', 'data', 'forward', 'loss', 'backward', 'update'],
    lines: [
      { code: 'import torch.nn as nn', stage: null, note: 'PyTorch: the research-standard deep learning framework.' },
      { code: '', stage: null, note: '' },
      { code: 'model = nn.Sequential(', stage: 'model', note: 'Stack layers exactly like the NN Playground: 2 inputs → 8 hidden → 1 output.' },
      { code: '    nn.Linear(2, 8), nn.ReLU(),', stage: 'model', note: 'Linear = weights + bias (w·x + b). ReLU = the activation from the Activations lesson.' },
      { code: '    nn.Linear(8, 1), nn.Sigmoid())', stage: 'model', note: 'Sigmoid squashes the output to a probability.' },
      { code: 'opt = torch.optim.Adam(model.parameters(), lr=3e-4)', stage: 'model', note: 'Adam — the winner of the Optimizer Grand Prix — gets references to every weight.' },
      { code: 'loss_fn = nn.BCELoss()', stage: 'model', note: 'Binary cross-entropy: the loss from the Logistic Regression lesson.' },
      { code: '', stage: null, note: '' },
      { code: 'for epoch in range(100):', stage: 'data', note: 'One epoch = one full pass over the training data.' },
      { code: '    for X_batch, y_batch in loader:', stage: 'data', note: 'Minibatches (e.g. 32 examples) — the "stochastic" in SGD.' },
      { code: '        y_hat = model(X_batch)          # FORWARD', stage: 'forward', note: 'Data flows through the layers → predictions. (Forward pass, Backprop lesson step ①–④.)' },
      { code: '        loss = loss_fn(y_hat, y_batch)  # LOSS', stage: 'loss', note: 'One number measuring how wrong this batch was.' },
      { code: '        opt.zero_grad()', stage: 'backward', note: 'Clear old gradients — they accumulate by default (a classic beginner bug!).' },
      { code: '        loss.backward()                 # BACKWARD', stage: 'backward', note: 'Autograd runs backpropagation: every weight gets its ∂loss/∂w. (Backprop lesson!)' },
      { code: '        opt.step()                      # UPDATE', stage: 'update', note: 'Adam nudges every weight downhill. Then the loop repeats — that\'s all training is.' },
    ],
  },
};

const STAGE_LABELS = {
  load: '📦 load', split: '✂️ split', scale: '⚖️ scale', train: '🏋️ train', predict: '🔮 predict', evaluate: '🎯 evaluate',
  model: '🧠 build', data: '📦 batch', forward: '➡️ forward', loss: '📉 loss', backward: '⬅️ backward', update: '🔧 update',
};

export default {
  id: 'ml-code',
  emoji: '💻',
  title: 'From Concepts to Code',
  level: 'Beginner',
  blurb: 'Every lesson you\'ve learned, condensed into the 15 lines of Python that practitioners actually write.',

  render(root) {
    root.appendChild(html(`
      <p>Here's a secret: after all the theory, real ML code is <strong>short</strong>. The two snippets below are genuinely what practitioners write — a full scikit-learn workflow and a complete PyTorch training loop. Every line maps to a lesson on this site.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Load and split:</strong> Read your data into a NumPy array or DataFrame. Immediately split into train and test sets (80/20) — the test set is locked away and never touched until final evaluation. This is the golden rule from the Cross-Validation lesson.</li>
          <li><strong>Preprocess (fit on train only):</strong> Scale features, encode categories, handle missing values — but compute all statistics (mean, std, vocabulary) from the training set only. Apply the same transformation to test data. Any leakage here invalidates your results.</li>
          <li><strong>Choose and train a model:</strong> scikit-learn: <code>model.fit(X_train, y_train)</code>. PyTorch: loop over batches, run forward pass, compute loss, backpropagate, update weights. The concepts are the same; the API verbosity differs.</li>
          <li><strong>Predict and evaluate:</strong> <code>model.predict(X_test)</code> generates predictions on held-out data. Compare against true labels using appropriate metrics (accuracy, F1, RMSE). This number — computed on data the model never trained on — is your honest performance estimate.</li>
          <li><strong>Iterate:</strong> If performance is poor, don't touch the test set. Instead, use cross-validation on the training set to tune hyperparameters, try different models, or engineer better features. Only evaluate on the test set once, at the very end.</li>
        </ol>
      </div>

      <h3>Walk the code</h3>
      <p>Press <strong>Step</strong> to walk through line by line. The pipeline diagram lights up to show which conceptual stage each line belongs to, and the note connects it back to the lesson where you learned it.</p>
    `));

    let snipKey = 'sklearn';
    let lineIdx = -1;
    let playing = false, timer = null;

    const cv = makeCanvas(110);
    const codeEl = h('pre', { style: { margin: 0, fontFamily: 'Consolas, monospace', fontSize: '0.84rem', lineHeight: '1.65', overflowX: 'auto', padding: '12px 0' } });
    const noteEl = h('div', { class: 'callout callout-info', style: { marginTop: '12px', minHeight: '3.4em' } }, 'Press Step ▸ to walk through the code.');

    function currentStage() {
      const s = SNIPPETS[snipKey];
      if (lineIdx < 0) return null;
      // last non-null stage at or before current line
      for (let i = lineIdx; i >= 0; i--) if (s.lines[i].stage) return s.lines[i].stage;
      return null;
    }

    function drawPipeline() {
      const s = SNIPPETS[snipKey];
      const cur = currentStage();
      const seen = new Set();
      if (lineIdx >= 0) for (let i = 0; i <= lineIdx; i++) if (s.lines[i].stage) seen.add(s.lines[i].stage);
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const n = s.stages.length;
      const bw = Math.min(130, (W - 30) / n);
      s.stages.forEach((st, i) => {
        const x = 15 + i * bw, y = H / 2 - 22;
        const active = st === cur;
        const done = seen.has(st) && !active;
        ctx.fillStyle = active ? 'rgba(88,166,255,0.25)' : done ? 'rgba(63,185,80,0.12)' : 'rgba(28,34,48,1)';
        ctx.strokeStyle = active ? '#58a6ff' : done ? 'rgba(63,185,80,0.5)' : '#2d3548';
        ctx.lineWidth = active ? 2 : 1;
        const w = bw - 16;
        ctx.beginPath();
        ctx.roundRect(x, y, w, 44, 8);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = active ? '#e6edf3' : done ? '#3fb950' : '#8b96a8';
        ctx.font = (active ? 'bold ' : '') + '12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(STAGE_LABELS[st], x + w / 2, y + 27);
        ctx.textAlign = 'left';
        if (i < n - 1) {
          ctx.strokeStyle = done || active ? '#58a6ff' : '#2d3548';
          ctx.beginPath();
          ctx.moveTo(x + w + 2, y + 22);
          ctx.lineTo(x + bw - 2, y + 22);
          ctx.stroke();
        }
      });
    }
    cv.onResize(drawPipeline);

    function renderCode() {
      const s = SNIPPETS[snipKey];
      codeEl.innerHTML = '';
      s.lines.forEach((ln, i) => {
        const isCur = i === lineIdx;
        const row = h('div', {
          style: {
            padding: '0 12px',
            whiteSpace: 'pre',
            background: isCur ? 'rgba(88,166,255,0.15)' : 'transparent',
            borderLeft: isCur ? '3px solid #58a6ff' : '3px solid transparent',
            opacity: lineIdx >= 0 && i > lineIdx ? 0.45 : 1,
          },
        });
        const span = h('span', { style: { color: '#e6edf3' } });
        span.textContent = ln.code || ' ';
        span.innerHTML = span.innerHTML
          .replace(/(#.*$)/g, '<span style="color:#6a737d">$1</span>')
          .replace(/\b(from|import|for|in|range|print)\b/g, '<span style="color:#bc8cff">$1</span>')
          .replace(/(&#039;.*?&#039;|'[^']*')/g, '<span style="color:#39d2c0">$1</span>');
        row.appendChild(span);
        codeEl.appendChild(row);
      });
      const cur = lineIdx >= 0 ? s.lines[lineIdx] : null;
      noteEl.textContent = cur && cur.note ? cur.note : (cur ? '…' : 'Press Step ▸ to walk through the code.');
      drawPipeline();
    }

    function nextLine() {
      const s = SNIPPETS[snipKey];
      let i = lineIdx + 1;
      while (i < s.lines.length && !s.lines[i].code.trim()) i++; // skip blanks
      if (i < s.lines.length) { lineIdx = i; renderCode(); }
      else stopPlay();
    }
    function stopPlay() { playing = false; clearTimeout(timer); playBtn.textContent = '▶ Auto-play'; }
    function playLoop() {
      if (!playing) return;
      nextLine();
      const s = SNIPPETS[snipKey];
      if (lineIdx < s.lines.length - 1) timer = setTimeout(playLoop, 1800);
      else stopPlay();
    }
    onLeave(stopPlay);

    const stepBtn = button('Step ▸', () => { stopPlay(); nextLine(); });
    const playBtn = button('▶ Auto-play', () => {
      if (playing) { stopPlay(); return; }
      const s = SNIPPETS[snipKey];
      if (lineIdx >= s.lines.length - 1) lineIdx = -1;
      playing = true;
      playBtn.textContent = '⏸ Pause';
      playLoop();
    });
    const resetBtn = button('↺ Restart', () => { stopPlay(); lineIdx = -1; renderCode(); }, true);
    const sel = selectBox('Snippet', Object.entries(SNIPPETS).map(([v, s]) => ({ value: v, label: s.name })), v => {
      stopPlay(); snipKey = v; lineIdx = -1; renderCode();
    }, 'sklearn');

    root.appendChild(demoPanel(
      'Annotated real-world code',
      'The pipeline above lights up as you step: blue = current stage, green = completed stages.',
      cv.canvas,
      h('div', { style: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '10px' } }, codeEl),
      noteEl,
      h('div', { class: 'controls' }, [stepBtn, playBtn, resetBtn, sel.el]),
    ));
    renderCode();

    root.appendChild(html(`
      <h3>The ecosystem map</h3>
      <table class="info-table">
        <tr><th>Library</th><th>What it's for</th><th>Mental model</th></tr>
        <tr><td><b>NumPy</b></td><td>Fast arrays &amp; math</td><td>The foundation everything sits on</td></tr>
        <tr><td><b>pandas</b></td><td>Tables, cleaning, CSV/SQL</td><td>Excel with superpowers, in code</td></tr>
        <tr><td><b>scikit-learn</b></td><td>Classical ML (everything in our Classical ML section)</td><td>One consistent API: <code>fit / predict / transform</code></td></tr>
        <tr><td><b>PyTorch</b></td><td>Neural networks, GPUs, autograd</td><td>NumPy that remembers gradients</td></tr>
        <tr><td><b>matplotlib / seaborn</b></td><td>Plotting</td><td>How you actually see your data</td></tr>
        <tr><td><b>Hugging Face</b></td><td>Pretrained transformers, one line to download</td><td>The app store of models</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 The fit/predict contract</div>
      Every scikit-learn model — logistic regression, SVM, random forest, k-means — uses the identical three methods: <code>fit(X, y)</code> to train, <code>predict(X)</code> to infer, <code>score(X, y)</code> to evaluate. Swap <code>LogisticRegression()</code> for <code>RandomForestClassifier()</code> and nothing else changes. That's why you learned <em>concepts</em> here, not APIs: the API is trivial once the concepts are yours.</div>
      <div class="callout callout-info"><div class="callout-title">📌 Try it for real</div>
      Install Python, then <code>pip install scikit-learn torch jupyter</code>, open a notebook, and retype the snippets above against the <code>sklearn.datasets.make_moons()</code> dataset — the same moons you trained in the NN Playground.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — pipelines, model persistence, and common bugs</summary>
        <div class="deep-dive-body">
          <h4>scikit-learn Pipelines</h4>
          <p>Instead of manually chaining preprocessing and model steps, wrap them in a Pipeline:</p>
          <div class="formula">from sklearn.pipeline import Pipeline
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression())
])
pipe.fit(X_train, y_train)   # scaler.fit + model.fit
pipe.predict(X_test)         # scaler.transform + model.predict</div>
          <p>Pipelines guarantee that preprocessing is fit on training data only, even inside cross-validation. They also make deployment trivial — save one object, and it handles everything from raw input to prediction.</p>

          <h4>Model Persistence</h4>
          <p>Save trained models for production: scikit-learn uses <code>joblib.dump(model, 'model.pkl')</code>. PyTorch uses <code>torch.save(model.state_dict(), 'model.pt')</code> — always save the state_dict (weights only), not the whole model, because the class definition must be importable at load time. Never unpickle models from untrusted sources — pickle files can execute arbitrary code.</p>

          <h4>The Top 5 ML Code Bugs</h4>
          <ol>
            <li><strong>Data leakage:</strong> Fitting the scaler on the full dataset before splitting. The test set's statistics leak into the training pipeline.</li>
            <li><strong>Forgetting to zero gradients:</strong> PyTorch accumulates gradients by default. Missing <code>optimizer.zero_grad()</code> makes gradients grow every batch until the model diverges.</li>
            <li><strong>Wrong loss function:</strong> Using MSE for classification or cross-entropy for regression. The loss must match the task.</li>
            <li><strong>Shape mismatches:</strong> A <code>(batch, features)</code> matrix hitting a <code>(wrong_features, outputs)</code> weight matrix. Print shapes liberally during debugging.</li>
            <li><strong>Evaluating on training data:</strong> Reporting accuracy on the same data the model was trained on. Always use held-out data.</li>
          </ol>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "More complex models always perform better."</div>
          <p><strong>✅ Reality:</strong> On tabular data, a well-tuned gradient-boosted tree (XGBoost, LightGBM) often beats deep learning. On small datasets, logistic regression with good features can beat a neural network. Complexity should be proportional to the signal in your data — not to your ambition.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "The model is the most important part of ML."</div>
          <p><strong>✅ Reality:</strong> Practitioners spend 80% of their time on data — cleaning, labeling, feature engineering, handling imbalance. The model choice often matters less than the quality of the data going into it. Andrew Ng's "data-centric AI" movement formalizes this: improve the data, not the model.</p>

          <h4>Historical Context</h4>
          <p>scikit-learn was started by David Cournapeau as a Google Summer of Code project in 2007 and became the standard ML library by 2012. Its consistent <code>fit/predict/transform</code> API — inspired by earlier R packages — became the template that every subsequent ML library followed. PyTorch (2017) displaced TensorFlow as the research standard by offering eager execution (define-by-run) instead of static computation graphs. The Hugging Face Transformers library (2018) further simplified ML by making pretrained models a one-line download.</p>
        </div>
      </details>
    `));
  },
};
