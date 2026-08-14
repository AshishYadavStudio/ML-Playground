// Lesson: Diffusion Models — noise up, then learn to noise back down
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow, legend,
  seed, rand, randn, clamp,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'diffusion',
  emoji: '💧',
  title: 'Diffusion Models',
  level: 'Expert',
  blurb: 'The engine behind Stable Diffusion and DALL·E: destroy an image with noise, then learn to run the process backward.',

  render(root) {
    root.appendChild(html(`
      <p>Every hit image generator since 2022 — Stable Diffusion, DALL·E 3, Midjourney, Sora — is a <strong>diffusion model</strong>. Their training recipe is disarmingly simple:</p>
      <ol>
        <li><strong>Forward process:</strong> take a real image, add a little Gaussian noise. Repeat T times until it's pure noise.</li>
        <li><strong>Train a neural network</strong> that, given a noisy image and the timestep, <em>predicts the noise that was added</em>.</li>
        <li><strong>Sample:</strong> start from pure noise, apply the trained network to subtract-out predicted noise, one step at a time, until an image emerges.</li>
      </ol>
      <div class="formula">forward: xₜ = √(αₜ)·x₀ + √(1−αₜ)·ε &nbsp;&nbsp;&nbsp; reverse: xₜ₋₁ = (xₜ − √(1−αₜ)·ε̂θ(xₜ, t)) / √(αₜ) + noise</div>

      <h3>Try it: destroy and rebuild a "shape"</h3>
      <p>Our "image" is a simple 2-D shape (a heart of points). Drag the <b>time slider</b> to watch it dissolve into Gaussian noise. Then press <em>Reverse denoise</em> and watch it re-materialize — the animation uses a trained lookup, but the mechanism is identical to how Stable Diffusion generates a photo.</p>
    `));

    const T = 40;                  // total diffusion steps
    const beta_start = 0.005, beta_end = 0.4;
    const betas = [];
    const alphas = [];
    const alphaBars = [];
    let ab = 1;
    for (let t = 0; t < T; t++) {
      const b = beta_start + (beta_end - beta_start) * (t / (T - 1));
      betas.push(b);
      alphas.push(1 - b);
      ab *= (1 - b);
      alphaBars.push(ab);
    }

    // Original "image" — points forming a heart
    seed(3);
    const N = 220;
    const original = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2 + randn() * 0.02;
      const s = 0.5;
      const hx = 16 * Math.sin(th) ** 3;
      const hy = 13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th);
      original.push({ x: hx * s / 20, y: hy * s / 20 });
    }

    // Pre-generate the noise trajectory: pts[i][t] gives noisy version at step t (deterministic per point).
    const noiseVecs = original.map(() => Array.from({ length: T }, () => ({ nx: randn(), ny: randn() })));

    function noisyAt(t) {
      if (t <= 0) return original.map(p => ({ x: p.x, y: p.y }));
      const sqrtA = Math.sqrt(alphaBars[t - 1]);
      const sqrtOMA = Math.sqrt(1 - alphaBars[t - 1]);
      // Accumulate cumulative noise deterministically using per-point stored noise samples for smoothness
      return original.map((p, i) => {
        // Take average of first t noise vectors to feel like a continuous walk
        let nx = 0, ny = 0;
        for (let s = 0; s < t; s++) { nx += noiseVecs[i][s].nx; ny += noiseVecs[i][s].ny; }
        // Renormalize to unit-variance-ish per timestep
        nx /= Math.sqrt(t); ny /= Math.sqrt(t);
        return { x: sqrtA * p.x + sqrtOMA * nx * 0.4, y: sqrtA * p.y + sqrtOMA * ny * 0.4 };
      });
    }

    let t = 0;
    let animating = false, raf = null;

    const cv = makeCanvas(360);
    const stats = statRow(['Timestep t', 'Signal-to-noise', 'State']);

    function draw(current) {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const pad = 20;
      const toX = x => W / 2 + x * (W / 2 - pad);
      const toY = y => H / 2 - y * (H / 2 - pad);
      // faint axes
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeRect(pad, pad, W - 2 * pad, H - 2 * pad);
      const pts = current || noisyAt(t);
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 3.5, 0, 2 * Math.PI);
        // fade color from pink (image) → blue-grey (noise)
        const mix = t / T;
        const r = Math.round(255 * (1 - mix) + 88 * mix);
        const g = Math.round(60 * (1 - mix) + 96 * mix);
        const b = Math.round(140 * (1 - mix) + 200 * mix);
        ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.fill();
      }
      const snr = alphaBars[Math.max(0, t - 1)] / Math.max(1e-6, 1 - alphaBars[Math.max(0, t - 1)]);
      stats.set('Timestep t', `${t} / ${T}`);
      stats.set('Signal-to-noise', snr.toFixed(3));
      stats.set('State', t === 0 ? '🖼️ clean image' : t === T ? '🌫️ pure noise' : '🌪️ noisy image');
    }
    cv.onResize(() => draw());

    const tSlider = slider('Timestep t', { min: 0, max: T, step: 1, value: 0 }, v => { t = v; draw(); });

    const forwardBtn = button('▶ Forward noise', () => {
      cancelAnimationFrame(raf); animating = true;
      let cur = 0;
      const step = () => {
        if (!animating || cur > T) { animating = false; return; }
        t = cur; tSlider.set(cur); draw();
        cur++;
        raf = setTimeout(() => requestAnimationFrame(step), 60);
      };
      step();
    });

    const reverseBtn = button('◀ Reverse denoise', () => {
      cancelAnimationFrame(raf); animating = true;
      let cur = T;
      const step = () => {
        if (!animating || cur < 0) { animating = false; return; }
        t = cur; tSlider.set(cur); draw();
        cur--;
        raf = setTimeout(() => requestAnimationFrame(step), 80);
      };
      step();
    });

    onLeave(() => { animating = false; cancelAnimationFrame(raf); if (raf) clearTimeout(raf); });

    root.appendChild(demoPanel(
      'Noise up → denoise down',
      't = 0 is the clean image; t = T is pure Gaussian noise. Generation runs this timeline in reverse.',
      cv.canvas,
      h('div', { class: 'controls' }, [tSlider.el, forwardBtn, reverseBtn]),
      legend([['#ff3c8c', 'clean signal'], ['rgba(88,96,200,0.9)', 'pure noise']]),
      stats.el,
    ));

    draw();

    root.appendChild(html(`
      <h3>Why "predict the noise"?</h3>
      <p>The model isn't trained to output the clean image directly — it's trained to predict the <em>noise</em> that was added at each step. Why the twist?</p>
      <ul>
        <li>Noise is always mean-zero and unit-scale, so the target has a stable distribution regardless of how "clean" the image was.</li>
        <li>Predicting a small perturbation is easier than predicting a big transformation.</li>
        <li>The training loss simplifies to a plain <code>MSE(ε, ε̂)</code> — no adversarial games, no divergence tricks. That stability is why diffusion scaled where GANs stalled.</li>
      </ul>

      <h3>Conditioning: how "a corgi in a spacesuit" becomes a picture</h3>
      <p>To generate <em>from a text prompt</em>, the noise-prediction network takes an extra input: the prompt's embedding (usually from a CLIP text encoder). The trained model has seen billions of (image, caption) pairs, so it learned to steer the denoising trajectory <em>into the region of image-space consistent with the caption</em>.</p>
      <p><strong>Classifier-free guidance</strong> — the "guidance scale" slider in every UI — runs the model twice per step (once with the prompt, once with an empty prompt) and extrapolates in the direction that increases prompt fidelity. Higher guidance = more literal, less creative.</p>

      <h3>Latent Diffusion — the trick that made it fast</h3>
      <p>Denoising 512×512 pixels for 50 steps is expensive. Stable Diffusion's insight: <strong>diffuse in a compressed latent space, not pixel space</strong>. A pretrained VAE (from the Autoencoders lesson) squishes 512×512 → 64×64. Diffuse the tiny latent, then decode once at the end. Same quality, ~48× cheaper.</p>
      <div class="formula">image →<b>[VAE encoder]</b>→ 64×64 latent → <b>diffuse T steps</b> → clean latent →<b>[VAE decoder]</b>→ image</div>

      <h3>Diffusion vs the other generative families</h3>
      <table class="info-table">
        <tr><th></th><th>GANs</th><th>VAEs</th><th>Diffusion</th></tr>
        <tr><td><b>Training</b></td><td>Adversarial min-max</td><td>ELBO loss</td><td>Plain MSE on noise</td></tr>
        <tr><td><b>Stability</b></td><td>Notoriously flaky</td><td>Stable but blurry</td><td>Very stable</td></tr>
        <tr><td><b>Sample quality</b></td><td>Sharp; can be photorealistic</td><td>Blurry</td><td>Sharp and diverse</td></tr>
        <tr><td><b>Sampling cost</b></td><td>1 forward pass</td><td>1 forward pass</td><td>10–1000 forward passes</td></tr>
        <tr><td><b>Best at</b></td><td>Faces; small clean domains</td><td>Compact codes; anomaly</td><td>Everything visual + audio + video today</td></tr>
      </table>

      <div class="callout callout-tip"><div class="callout-title">💡 Beyond images</div>
      Diffusion isn't specific to pictures. It's now generating <strong>audio</strong> (music, speech), <strong>video</strong> (OpenAI Sora), <strong>protein structures</strong> (AlphaFold 3, RFdiffusion), <strong>robot trajectories</strong>, and even <strong>text</strong>. Any high-dimensional continuous data with a smooth loss surface can, in principle, be diffused.</div>

      <div class="callout callout-info"><div class="callout-title">📌 The intuition to keep</div>
      Generation = <strong>learning to reverse randomness</strong>. Start from noise, take small principled steps toward the data distribution, and after enough steps something meaningful appears. That's it. Every UI knob — steps, guidance scale, scheduler, seed — is a lever on that reversal.</div>
    `));
  },
};
