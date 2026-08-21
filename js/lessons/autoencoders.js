// Lesson: Autoencoders — encoder → bottleneck → decoder, with a dial for bottleneck size
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, rand, randn, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'autoencoders',
  emoji: '🗜️',
  title: 'Autoencoders',
  level: 'Advanced',
  blurb: 'Learn to compress data through a narrow bottleneck. The trick behind denoising, anomaly detection, and generative models.',

  render(root) {
    root.appendChild(html(`
      <p>An <strong>autoencoder</strong> is a neural network trained to <em>copy its input to its output</em> — but forced through a narrow middle layer that can't possibly memorize everything. To do the job, that bottleneck has to learn a <strong>compact code</strong> capturing what really matters in the data.</p>
      <div class="formula">x &nbsp;→&nbsp; <b>encoder</b> &nbsp;→&nbsp; z (small!) &nbsp;→&nbsp; <b>decoder</b> &nbsp;→&nbsp; x̂ &nbsp;&nbsp; loss = ‖x − x̂‖²</div>
      <ul>
        <li>Same output as input, no labels needed → this is <strong>self-supervised</strong> learning.</li>
        <li>The bottleneck vector <code>z</code> is a learned <strong>compression</strong> of x. It's the same idea as PCA — but with nonlinear encoders and decoders, so it can capture far richer structure.</li>
      </ul>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Encoder compresses:</strong> The input x (e.g., a 2-D point or a 784-pixel image) is passed through one or more neural network layers that progressively reduce dimensionality, producing a small latent vector z. This forces the network to learn which features of the input actually matter.</li>
          <li><strong>Bottleneck constrains:</strong> The latent code z lives in a much lower-dimensional space than the input (e.g., 2-D input squeezed to 1-D). This information bottleneck is the entire point — it prevents the network from simply memorizing inputs and forces it to learn a compressed representation.</li>
          <li><strong>Decoder reconstructs:</strong> The decoder takes z and tries to reconstruct the original input x, producing x-hat. It mirrors the encoder architecture but in reverse — expanding from the small latent space back to the full input dimension.</li>
          <li><strong>Loss measures fidelity:</strong> The reconstruction loss (typically mean squared error ||x - x-hat||²) measures how much information was lost during compression. Training minimizes this loss, pushing the encoder to preserve the most important features.</li>
          <li><strong>Latent space emerges:</strong> After training, the bottleneck layer contains a learned coordinate system where similar inputs are nearby. This latent space can be used for visualization, generation (sample new z values and decode them), or as features for downstream tasks.</li>
        </ol>
      </div>

      <h3>Try it: squeeze data through a bottleneck</h3>
      <p>Below is a 2-D dataset shaped like a curve. Our autoencoder is a tiny <code>2 → k → 2</code> network. Change <b>k</b> — the bottleneck size — and watch reconstruction quality.</p>
    `));

    seed(19);
    // Curved 2D dataset (points along a sine on x)
    const raw = [];
    for (let i = 0; i < 140; i++) {
      const t = -1 + (i / 139) * 2;
      const y = 0.6 * Math.sin(2.5 * t) + randn() * 0.05;
      raw.push({ x: t, y: clamp(y, -0.95, 0.95) });
    }

    let k = 1; // bottleneck size
    // For a 2→k→2 autoencoder we implement it with plain matrix math.
    let We = [], be = [], Wd = [], bd = [];
    let training = false, raf = null, epoch = 0, lossHist = [];
    const cv = makeCanvas(360);
    const chart = makeCanvas(140);
    const stats = statRow(['Bottleneck k', 'Epoch', 'Reconstruction MSE']);

    function initNet() {
      // Weights: encoder 2→k, decoder k→2, tanh activation on hidden
      We = Array.from({ length: k }, () => Array.from({ length: 2 }, () => randn() * 0.7));
      be = Array.from({ length: k }, () => 0);
      Wd = Array.from({ length: 2 }, () => Array.from({ length: k }, () => randn() * 0.7));
      bd = Array.from({ length: 2 }, () => 0);
      epoch = 0;
      lossHist.length = 0;
    }

    function encode(x, y) {
      const z = new Array(k);
      for (let i = 0; i < k; i++) z[i] = Math.tanh(We[i][0] * x + We[i][1] * y + be[i]);
      return z;
    }
    function decode(z) {
      const out = [0, 0];
      for (let j = 0; j < 2; j++) {
        let s = bd[j];
        for (let i = 0; i < k; i++) s += Wd[j][i] * z[i];
        out[j] = s;
      }
      return out;
    }
    function reconstruct(x, y) {
      return decode(encode(x, y));
    }

    function step(lr) {
      let loss = 0;
      // shuffle-lite: SGD in random order
      const idxs = raw.map((_, i) => i).sort(() => Math.random() - 0.5);
      for (const idx of idxs) {
        const p = raw[idx];
        // forward
        const z_pre = new Array(k), z_act = new Array(k);
        for (let i = 0; i < k; i++) {
          z_pre[i] = We[i][0] * p.x + We[i][1] * p.y + be[i];
          z_act[i] = Math.tanh(z_pre[i]);
        }
        const out = [0, 0];
        for (let j = 0; j < 2; j++) {
          let s = bd[j];
          for (let i = 0; i < k; i++) s += Wd[j][i] * z_act[i];
          out[j] = s;
        }
        const dx = out[0] - p.x, dy = out[1] - p.y;
        loss += dx * dx + dy * dy;
        // backward
        // dOut = 2*(out - target) but we roll the 2 into lr
        const dOut = [dx, dy];
        // Wd, bd grads
        const gWd = Array.from({ length: 2 }, () => new Array(k).fill(0));
        for (let j = 0; j < 2; j++) {
          bd[j] -= lr * dOut[j];
          for (let i = 0; i < k; i++) gWd[j][i] = dOut[j] * z_act[i];
        }
        // dz
        const dz = new Array(k).fill(0);
        for (let i = 0; i < k; i++) {
          for (let j = 0; j < 2; j++) dz[i] += Wd[j][i] * dOut[j];
          dz[i] *= (1 - z_act[i] * z_act[i]); // tanh derivative
        }
        // apply Wd updates
        for (let j = 0; j < 2; j++) for (let i = 0; i < k; i++) Wd[j][i] -= lr * gWd[j][i];
        // We, be grads
        for (let i = 0; i < k; i++) {
          be[i] -= lr * dz[i];
          We[i][0] -= lr * dz[i] * p.x;
          We[i][1] -= lr * dz[i] * p.y;
        }
      }
      return loss / raw.length;
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const pad = 24;
      const toX = x => pad + (x + 1) / 2 * (W - 2 * pad);
      const toY = y => H - pad - (y + 1) / 2 * (H - 2 * pad);
      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(W - pad, toY(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), H - pad); ctx.stroke();

      // draw reconstruction manifold: encode/decode a lattice
      ctx.strokeStyle = 'rgba(79,214,197,0.35)';
      ctx.lineWidth = 1.5;
      if (k === 1) {
        // Sample z from -1..1 and decode → curve
        ctx.beginPath();
        let started = false;
        for (let t = -1; t <= 1; t += 0.02) {
          const out = decode([t]);
          const px = toX(clamp(out[0], -1.05, 1.05)), py = toY(clamp(out[1], -1.05, 1.05));
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else {
        // k=2: sample grid
        for (let a = -1; a <= 1; a += 0.2) {
          ctx.beginPath();
          let started = false;
          for (let b = -1; b <= 1; b += 0.05) {
            const out = decode([a, b]);
            const px = toX(clamp(out[0], -1.05, 1.05)), py = toY(clamp(out[1], -1.05, 1.05));
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }

      // reconstruction lines: original → reconstructed
      for (const p of raw) {
        const out = reconstruct(p.x, p.y);
        ctx.strokeStyle = 'rgba(248,81,73,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toX(p.x), toY(p.y));
        ctx.lineTo(toX(out[0]), toY(out[1]));
        ctx.stroke();
      }
      // data points
      for (const p of raw) {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(88,166,255,0.9)';
        ctx.fill();
      }
      // Draw the loss chart
      const cctx = chart.ctx;
      cctx.clearRect(0, 0, chart.W, chart.H);
      if (lossHist.length > 1) {
        const mx = Math.max(...lossHist);
        const last = lossHist.slice(-200);
        cctx.strokeStyle = '#bc8cff';
        cctx.lineWidth = 2;
        cctx.beginPath();
        last.forEach((v, i) => {
          const px = 6 + i / (last.length - 1) * (chart.W - 12);
          const py = chart.H - 18 - (v / (mx || 1)) * (chart.H - 30);
          i === 0 ? cctx.moveTo(px, py) : cctx.lineTo(px, py);
        });
        cctx.stroke();
        cctx.fillStyle = '#8b96a8';
        cctx.font = '11px Consolas';
        cctx.fillText('loss', 4, 12);
      }

      stats.set('Bottleneck k', String(k));
      stats.set('Epoch', String(epoch));
      const last = lossHist[lossHist.length - 1];
      stats.set('Reconstruction MSE', last != null ? last.toFixed(4) : '—');
    }
    cv.onResize(draw);
    chart.onResize(draw);

    function trainLoop() {
      if (!training) return;
      for (let s = 0; s < 4; s++) {
        const loss = step(0.05);
        lossHist.push(loss);
        epoch++;
        if (lossHist.length > 500) lossHist.shift();
      }
      draw();
      if (epoch < 800) raf = requestAnimationFrame(trainLoop);
      else { training = false; trainBtn.textContent = '▶ Train'; }
    }
    onLeave(() => { training = false; cancelAnimationFrame(raf); });

    const kS = slider('Bottleneck size k', { min: 1, max: 2, step: 1, value: 1 }, v => {
      k = v; training = false; cancelAnimationFrame(raf); trainBtn.textContent = '▶ Train';
      initNet(); draw();
    });
    const trainBtn = button('▶ Train', () => {
      training = !training;
      trainBtn.textContent = training ? '⏸ Pause' : '▶ Train';
      if (training) trainLoop();
    });
    const resetBtn = button('↺ Reset weights', () => {
      training = false; cancelAnimationFrame(raf); trainBtn.textContent = '▶ Train';
      initNet(); draw();
    }, true);

    initNet();
    root.appendChild(demoPanel(
      'The autoencoder squeezes 2 numbers into 1',
      'Teal curve = every point the decoder can produce (k=1 → 1-D manifold). Red lines = reconstruction error per point.',
      cv.canvas,
      h('div', { class: 'controls' }, [kS.el, trainBtn, resetBtn]),
      legend([['#58a6ff', 'original data'], ['#4fd6c5', 'reconstructions can only lie here'], ['#f85149', 'reconstruction error']]),
      stats.el,
      h('div', { style: { marginTop: '14px' } }, [
        h('div', { class: 'demo-hint' }, 'Training loss:'),
        chart.canvas,
      ]),
    ));

    draw();

    root.appendChild(html(`
      <h3>What just happened</h3>
      <ul>
        <li>With <b>k=1</b>, the entire 2-D dataset must fit on <em>one squiggly line</em> (the "manifold" the decoder can produce). Training bends that line to match the data's curve as closely as it can. It's a nonlinear PCA.</li>
        <li>With <b>k=2</b>, the bottleneck is as wide as the input, and the autoencoder can copy perfectly — <em>which teaches it nothing useful</em>. The bottleneck is the point.</li>
      </ul>

      <h3>The autoencoder family</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🎭</div><h4>Denoising AE</h4><p>Train on <em>corrupted</em> inputs, target the clean original. Learns to remove noise — foundation of everything from image denoising to BERT-style masked language models.</p></div>
        <div class="card"><div class="card-icon">🎲</div><h4>Variational AE (VAE)</h4><p>Encoder outputs a <em>distribution</em> (mean + variance) instead of a point. You can now sample new z's and decode them into new data. First real generative deep model.</p></div>
        <div class="card"><div class="card-icon">🔒</div><h4>Sparse AE</h4><p>Penalize how many bottleneck neurons fire per input. Forces each neuron to specialize on distinct concepts — a mechanistic-interpretability workhorse.</p></div>
        <div class="card"><div class="card-icon">🧬</div><h4>Masked AE (MAE)</h4><p>Mask 75% of an image's patches, reconstruct the missing pieces. Modern self-supervised pretraining recipe for vision transformers.</p></div>
      </div>

      <h3>Where autoencoders quietly power things</h3>
      <ul>
        <li><strong>Anomaly detection:</strong> train on normal data; on new inputs, reconstruction error tells you if it's weird. Used for fraud, network intrusion, factory defects.</li>
        <li><strong>Recommender systems:</strong> collaborative filtering as an AE — reconstruct a user's full ratings from their sparse observed ones.</li>
        <li><strong>Feature learning:</strong> pretrained AE encoder as free features for downstream models when labels are scarce.</li>
        <li><strong>Stable Diffusion:</strong> its "VAE" compresses a 512×512 image into a 64×64 latent so the expensive diffusion process runs on tiny tensors. Speed = 100× via a bottleneck.</li>
      </ul>

      <div class="callout callout-info"><div class="callout-title">📌 Connecting the dots</div>
      An autoencoder ≈ nonlinear PCA (from the PCA lesson) trained by gradient descent (from the Gradient Descent lesson). Its bottleneck code is a learned <em>embedding</em> (from the Embeddings lesson). VAEs bridge it to <em>generative</em> models (next in Advanced). This is why the same handful of ideas keep resurfacing — deep learning is mostly recombination.</div>
    `));

    root.appendChild(html(`
      <details class="deep-dive">
        <summary>🔬 Deep Dive — Bottleneck Theory, VAEs, and Latent Spaces</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>A standard autoencoder minimizes reconstruction error over the training set:</p>
          <div class="formula">min<sub>θ,φ</sub> &nbsp; Σᵢ ‖xᵢ − D<sub>θ</sub>(E<sub>φ</sub>(xᵢ))‖²</div>
          <p>where E<sub>φ</sub> is the encoder and D<sub>θ</sub> is the decoder. When both are linear (no activations) and the loss is MSE, the optimal encoder/decoder recover exactly the top-k principal components — the autoencoder reduces to PCA. Nonlinear encoder/decoder functions can capture manifold structure that PCA misses entirely.</p>

          <h4>The Variational Autoencoder (VAE)</h4>
          <p>A VAE (Kingma & Welling, 2013) replaces the deterministic bottleneck z = E(x) with a probabilistic one. The encoder outputs a mean μ and variance σ² for each latent dimension, and z is <em>sampled</em> from N(μ, σ²). The loss has two terms:</p>
          <div class="formula">L<sub>VAE</sub> = ‖x − D(z)‖² + KL(q(z|x) ‖ p(z))</div>
          <p>The first term is reconstruction quality. The second term — <strong>KL divergence</strong> — measures how much the encoder's distribution q(z|x) differs from the prior p(z) = N(0, I). It acts as a regularizer, pushing the latent space toward a smooth, continuous Gaussian. This is what makes sampling possible: you can draw z ~ N(0, I) and decode it into a plausible new data point.</p>

          <h4>KL Divergence Explained</h4>
          <p>For Gaussians, the KL term has a closed form:</p>
          <div class="formula">KL(N(μ, σ²) ‖ N(0, 1)) = ½ Σⱼ (μⱼ² + σⱼ² − ln(σⱼ²) − 1)</div>
          <p>This penalizes the encoder for making μ far from 0 (spreading clusters apart) or making σ far from 1 (collapsing uncertainty). The tension between reconstruction (be precise) and KL (be standard Gaussian) creates a smooth, interpolable latent space — the key property that separates VAEs from regular autoencoders.</p>

          <h4>Intuition</h4>
          <p>Think of the encoder as a librarian who must file every book onto a single shelf (the bottleneck). With a regular autoencoder, the librarian can use any filing system — including arbitrary, discontinuous codes. With a VAE, the librarian is told: "your filing positions must form a smooth bell curve, and nearby positions should have similar books." This constraint means you can point to any position on the shelf and get a sensible book — even positions between existing books. That's why VAEs can generate new data by sampling.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "A wider bottleneck always gives better reconstruction."</div>
          <p><strong>✅ Reality:</strong> When the bottleneck is as wide as the input, the autoencoder can learn the identity function — perfect reconstruction but zero useful learning. The bottleneck must be <em>narrower</em> than the intrinsic dimensionality of the data to force meaningful compression. Over-complete autoencoders (wider than input) can still learn useful features if paired with sparsity penalties or denoising objectives, but the capacity constraint must come from somewhere.</p>

          <div class="misconception"><strong>❌ Misconception:</strong> "VAEs generate blurry images because the model is bad."</div>
          <p><strong>✅ Reality:</strong> VAE blurriness comes from the MSE reconstruction loss, which averages over uncertainty and produces the mean of all plausible outputs. This is a <em>loss function</em> problem, not an architecture problem. Using perceptual losses, adversarial losses (VAE-GAN hybrids), or operating in a learned latent space (as Stable Diffusion does — its "VAE" produces crisp images because the diffusion model handles the stochastic generation) eliminates the blur.</p>

          <h4>Historical Context</h4>
          <p>Autoencoders date back to Rumelhart, Hinton & Williams (1986), where they were used to discover compact representations. Sparse autoencoders (Olshausen & Field, 1996) learned visual features resembling those in the brain's visual cortex. The VAE was introduced simultaneously by Kingma & Welling (2013) and Rezende, Mohamed & Wierstra (2014). Denoising autoencoders (Vincent et al., 2008) became the basis for masked language modeling in BERT. Modern applications include Stable Diffusion's latent-space compression (Rombach et al., 2022) and mechanistic interpretability via sparse autoencoders (Bricken et al., 2023) used to understand what individual neurons in large language models represent.</p>
        </div>
      </details>
    `));
  },
};
