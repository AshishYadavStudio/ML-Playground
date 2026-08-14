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
  },
};
