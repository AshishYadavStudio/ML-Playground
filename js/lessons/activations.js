// Lesson: Activation Functions — interactive function/derivative explorer
import {
  h, html, makeCanvas, demoPanel, selectBox, statRow, pointerPos, slider,
} from '../utils.js';

const FUNCS = {
  sigmoid: {
    name: 'Sigmoid', f: x => 1 / (1 + Math.exp(-x)),
    d: x => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
    range: 'σ(x) ∈ (0, 1)',
    story: 'The classic. Outputs a probability — still standard for the final layer of binary classifiers. As a hidden activation it fell out of favor: its derivative maxes out at 0.25 and vanishes for |x| > 4, strangling gradients in deep stacks.',
  },
  tanh: {
    name: 'Tanh', f: x => Math.tanh(x),
    d: x => 1 - Math.tanh(x) ** 2,
    range: 'tanh(x) ∈ (−1, 1)',
    story: 'A zero-centered sigmoid. Better than sigmoid for hidden layers (outputs average around 0, which conditions gradients nicely), and the traditional choice inside RNNs/LSTMs. Still saturates at the tails.',
  },
  relu: {
    name: 'ReLU', f: x => Math.max(0, x),
    d: x => (x > 0 ? 1 : 0),
    range: 'ReLU(x) ∈ [0, ∞)',
    story: 'max(0, x) — comically simple, and it unlocked modern deep learning. The derivative is exactly 1 for active units, so gradients survive 100+ layers. Weakness: a neuron pushed permanently negative outputs 0 forever ("dead ReLU").',
  },
  leaky: {
    name: 'Leaky ReLU', f: x => (x > 0 ? x : 0.1 * x),
    d: x => (x > 0 ? 1 : 0.1),
    range: 'LeakyReLU(x) ∈ (−∞, ∞)',
    story: 'ReLU with a small slope (here 0.1) on the negative side, so no neuron can fully die — a tiny gradient always flows. A cheap, safe upgrade over plain ReLU.',
  },
  gelu: {
    name: 'GELU', f: x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    d: x => {
      const t = Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3);
      const th = Math.tanh(t);
      const dt = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * x * x);
      return 0.5 * (1 + th) + 0.5 * x * (1 - th * th) * dt;
    },
    range: 'GELU(x) ≈ smooth ReLU',
    story: 'A smooth, probabilistic cousin of ReLU (x times the Gaussian CDF). This is what GPT, BERT and most transformers use in their feed-forward blocks. Slight dip below zero, then smooth ramp.',
  },
};

export default {
  id: 'activations',
  emoji: '⚡',
  title: 'Activation Functions',
  level: 'Intermediate',
  blurb: 'The nonlinear spice: sigmoid to GELU, and why "vanishing gradients" nearly killed deep learning.',

  render(root) {
    root.appendChild(html_intro());

    root.appendChild(html(`
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Weighted sum arrives:</strong> Each neuron receives z = w·x + b — a linear combination of its inputs. Without an activation function, the entire network would collapse to a single linear transformation, no matter how many layers.</li>
          <li><strong>Activation squashes the sum:</strong> The nonlinear function f(z) bends the output — sigmoid squashes to (0,1), ReLU clips negatives to zero, tanh squashes to (−1,1). This bending is what lets the network model curves, not just straight lines.</li>
          <li><strong>Output feeds forward:</strong> The activated value a = f(z) becomes the input to the next layer. Each layer's nonlinear bend compounds with the next, building increasingly complex decision boundaries.</li>
          <li><strong>Gradient flows backward:</strong> During backpropagation, the derivative f'(z) is multiplied into the gradient chain. If f'(z) is tiny (sigmoid at the tails: ~0.0), gradients vanish. If f'(z) = 1 (ReLU for positive inputs), gradients pass through undiminished.</li>
          <li><strong>The choice shapes training:</strong> Different activations create different gradient flow patterns. ReLU's constant gradient enabled the training of networks with 100+ layers. Modern alternatives like GELU add smoothness near zero for better optimization in transformers.</li>
        </ol>
      </div>
    `));

    const cv = makeCanvas(360);
    let cur = 'relu';
    let probe = 1.2;
    const stats = statRow(['f(x)', "f′(x) (gradient)", 'Range']);

    const XR = 5;
    function draw() {
      const { ctx, W, H } = cv;
      const fn = FUNCS[cur];
      ctx.clearRect(0, 0, W, H);
      const pad = 34;
      // y range
      let yMin = Infinity, yMax = -Infinity;
      for (let x = -XR; x <= XR; x += 0.02) {
        yMin = Math.min(yMin, fn.f(x), fn.d(x));
        yMax = Math.max(yMax, fn.f(x), fn.d(x));
      }
      yMin = Math.min(yMin, -0.4) - 0.25; yMax = Math.max(yMax, 1.2) + 0.25;
      const toX = x => pad + (x + XR) / (2 * XR) * (W - 2 * pad);
      const toY = y => H - pad - (y - yMin) / (yMax - yMin) * (H - 2 * pad);
      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(toX(-XR), toY(0)); ctx.lineTo(toX(XR), toY(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toX(0), toY(yMin)); ctx.lineTo(toX(0), toY(yMax)); ctx.stroke();
      // derivative (filled area style)
      ctx.strokeStyle = '#ff7b9c';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let x = -XR; x <= XR; x += 0.02) {
        const px = toX(x), py = toY(fn.d(x));
        x <= -XR + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // function
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = -XR; x <= XR; x += 0.02) {
        const px = toX(x), py = toY(fn.f(x));
        x <= -XR + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      // probe point
      ctx.strokeStyle = 'rgba(227,179,65,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(toX(probe), toY(yMin)); ctx.lineTo(toX(probe), toY(yMax)); ctx.stroke();
      ctx.beginPath();
      ctx.arc(toX(probe), toY(fn.f(probe)), 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#e3b341'; ctx.fill();
      ctx.beginPath();
      ctx.arc(toX(probe), toY(fn.d(probe)), 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff7b9c'; ctx.fill();
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('x →', W - pad + 8, toY(0) + 4);

      stats.set('f(x)', fn.f(probe).toFixed(3));
      stats.set("f′(x) (gradient)", fn.d(probe).toFixed(3));
      stats.set('Range', fn.range);
      storyEl.textContent = fn.story;
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointermove', e => {
      const p = pointerPos(cv.canvas, e);
      probe = Math.max(-XR, Math.min(XR, ((p.x - 34) / (cv.W - 68)) * 2 * XR - XR));
      draw();
    });
    cv.canvas.addEventListener('pointerdown', e => {
      const p = pointerPos(cv.canvas, e);
      probe = Math.max(-XR, Math.min(XR, ((p.x - 34) / (cv.W - 68)) * 2 * XR - XR));
      draw();
    });

    const sel = selectBox('Function', Object.entries(FUNCS).map(([v, f]) => ({ value: v, label: f.name })), v => { cur = v; draw(); }, 'relu');
    const storyEl = h('p', { style: { fontSize: '0.88rem', color: '#c9d4e3', marginTop: '12px' } }, '');

    root.appendChild(demoPanel(
      'Function & gradient explorer',
      'Blue solid = the activation f(x). Pink dashed = its derivative f′(x), which is what backpropagation multiplies by. Move your mouse across the plot to probe values.',
      cv.canvas,
      h('div', { class: 'controls' }, [sel.el]),
      stats.el,
      storyEl,
    ));

    // vanishing gradient demo
    root.appendChild(htmlVanish());
    const cv2 = makeCanvas(240);
    let depth = 8;
    let act2 = 'sigmoid';
    function drawVanish() {
      const { ctx, W, H } = cv2;
      ctx.clearRect(0, 0, W, H);
      // gradient magnitude through layers: product of typical derivative values
      const typical = { sigmoid: 0.2, tanh: 0.65, relu: 1.0 };
      const g0 = 1;
      const pad = 40;
      const barW = (W - 2 * pad) / depth;
      let g = g0;
      for (let l = 0; l < depth; l++) {
        g *= typical[act2];
        const hgt = Math.max(2, g * (H - 70));
        const x = pad + l * barW;
        const alpha = Math.max(0.15, g);
        ctx.fillStyle = g < 0.01 ? 'rgba(248,81,73,0.8)' : `rgba(88,166,255,${alpha})`;
        ctx.fillRect(x + 3, H - 40 - hgt, barW - 6, hgt);
        ctx.fillStyle = '#8b96a8';
        ctx.font = '10px Consolas';
        if (depth <= 14 || l % 2 === 0) ctx.fillText(g.toExponential(0), x + 2, H - 24);
      }
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('← output layer          gradient magnitude flowing backward          input layer →', pad, 16);
    }
    cv2.onResize(drawVanish);
    const depthS = slider('Network depth', { min: 2, max: 20, step: 1, value: 8 }, v => { depth = v; drawVanish(); });
    const actSel2 = selectBox('Hidden activation', [
      { value: 'sigmoid', label: 'Sigmoid (f′ ≈ 0.2)' },
      { value: 'tanh', label: 'Tanh (f′ ≈ 0.65)' },
      { value: 'relu', label: 'ReLU (f′ = 1.0)' },
    ], v => { act2 = v; drawVanish(); }, 'sigmoid');

    root.appendChild(demoPanel(
      'The vanishing gradient, visualized',
      'Each bar = gradient magnitude reaching that layer during backprop (product of derivatives along the way). Red bars are effectively zero — those layers learn nothing.',
      cv2.canvas,
      h('div', { class: 'controls' }, [depthS.el, actSel2.el]),
    ));

    root.appendChild(htmlOutro());

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: Neuron Wiring: Solve XOR</div>
        See activation functions do real work — hand-tune a tiny tanh network until it solves a problem a linear model never could. <a href="../games/neuron-wiring/" style="color:var(--accent);font-weight:700;">Play Neuron Wiring →</a>
      </div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Activation Design, Saturation, and Dying Neurons</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>An activation function must be nonlinear — otherwise any composition of linear layers L₂(L₁(x)) = (W₂W₁)x + (W₂b₁ + b₂) remains linear. The key properties that matter are:</p>
          <div class="formula">σ(x) = 1/(1+e<sup>−x</sup>), &nbsp; σ'(x) = σ(x)(1−σ(x)), &nbsp; max σ'(x) = 0.25 at x=0</div>
          <div class="formula">ReLU(x) = max(0, x), &nbsp; ReLU'(x) = 1 if x > 0, else 0</div>
          <div class="formula">GELU(x) = x · Φ(x), &nbsp; where Φ is the standard Gaussian CDF</div>
          <p>The sigmoid derivative peaks at only 0.25. Multiplying n such values gives 0.25<sup>n</sup> — after just 10 layers, the gradient is attenuated by a factor of ~10<sup>−6</sup>. ReLU's derivative is exactly 1 for active neurons, solving this entirely.</p>

          <h4>Sigmoid Saturation</h4>
          <p>When |z| is large, sigmoid outputs are near 0 or 1 and the derivative approaches zero. This is <strong>saturation</strong>: the neuron is "confident" but unable to learn. In a deep network, even moderate z values compound the problem. Batch normalization helps by keeping pre-activation values centered near zero where the derivative is largest.</p>

          <h4>The Dying ReLU Problem</h4>
          <p>If a neuron's bias becomes sufficiently negative (or a large gradient update pushes weights so that w·x + b < 0 for all training inputs), the ReLU output is permanently zero. Its gradient is also zero, so it can never recover — the neuron is "dead." This is not rare: studies have found 10-40% of neurons can die during training with high learning rates. Leaky ReLU (slope 0.01 for negative inputs) and PReLU (learnable slope) were designed as fixes.</p>

          <h4>Intuition</h4>
          <p>Think of activation functions as gatekeepers. Sigmoid is a cautious gatekeeper that lets everything through but squishes it into a narrow hallway (0 to 1) — messages get quieter and quieter. ReLU is a bouncer that blocks negatives entirely but lets positives through at full volume. GELU is a probabilistic bouncer that mostly blocks negatives but occasionally lets a slightly negative value leak through — this smoothness near zero helps optimization find better paths.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "ReLU is always better than sigmoid."</div>
          <p><strong>✅ Reality:</strong> ReLU is better for <em>hidden layers</em> in deep networks because of gradient flow. But sigmoid is still the correct choice for the output layer of a binary classifier (it produces a valid probability). And tanh remains standard in LSTMs where the (−1, 1) range interacts with gating mechanisms. The right choice depends on where in the architecture you are.</p>

          <div class="misconception"><strong>❌ Misconception:</strong> "GELU is just a smooth version of ReLU — they're basically the same."</div>
          <p><strong>✅ Reality:</strong> GELU(x) = x · Φ(x) weights each input by how likely it is to be "above average" under a Gaussian. Unlike ReLU, GELU has a non-zero gradient everywhere and a slight negative region (minimum ≈ −0.17 at x ≈ −0.75). This stochastic regularization effect and smoothness contribute to measurably better performance in transformers, which is why GPT and BERT adopted it.</p>

          <h4>Historical Context</h4>
          <p>Sigmoid dominated from the 1980s through the 2000s. The vanishing gradient problem it caused was identified by Hochreiter (1991) and motivated the invention of LSTMs (1997). ReLU was introduced to deep learning by Nair & Hinton (2010) and was critical to AlexNet's success (2012). GELU was proposed by Hendrycks & Gimpel (2016) and became the default in transformers after BERT (2018). The SwiGLU variant (Shazeer, 2020) — used in LLaMA and PaLM — combines Swish activation with gated linear units for even better transformer performance.</p>
        </div>
      </details>
    `));
  },
};

function html_intro() {
  const d = document.createElement('div');
  d.innerHTML = `
    <p>Remove the activation functions from a neural network and something embarrassing happens: a stack of linear layers collapses into… <strong>one linear layer</strong>. (A linear function of a linear function is linear.) All the network's power to bend space comes from the little nonlinearity applied at each neuron.</p>
    <div class="formula">W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂) &nbsp; — &nbsp; still just a line. σ breaks the collapse.</div>
    <p>But which nonlinearity? The choice shapes how gradients flow backward through the network — explore below.</p>`;
  return d;
}
function htmlVanish() {
  const d = document.createElement('div');
  d.innerHTML = `
    <h3>Why ReLU conquered the world: vanishing gradients</h3>
    <p>Backpropagation multiplies derivatives layer by layer. If each layer's derivative is ~0.2 (sigmoid), after 10 layers the gradient reaching the early layers is 0.2¹⁰ ≈ <strong>one ten-millionth</strong> of its original size — those layers simply stop learning. This <em>vanishing gradient problem</em> stalled deep learning for years. Play with depth and activation:</p>`;
  return d;
}
function htmlOutro() {
  const d = document.createElement('div');
  d.innerHTML = `
    <h3>Cheat sheet</h3>
    <table class="info-table">
      <tr><th>Use case</th><th>Recommended</th></tr>
      <tr><td>Hidden layers, default choice</td><td><b>ReLU</b> (or Leaky ReLU if you see dead neurons)</td></tr>
      <tr><td>Transformer feed-forward blocks</td><td><b>GELU</b> / SwiGLU</td></tr>
      <tr><td>Binary output layer</td><td><b>Sigmoid</b> (gives a probability)</td></tr>
      <tr><td>Multi-class output layer</td><td><b>Softmax</b> (probabilities across k classes)</td></tr>
      <tr><td>Regression output layer</td><td><b>None</b> — raw linear output</td></tr>
    </table>
    <div class="callout callout-tip"><div class="callout-title">💡 Softmax in one line</div>
    softmax(z)ₖ = e^{zₖ} / Σⱼ e^{zⱼ} — exponentiate every score and normalize so they sum to 1. It's the multi-class sigmoid, and you'll meet it again inside transformer attention.</div>`;
  return d;
}
