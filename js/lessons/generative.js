// Lesson: Generative AI — autoencoder latent space, GAN duel, diffusion denoising
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, randn, rand, makeScale, drawGrid, drawPoint, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'generative',
  emoji: '🎨',
  title: 'Generative AI: AE → GAN → Diffusion',
  level: 'Expert',
  blurb: 'Models that create: compress into latent space, duel a forger against a detective, and un-noise a picture.',

  render(root) {
    root.appendChild(html(`
      <p>Everything so far <em>discriminates</em>: given input, predict a label or number. <strong>Generative models</strong> flip the goal — learn the data's underlying distribution well enough to <strong>create new samples from it</strong>. Faces that don't exist, images from text, this decade's biggest AI story. Three landmark ideas, in order:</p>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Learn the distribution:</strong> A generative model studies training data (images, text, audio) and learns the probability distribution P(data) — what "typical" data looks like.</li>
          <li><strong>Map to a latent space:</strong> The model compresses complex data into a compact code (latent vector z). Similar data points map to nearby codes, creating a smooth, navigable landscape.</li>
          <li><strong>Sample from the latent space:</strong> To generate new data, sample a random point z from the latent space and run it through the decoder/generator.</li>
          <li><strong>Decode to data space:</strong> The decoder transforms the compact code back into full data — an image, a sound, a sentence — creating something that looks like it could have been in the training set, but wasn't.</li>
          <li><strong>Condition on prompts (optional):</strong> Modern models accept extra inputs (text prompts, class labels) that steer generation toward specific outputs — "a cat wearing a hat."</li>
        </ol>
      </div>
    `));

    // ================= Demo 1: Autoencoder latent space =================
    root.appendChild(html(`
      <h3>1 · Autoencoders: the latent space</h3>
      <p>An autoencoder is an hourglass network: an <strong>encoder</strong> squeezes the input into a tiny <em>latent code</em>, a <strong>decoder</strong> reconstructs the input from it. Forcing data through the bottleneck makes the network discover the data's true low-dimensional structure.</p>
      <div class="formula">x → encoder → z (tiny!) → decoder → x̂ &nbsp;&nbsp;&nbsp; trained to make x̂ ≈ x</div>
      <p>Below, 2-D data points all lie near a curved 1-D manifold. The learned latent space is just <strong>one number z</strong> — the position along the curve. <strong>Drag the z slider</strong> and watch the decoder generate points; every z decodes to a plausible sample. That's the generative magic: <em>walk the latent space, generate data.</em></p>
    `));

    seed(91);
    const curve = t => ({ // 1-D manifold embedded in 2-D
      x: Math.sin(t * Math.PI * 1.4) * 0.75,
      y: Math.cos(t * Math.PI * 0.9) * 0.6 + t * 0.25 - 0.12,
    });
    const dataPts = Array.from({ length: 80 }, () => {
      const t = rand() * 2 - 1;
      const p = curve(t);
      return { x: clamp(p.x + randn() * 0.045, -1, 1), y: clamp(p.y + randn() * 0.045, -1, 1), t };
    });

    const cv1 = makeCanvas(380);
    const scale1 = makeScale(cv1);
    let zVal = 0;
    let interpAnim = null;

    function draw1() {
      const { ctx } = cv1;
      ctx.clearRect(0, 0, cv1.W, cv1.H);
      drawGrid(cv1, scale1);
      // manifold curve (what the decoder learned)
      ctx.strokeStyle = 'rgba(188,140,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = -1; t <= 1; t += 0.02) {
        const p = curve(t);
        t <= -1 + 1e-9 ? ctx.moveTo(scale1.toX(p.x), scale1.toY(p.y)) : ctx.lineTo(scale1.toX(p.x), scale1.toY(p.y));
      }
      ctx.stroke();
      for (const p of dataPts) drawPoint(ctx, scale1.toX(p.x), scale1.toY(p.y), 'rgba(88,166,255,0.75)', 3.5);
      // decoded point at current z
      const d = curve(zVal);
      ctx.beginPath();
      ctx.arc(scale1.toX(d.x), scale1.toY(d.y), 11, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e3b341';
      ctx.lineWidth = 3;
      ctx.stroke();
      drawPoint(ctx, scale1.toX(d.x), scale1.toY(d.y), '#e3b341', 6);
      ctx.fillStyle = '#e3b341';
      ctx.font = 'bold 12px Consolas';
      ctx.fillText(`decode(z=${zVal.toFixed(2)})`, scale1.toX(d.x) + 14, scale1.toY(d.y) - 10);
    }
    cv1.onResize(draw1);

    const zS = slider('latent z', { min: -1, max: 1, step: 0.01, value: 0, fmt: v => v.toFixed(2) }, v => { zVal = v; draw1(); });
    const walkBtn = button('▶ Walk the latent space', () => {
      cancelAnimationFrame(interpAnim);
      let t0 = null;
      (function anim(ts) {
        if (t0 === null) t0 = ts;
        const el = (ts - t0) / 4000;
        if (el >= 1) { zS.set(1); zVal = 1; draw1(); return; }
        zVal = -1 + el * 2;
        zS.set(zVal);
        draw1();
        interpAnim = requestAnimationFrame(anim);
      })(performance.now());
    });
    onLeave(() => cancelAnimationFrame(interpAnim));

    root.appendChild(demoPanel(
      'Latent-space walk',
      'Blue = training data (2-D). Purple curve = the 1-D manifold the autoencoder discovered. Yellow = the decoder\'s output for your chosen z.',
      cv1.canvas,
      h('div', { class: 'controls' }, [zS.el, walkBtn]),
      legend([['#58a6ff', 'real data'], ['#bc8cff', 'learned manifold'], ['#e3b341', 'generated sample']]),
    ));

    root.appendChild(html(`
      <p>With faces instead of dots, z might have 512 dimensions — and directions in that space mean things: one axis adds a smile, another rotates the head. <strong>VAEs</strong> (variational autoencoders) additionally force the latent space to be smooth and gap-free, so <em>every</em> z decodes to something sensible.</p>
    `));

    // ================= Demo 2: GAN duel =================
    root.appendChild(html(`
      <h3>2 · GANs: the forger and the detective</h3>
      <p>A <strong>Generative Adversarial Network</strong> (2014) is a two-player game: a <strong>Generator</strong> (forger) turns random noise into fake samples; a <strong>Discriminator</strong> (detective) tries to tell fake from real. They train against each other — the forger improves until the detective is reduced to coin-flipping.</p>
      <p>Watch the duel on a 1-D dataset: the generator's fake distribution (pink) learns to match the real one (blue). The detective's confidence curve (yellow) flattens to 50% as the fakes become perfect. <em>(Illustrative simulation of a typical training run.)</em></p>
    `));

    const cv2 = makeCanvas(320);
    let ganT = 0; // 0..1 training progress
    let ganRunning = false, ganRaf = null;
    const ganStats = statRow(['Training progress', 'Detective accuracy']);

    // real: mixture of two gaussians; fake starts as wide flat-ish gaussian, morphs to real
    const gauss = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
    const realPdf = x => 0.55 * gauss(x, -0.35, 0.13) + 0.45 * gauss(x, 0.45, 0.16);
    function fakePdf(x, t) {
      // interpolate: broad blob → the real mixture (with a wobble so it looks like training)
      const wob = Math.sin(t * 19) * 0.06 * (1 - t);
      const start = gauss(x, 0.1 + wob, 0.55);
      return (1 - t) * start + t * realPdf(x - wob * 0.4);
    }

    function draw2() {
      const { ctx, W, H } = cv2;
      ctx.clearRect(0, 0, W, H);
      const pad = 36;
      const toX = x => pad + (x + 1) / 2 * (W - 2 * pad);
      const toY = (v, vmax) => H - 40 - v / vmax * (H - 90);
      const vmax = 2.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.moveTo(pad, H - 40); ctx.lineTo(W - pad, H - 40); ctx.stroke();

      // real distribution (filled)
      ctx.fillStyle = 'rgba(88,166,255,0.25)';
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(-1), toY(0, vmax));
      for (let x = -1; x <= 1; x += 0.01) ctx.lineTo(toX(x), toY(realPdf(x), vmax));
      ctx.lineTo(toX(1), toY(0, vmax));
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // fake distribution
      ctx.strokeStyle = '#ff7b9c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = -1; x <= 1; x += 0.01) {
        const px = toX(x), py = toY(fakePdf(x, ganT), vmax);
        x <= -1 + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // discriminator: P(real | x) ∝ real/(real+fake), drawn on secondary scale
      ctx.strokeStyle = '#e3b341';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let x = -1; x <= 1; x += 0.01) {
        const r = realPdf(x), f = fakePdf(x, ganT);
        const p = r / (r + f + 1e-9);
        const py = H - 40 - p * (H - 90);
        const px = toX(x);
        x <= -1 + 1e-9 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('sample value x →', W / 2 - 40, H - 12);

      // detective accuracy: integral-ish of |p - 0.5|
      let acc = 0, n = 0;
      for (let x = -1; x <= 1; x += 0.02) {
        const r = realPdf(x), f = fakePdf(x, ganT);
        acc += Math.abs(r / (r + f + 1e-9) - 0.5) * (r + f);
        n += (r + f);
      }
      ganStats.set('Training progress', (ganT * 100).toFixed(0) + '%');
      ganStats.set('Detective accuracy', (50 + acc / n * 100).toFixed(1) + '%');
    }
    cv2.onResize(draw2);

    function ganLoop() {
      if (!ganRunning) return;
      ganT = Math.min(1, ganT + 0.004);
      draw2();
      if (ganT < 1) ganRaf = requestAnimationFrame(ganLoop);
      else { ganRunning = false; ganBtn.textContent = '▶ Train the GAN'; }
    }
    const ganBtn = button('▶ Train the GAN', () => {
      ganRunning = !ganRunning;
      ganBtn.textContent = ganRunning ? '⏸ Pause' : '▶ Train the GAN';
      if (ganRunning) { if (ganT >= 1) ganT = 0; ganLoop(); }
    });
    const ganReset = button('↺ Reset', () => { ganRunning = false; ganBtn.textContent = '▶ Train the GAN'; cancelAnimationFrame(ganRaf); ganT = 0; draw2(); }, true);
    onLeave(() => { ganRunning = false; cancelAnimationFrame(ganRaf); });

    root.appendChild(demoPanel(
      'Forger vs detective',
      'Blue = real data distribution. Pink = generator\'s fakes. Dashed yellow = detective\'s "probability it\'s real" (1.0 top, 0 bottom) — watch it collapse to the 0.5 line.',
      cv2.canvas,
      h('div', { class: 'controls' }, [ganBtn, ganReset]),
      ganStats.el,
    ));

    // ================= Demo 3: Diffusion =================
    root.appendChild(html(`
      <h3>3 · Diffusion: creation by un-noising</h3>
      <p>GANs are powerful but unstable to train (the two players can spiral). <strong>Diffusion models</strong> — the engine of Stable Diffusion, DALL·E and Midjourney — use a calmer idea:</p>
      <ol>
        <li><strong>Forward process (fixed):</strong> gradually add noise to real data over many steps until it's pure static.</li>
        <li><strong>Reverse process (learned):</strong> train a network to undo one small step of noising. To generate: start from pure noise and apply the denoiser again and again — structure condenses out of static.</li>
      </ol>
      <p>Drag the timestep slider or press play in either direction. The "image" here is a 2-D point cloud shaped like a star:</p>
    `));

    seed(101);
    // star-shaped point cloud
    const starPts = [];
    for (let i = 0; i < 240; i++) {
      const a = rand() * Math.PI * 2;
      const spikes = 5;
      const rr = 0.35 + 0.38 * Math.pow(Math.abs(Math.cos(a * spikes / 2)), 3.0);
      const r = rr * (0.75 + rand() * 0.3);
      starPts.push({ x0: Math.cos(a) * r, y0: Math.sin(a) * r, nx: randn() * 0.75, ny: randn() * 0.75 });
    }

    const cv3 = makeCanvas(380);
    const scale3 = makeScale(cv3);
    let tStep = 0; // 0 = clean, 1 = pure noise
    let diffRaf = null, diffDir = 0;
    const diffStats = statRow(['Timestep', 'Signal remaining']);

    function draw3() {
      const { ctx } = cv3;
      ctx.clearRect(0, 0, cv3.W, cv3.H);
      drawGrid(cv3, scale3);
      // cosine-ish schedule
      const alpha = Math.cos(tStep * Math.PI / 2); // signal coefficient
      const sigma = Math.sin(tStep * Math.PI / 2);
      for (const p of starPts) {
        const x = clamp(p.x0 * alpha + p.nx * sigma, -1, 1);
        const y = clamp(p.y0 * alpha + p.ny * sigma, -1, 1);
        const t = tStep;
        const r = Math.round(88 + t * 100), g = Math.round(166 - t * 60), b = Math.round(255 - t * 90);
        drawPoint(ctx, scale3.toX(x), scale3.toY(y), `rgb(${r},${g},${b})`, 3.5);
      }
      diffStats.set('Timestep', 't = ' + (tStep * 1000).toFixed(0) + ' / 1000');
      diffStats.set('Signal remaining', (Math.cos(tStep * Math.PI / 2) * 100).toFixed(0) + '%');
    }
    cv3.onResize(draw3);

    const tS = slider('noise timestep t', { min: 0, max: 1, step: 0.005, value: 0, fmt: v => (v * 1000).toFixed(0) }, v => { tStep = v; diffDir = 0; draw3(); });
    function diffAnim() {
      if (diffDir === 0) return;
      tStep = clamp(tStep + diffDir * 0.006, 0, 1);
      tS.set(tStep);
      draw3();
      if ((diffDir > 0 && tStep < 1) || (diffDir < 0 && tStep > 0)) diffRaf = requestAnimationFrame(diffAnim);
      else diffDir = 0;
    }
    const fwdBtn = button('▶ Add noise (forward)', () => { cancelAnimationFrame(diffRaf); diffDir = 1; diffAnim(); });
    const revBtn = button('◀ Denoise (generate!)', () => { cancelAnimationFrame(diffRaf); diffDir = -1; diffAnim(); });
    onLeave(() => { diffDir = 0; cancelAnimationFrame(diffRaf); });

    root.appendChild(demoPanel(
      'The diffusion process',
      'Forward: the star dissolves into static. Reverse: press denoise from t=1000 and watch structure crystallize out of pure noise — that reverse direction is what the model learns.',
      cv3.canvas,
      h('div', { class: 'controls' }, [tS.el, fwdBtn, revBtn]),
      diffStats.el,
    ));

    root.appendChild(html(`
      <h3>The three ideas, side by side</h3>
      <table class="info-table">
        <tr><th></th><th>Autoencoder / VAE</th><th>GAN</th><th>Diffusion</th></tr>
        <tr><td><b>Core trick</b></td><td>Bottleneck compression</td><td>Adversarial game</td><td>Learn to reverse noising</td></tr>
        <tr><td><b>Training</b></td><td>Stable, easy</td><td>Notoriously unstable</td><td>Stable (it's just regression on noise!)</td></tr>
        <tr><td><b>Generation speed</b></td><td>1 pass (fast)</td><td>1 pass (fast)</td><td>Many denoising steps (slower)</td></tr>
        <tr><td><b>Famous for</b></td><td>Compression, anomaly detection, latents for other models</td><td>Deepfakes, StyleGAN faces</td><td>Stable Diffusion, DALL·E, Midjourney, Sora</td></tr>
      </table>
      <div class="callout callout-info"><div class="callout-title">📌 How text-to-image actually works</div>
      Stable Diffusion combines all three lessons on this page: a <strong>VAE</strong> compresses images into a latent space; <strong>diffusion</strong> runs in that latent space (cheaper than pixel space); and a <strong>text encoder</strong> (a transformer!) steers each denoising step toward your prompt via cross-attention. Modern AI systems are compositions of these building blocks.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — the math of generation</summary>
        <div class="deep-dive-body">
          <h4>GAN Objective — The Minimax Game</h4>
          <p>The GAN training objective is a two-player game:</p>
          <div class="formula">min_G max_D &nbsp; E[log D(x)] + E[log(1 − D(G(z)))]</div>
          <p>The discriminator D maximizes its ability to distinguish real from fake. The generator G minimizes the discriminator's success. At the Nash equilibrium, D(x) = 0.5 everywhere — the fakes are indistinguishable from real data.</p>

          <h4>VAE — The ELBO</h4>
          <p>Variational Autoencoders maximize the Evidence Lower BOund:</p>
          <div class="formula">ELBO = E_q[log p(x|z)] − KL(q(z|x) || p(z))</div>
          <p>The first term is reconstruction quality (make the output look like the input). The second term forces the encoder's distribution q(z|x) to stay close to a simple prior p(z) (usually a standard Gaussian). This KL penalty is what makes the latent space smooth and interpolable — without it, the space has gaps where the decoder produces garbage.</p>

          <h4>Mode Collapse</h4>
          <p>GANs' biggest failure mode: the generator discovers one realistic output that fools the discriminator and keeps producing only that. The training oscillates — G finds an exploit, D adapts, G finds another. Tricks to mitigate it include minibatch discrimination, spectral normalization, and Wasserstein loss (WGAN).</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Generative models memorize and copy training images."</div>
          <p><strong>✅ Reality:</strong> The model learns statistical patterns, not individual images. A diffusion model trained on millions of faces learns "face-ness" — the spatial structure of eyes, noses, skin textures — and recombines these patterns into novel faces. Exact memorization does happen occasionally (especially with duplicated training data), which is an active research concern.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Diffusion models replaced GANs because GANs produce worse quality."</div>
          <p><strong>✅ Reality:</strong> GANs can produce stunning quality (StyleGAN faces are sharp). Diffusion won because it's <em>easier to train</em> (no adversarial instability), offers better <em>mode coverage</em> (generates more diverse outputs), and scales predictably. The trade-off is speed — GANs generate in one pass, diffusion needs many denoising steps.</p>

          <h4>Historical Context</h4>
          <p>Autoencoders date to Rumelhart et al. (1986). VAEs were introduced by Kingma and Welling (2013). GANs were proposed by Ian Goodfellow in 2014 (the idea came to him at a bar). Diffusion models have roots in non-equilibrium thermodynamics (Sohl-Dickstein et al., 2015), but became practical with DDPM (Ho, Jain, Abbeel, 2020). Latent diffusion (Rombach et al., 2022) enabled Stable Diffusion, which democratized image generation.</p>
        </div>
      </details>
    `));
  },
};
