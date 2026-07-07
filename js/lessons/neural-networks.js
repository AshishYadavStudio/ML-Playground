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
  },
};
