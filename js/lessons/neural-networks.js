// Lesson: Neural Networks — a live playground: pick data, pick layers, train in-browser
import {
  h, html, makeCanvas, demoPanel, slider, button, selectBox, statRow, legend,
  seed, dataMoons, dataCircle, dataXor, dataSpiral, dataBlobs,
  makeScale, drawGrid, drawPoint, paintHeatmap, drawLineChart, CLASS_COLORS, MLP,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'neural-networks',
  emoji: '🧠',
  title: 'Neural Networks',
  level: 'Intermediate',
  blurb: 'The playground: stack layers, pick a dataset, press train, and watch a brain-inspired function learn.',

  render(root) {
    root.appendChild(html(`
      <p>Logistic regression could only draw straight boundaries. A <strong>neural network</strong> fixes that by stacking simple units: each <em>neuron</em> computes a weighted sum of its inputs, then applies a nonlinear squash (the <em>activation</em>). Layer by layer, the network <strong>bends and folds space</strong> until the classes become separable by a straight cut.</p>
      <div class="formula">neuron: a = σ(w·x + b) &nbsp;&nbsp;&nbsp; layer: h = σ(W·x + b) &nbsp;&nbsp;&nbsp; network: ŷ = σ(W₃·σ(W₂·σ(W₁·x)))</div>
      <ul>
        <li><strong>Width</strong> = neurons per layer. <strong>Depth</strong> = number of layers ("deep" learning = many layers).</li>
        <li>The <em>universal approximation theorem</em>: even one hidden layer can approximate any continuous function — given enough neurons. Depth just does it exponentially more efficiently.</li>
      </ul>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Initialize weights:</strong> Every connection between neurons gets a small random weight. These weights are the "knobs" the network will tune during training.</li>
          <li><strong>Forward pass:</strong> An input flows through the network layer by layer. At each neuron, the weighted sum of incoming values is computed (w·x + b), then squeezed through a nonlinear activation function like tanh or ReLU.</li>
          <li><strong>Compute loss:</strong> The network's output is compared to the true label using a loss function (e.g., cross-entropy). This single number measures how wrong the prediction is.</li>
          <li><strong>Backward pass (backprop):</strong> The gradient of the loss with respect to every weight is computed by applying the chain rule backward through the layers — this tells each weight which direction to move.</li>
          <li><strong>Update weights:</strong> Each weight is nudged opposite to its gradient by a small step (the learning rate). Repeat from step 2 with a new batch of data points until the loss is small.</li>
        </ol>
      </div>

      <h3>The playground</h3>
      <p>Everything below runs live in your browser. Start with <strong>moons</strong> and the default network. Then try the <strong>spiral</strong> — first with 1 small layer (watch it struggle), then with 2–3 layers of 8 (watch it succeed). This is the "aha" moment of deep learning.</p>
    `));

    const DATASETS = { moons: dataMoons, circle: dataCircle, xor: dataXor, spiral: dataSpiral, blobs: dataBlobs };
    let dsName = 'moons';
    let hiddenLayers = 2, width = 6, lr = 0.08, activation = 'tanh';
    let points, net, running = false, raf = null, epoch = 0;
    const lossHist = [];

    const cv = makeCanvas(440);
    const scale = makeScale(cv);
    const chart = makeCanvas(180);
    const stats = statRow(['Epoch', 'Loss', 'Accuracy', 'Parameters']);

    function paramCount(sizes) {
      let n = 0;
      for (let i = 0; i < sizes.length - 1; i++) n += sizes[i] * sizes[i + 1] + sizes[i + 1];
      return n;
    }

    function rebuild(newData = true) {
      running = false;
      cancelAnimationFrame(raf);
      playBtn.textContent = '▶ Train';
      if (newData) { seed(61); points = DATASETS[dsName](140); }
      const sizes = [2, ...Array(hiddenLayers).fill(width), 1];
      net = new MLP(sizes, activation);
      epoch = 0;
      lossHist.length = 0;
      draw();
    }

    function draw() {
      const { ctx } = cv;
      ctx.clearRect(0, 0, cv.W, cv.H);
      paintHeatmap(cv, scale, (x, y) => net.predict([x, y]), 42);
      drawGrid(cv, scale);
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label], 4.5);
      let correct = 0;
      for (const p of points) if ((net.predict([p.x, p.y]) > 0.5 ? 1 : 0) === p.label) correct++;
      stats.set('Epoch', String(epoch));
      stats.set('Loss', lossHist.length ? lossHist[lossHist.length - 1].toFixed(4) : '—');
      stats.set('Accuracy', (correct / points.length * 100).toFixed(1) + '%');
      stats.set('Parameters', String(paramCount(net.sizes)));
      drawLineChart(chart, [{ data: lossHist.slice(-300), color: '#bc8cff' }], { minY: 0 });
    }
    cv.onResize(draw);
    chart.onResize(draw);

    function trainLoop() {
      if (!running) return;
      let loss = 0;
      // several minibatch steps per frame
      for (let s = 0; s < 8; s++) {
        const batch = [];
        for (let i = 0; i < 16; i++) {
          const p = points[Math.floor(Math.random() * points.length)];
          batch.push({ x: [p.x, p.y], y: p.label });
        }
        loss = net.trainStep(batch, lr);
      }
      epoch++;
      lossHist.push(loss);
      draw();
      raf = requestAnimationFrame(trainLoop);
    }

    const playBtn = button('▶ Train', () => {
      running = !running;
      playBtn.textContent = running ? '⏸ Pause' : '▶ Train';
      if (running) trainLoop();
    });
    const resetBtn = button('↺ Reset network', () => rebuild(false), true);
    onLeave(() => { running = false; cancelAnimationFrame(raf); });

    const dsSel = selectBox('Dataset', [
      { value: 'moons', label: '🌙 Moons' },
      { value: 'circle', label: '⭕ Circle' },
      { value: 'xor', label: '❎ XOR' },
      { value: 'spiral', label: '🌀 Spiral (hard!)' },
      { value: 'blobs', label: '💧 Blobs (easy)' },
    ], v => { dsName = v; rebuild(); }, 'moons');
    const layersS = slider('Hidden layers', { min: 1, max: 4, step: 1, value: 2 }, v => { hiddenLayers = v; rebuild(false); });
    const widthS = slider('Neurons / layer', { min: 2, max: 16, step: 1, value: 6 }, v => { width = v; rebuild(false); });
    const lrS = slider('Learning rate', { min: 0.005, max: 0.5, step: 0.005, value: 0.08, fmt: v => v.toFixed(3) }, v => { lr = v; });
    const actSel = selectBox('Activation', ['tanh', 'relu', 'sigmoid'], v => { activation = v; rebuild(false); }, 'tanh');

    rebuild();

    root.appendChild(demoPanel(
      'Neural network playground',
      'Background = the network\'s current decision function. Press Train and watch it sculpt the boundary in real time.',
      cv.canvas,
      h('div', { class: 'controls' }, [playBtn, resetBtn, dsSel.el, layersS.el, widthS.el, lrS.el, actSel.el]),
      stats.el,
      h('div', { style: { marginTop: '14px' } }, [
        h('div', { class: 'demo-hint' }, 'Training loss (last 300 epochs):'),
        chart.canvas,
      ]),
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Neuron Wiring: Solve XOR</div>
        Hand-tune all 9 weights of a tiny network until it solves XOR — a problem no single straight boundary can ever separate. <a href="../games/neuron-wiring/" style="color:var(--accent);font-weight:700;">Play Neuron Wiring →</a>
      </div>

      <h3>Experiments worth running</h3>
      <ul>
        <li><strong>Spiral with 1 layer × 2 neurons:</strong> stuck — not enough capacity to fold the space. <em>Underfitting live.</em></li>
        <li><strong>Spiral with 3 layers × 8:</strong> watch the boundary slowly wind into the spiral. Depth buys expressive folding.</li>
        <li><strong>Learning rate 0.5 on any dataset:</strong> the loss curve goes chaotic — the divergence you met in the Gradient Descent lesson, now in 2-D.</li>
        <li><strong>ReLU vs tanh:</strong> ReLU boundaries are made of straight facets (piecewise-linear); tanh gives smooth curves.</li>
      </ul>
      <h3>What's inside (anatomy of one training step)</h3>
      <ol>
        <li><strong>Forward pass:</strong> push a minibatch of points through the layers to get predictions.</li>
        <li><strong>Loss:</strong> cross-entropy between predictions and true labels.</li>
        <li><strong>Backward pass (backpropagation):</strong> compute the gradient of the loss w.r.t. every weight — next lesson dissects this.</li>
        <li><strong>Update:</strong> nudge every weight opposite its gradient (SGD — or fancier, see Optimizers).</li>
      </ol>
      <div class="callout callout-info"><div class="callout-title">📌 Scale perspective</div>
      The network you just trained has a few hundred parameters. GPT-class language models use the <em>same recipe</em> — forward, loss, backprop, update — with hundreds of billions of parameters and internet-scale data. The core loop you just watched <em>is</em> deep learning.</div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Universal Approximation and Network Design</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>The <strong>Universal Approximation Theorem</strong> (Cybenko 1989, Hornik 1991) states that a feed-forward network with a single hidden layer containing a finite number of neurons can approximate any continuous function on a compact subset of R<sup>n</sup>, given a non-constant, bounded, and continuous activation function.</p>
          <div class="formula">For any continuous f: [0,1]<sup>n</sup> → R and any ε > 0, there exists N neurons such that: |F(x) − f(x)| < ε for all x ∈ [0,1]<sup>n</sup>, where F(x) = Σᵢ αᵢ σ(wᵢ·x + bᵢ)</div>
          <p>However, this is an <em>existence</em> result — it says the network exists, not that gradient descent will find it. And the required width N can be exponentially large. Depth provides exponential compression: a function that needs 2<sup>n</sup> neurons in one layer may need only O(n) neurons spread across O(n) layers.</p>

          <h4>Intuition</h4>
          <p>Think of each neuron as a "crease" in a sheet of paper. One hidden layer can fold the paper in many places but only along parallel lines. Adding layers lets the network fold the <em>already-folded</em> paper — composing folds creates exponentially more complex shapes with far fewer total creases. This is why a 3-layer network with 8 neurons per layer can solve the spiral, but a 1-layer network with 16 neurons cannot.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "More layers always means better performance."</div>
          <p><strong>✅ Reality:</strong> Deeper networks are harder to train due to vanishing/exploding gradients and optimization difficulties. Without techniques like residual connections, batch normalization, and careful initialization, networks beyond ~20 layers often perform <em>worse</em> than shallower ones. The breakthrough of ResNets (2015) was showing that skip connections let gradients flow through 100+ layers.</p>

          <div class="misconception"><strong>❌ Misconception:</strong> "Neural networks find the globally optimal solution."</div>
          <p><strong>✅ Reality:</strong> The loss landscape of a neural network is non-convex with many local minima and saddle points. SGD does not guarantee convergence to the global minimum. In practice, the many local minima in large networks tend to have similar loss values (a phenomenon studied by Choromanska et al., 2015), so finding any of them works well enough.</p>

          <h4>Weight Initialization Matters</h4>
          <p>If weights start too large, activations saturate and gradients vanish. Too small, and signals shrink to zero across layers. <strong>Xavier initialization</strong> (Glorot & Bengio, 2010) sets weights from a distribution with variance 2/(n_in + n_out). <strong>He initialization</strong> (He et al., 2015) uses variance 2/n_in, which is better suited for ReLU activations. These simple choices made training deep networks practical.</p>

          <h4>Historical Context</h4>
          <p>The perceptron (Rosenblatt, 1958) could only learn linear boundaries. Minsky and Papert's 1969 book proved this limitation (XOR is unsolvable), triggering the first "AI winter." Backpropagation through multi-layer networks was popularized by Rumelhart, Hinton, and Williams in 1986, but deep networks remained impractical until ~2006 when Hinton showed layer-wise pretraining could work, and ~2012 when AlexNet demonstrated that deep CNNs trained end-to-end with ReLU, dropout, and GPUs could dominate image recognition.</p>
        </div>
      </details>
    `));
  },
};
