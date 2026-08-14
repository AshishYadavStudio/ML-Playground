// Lesson: Fine-tuning & LoRA — teach a giant model new tricks without retraining it
import {
  h, html, makeCanvas, demoPanel, slider, selectBox, statRow, legend,
} from '../utils.js';

export default {
  id: 'fine-tuning',
  emoji: '🎯',
  title: 'Fine-Tuning & LoRA',
  level: 'Expert',
  blurb: 'Teach a 70B-parameter model a new skill by training 0.1% of it. The rise of LoRA and QLoRA.',

  render(root) {
    root.appendChild(html(`
      <p>You have a 7B-parameter open-source language model. You want it to write in your company's tone, or answer questions about your internal wiki, or speak medical Spanish. Training a new 7B model from scratch would cost millions and take weeks — but you don't have to. You just need to <strong>fine-tune</strong> — adjust the already-trained model slightly using your data.</p>

      <h3>Three levels of adaptation</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">⚡</div><h4>Prompt engineering</h4><p>Zero training. Just structure the prompt cleverly (system message, examples, chain-of-thought). Costs nothing to try.</p></div>
        <div class="card"><div class="card-icon">🎯</div><h4>Fine-tuning</h4><p>Actually update weights on your data. Model permanently internalizes the new pattern. More expensive, more powerful.</p></div>
        <div class="card"><div class="card-icon">📚</div><h4>RAG</h4><p>Don't retrain — retrieve relevant facts at query time and paste them into the prompt. See the RAG lesson. Great for fresh, changing knowledge.</p></div>
      </div>
      <p>These aren't rivals — real systems stack them. This lesson zooms in on fine-tuning: full vs LoRA vs QLoRA.</p>

      <h3>Full fine-tuning vs LoRA — a parameter cost comparison</h3>
      <p>Below is a real 7B-parameter transformer's cost breakdown. Pick a fine-tuning strategy and a LoRA rank, and see how many parameters you actually train and how much GPU memory it takes.</p>
    `));

    const BASE_PARAMS = 7e9;          // 7B model
    const HIDDEN = 4096;              // hidden size
    const LAYERS = 32;
    const ATTN_MATS_PER_LAYER = 4;    // Q, K, V, O
    const FFN_MATS_PER_LAYER = 3;     // gate, up, down (SwiGLU)

    let mode = 'lora';
    let rank = 8;
    const cv = makeCanvas(220);
    const stats = statRow(['Trainable params', 'Fraction of base', 'Fine-tune VRAM (est)', 'Full precision base']);

    function loraParams() {
      const perMat = 2 * rank * HIDDEN; // A: rank × in, B: out × rank
      const mats = LAYERS * ATTN_MATS_PER_LAYER; // usually only attention matrices in vanilla LoRA
      return perMat * mats;
    }

    function computeCosts() {
      let trainable, baseBytes, gradBytes, optBytes, actBytes;
      if (mode === 'full') {
        trainable = BASE_PARAMS;
        baseBytes = BASE_PARAMS * 2;      // bf16 weights: 2 B / param
        gradBytes = BASE_PARAMS * 2;
        optBytes = BASE_PARAMS * 8;       // Adam m + v in fp32
        actBytes = 25e9;                  // rough activations
      } else if (mode === 'lora') {
        trainable = loraParams();
        baseBytes = BASE_PARAMS * 2;
        gradBytes = trainable * 2;
        optBytes = trainable * 8;
        actBytes = 8e9;
      } else { // qlora
        trainable = loraParams();
        baseBytes = BASE_PARAMS * 0.5;    // 4-bit quantized: 0.5 B / param
        gradBytes = trainable * 2;
        optBytes = trainable * 8;
        actBytes = 6e9;
      }
      const totalBytes = baseBytes + gradBytes + optBytes + actBytes;
      return { trainable, baseBytes, gradBytes, optBytes, actBytes, totalBytes };
    }

    function fmt(bytes) {
      if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
      return (bytes / 1e6).toFixed(0) + ' MB';
    }
    function fmtP(n) {
      if (n > 1e9) return (n / 1e9).toFixed(2) + 'B';
      if (n > 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n > 1e3) return (n / 1e3).toFixed(0) + 'K';
      return n.toString();
    }

    function draw() {
      const c = computeCosts();
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const pad = 60;
      const barY = H / 2 - 30;
      const barH = 42;
      const totalW = W - pad - 20;

      // Layout: single stacked bar
      const bytes = [
        { label: 'base weights', v: c.baseBytes, color: '#58a6ff' },
        { label: 'gradients', v: c.gradBytes, color: '#f0883e' },
        { label: 'optimizer', v: c.optBytes, color: '#bc8cff' },
        { label: 'activations', v: c.actBytes, color: '#3fb950' },
      ];
      let cursor = pad;
      bytes.forEach(b => {
        const w = (b.v / c.totalBytes) * totalW;
        ctx.fillStyle = b.color;
        ctx.fillRect(cursor, barY, w, barH);
        cursor += w;
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(pad, barY, totalW, barH);

      ctx.fillStyle = '#c3cde0';
      ctx.font = 'bold 12px Segoe UI';
      ctx.fillText('GPU memory during training', pad, barY - 12);
      ctx.font = 'bold 13px Consolas';
      ctx.fillText(fmt(c.totalBytes), pad + totalW - 60, barY - 12);

      // legend
      let ly = barY + barH + 26;
      let lx = pad;
      bytes.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(lx, ly - 8, 12, 12);
        ctx.fillStyle = '#c3cde0';
        ctx.font = '11px Segoe UI';
        ctx.fillText(`${b.label}: ${fmt(b.v)}`, lx + 16, ly + 2);
        lx += 150;
        if (lx > W - 130) { lx = pad; ly += 18; }
      });

      stats.set('Trainable params', fmtP(c.trainable));
      stats.set('Fraction of base', ((c.trainable / BASE_PARAMS) * 100).toFixed(2) + '%');
      stats.set('Fine-tune VRAM (est)', fmt(c.totalBytes));
      stats.set('Full precision base', fmtP(BASE_PARAMS) + ' (frozen)');
    }
    cv.onResize(draw);

    const modeSel = selectBox('Fine-tune strategy', [
      { value: 'full', label: 'Full fine-tune (train everything)' },
      { value: 'lora', label: 'LoRA (rank-r adapters, bf16 base)' },
      { value: 'qlora', label: 'QLoRA (rank-r adapters, 4-bit base)' },
    ], v => { mode = v; draw(); }, 'lora');
    const rankS = slider('LoRA rank r', { min: 2, max: 64, step: 2, value: 8 }, v => { rank = v; draw(); });

    root.appendChild(demoPanel(
      '7B-parameter model, three fine-tune recipes',
      'Watch the total memory (and cost) collapse as you move from full → LoRA → QLoRA.',
      cv.canvas,
      h('div', { class: 'controls' }, [modeSel.el, rankS.el]),
      stats.el,
    ));

    draw();

    root.appendChild(html(`
      <h3>The LoRA trick in one paragraph</h3>
      <p>A big weight matrix <code>W</code> in a transformer has millions of entries. Rather than update all of them, freeze <code>W</code> and add a tiny "adapter" <code>ΔW = B · A</code> where <code>A</code> is <em>rank × in</em> and <code>B</code> is <em>out × rank</em>, with <code>rank</code> as low as 4–16. All the model's new learning is stuffed into <code>A</code> and <code>B</code>. Total trainable parameters: often less than <strong>1%</strong> of the original model.</p>
      <div class="formula">Original: y = W·x &nbsp;&nbsp;&nbsp; LoRA: y = W·x + (B·A)·x &nbsp;&nbsp; (only A, B are trained)</div>
      <ul>
        <li><strong>Merge later:</strong> once trained, you can add <code>B·A</code> into <code>W</code> for a single-matrix model with zero extra inference cost.</li>
        <li><strong>Hot-swap:</strong> keep the base frozen on GPU; swap different LoRA adapters (customer service, legal, code) in and out for different tasks — each just a few MB.</li>
        <li><strong>Composable:</strong> stack multiple LoRAs (personality + domain + style) at inference time.</li>
      </ul>

      <h3>QLoRA — fitting a 65B model on a single 48GB GPU</h3>
      <p>Take LoRA, add: quantize the frozen base to 4 bits. Base weights now take 8× less memory. Do gradients only through the LoRA adapters (still trained in bf16). The base's 4-bit precision loss is small; the adapters' bf16 precision covers the sensitive bits. This is how open-source fine-tuning of 65B+ models became a laptop-scale hobby.</p>

      <h3>The practical fine-tuning stack today</h3>
      <table class="info-table">
        <tr><th>Stage</th><th>What you tune</th><th>Data needed</th></tr>
        <tr><td><b>Continued pretraining</b></td><td>All weights, unlabeled domain text</td><td>Billions of tokens</td></tr>
        <tr><td><b>Instruction fine-tuning (SFT)</b></td><td>All weights (or LoRA)</td><td>10K–1M prompt/answer pairs</td></tr>
        <tr><td><b>Preference tuning (DPO / RLHF)</b></td><td>All weights (or LoRA)</td><td>10K–100K preference triples</td></tr>
        <tr><td><b>Task-specific LoRA</b></td><td>LoRA adapters only</td><td>100–10K examples</td></tr>
      </table>

      <div class="callout callout-warn"><div class="callout-title">⚠️ Catastrophic forgetting</div>
      Aggressive fine-tuning on narrow data can degrade the model's other capabilities (math, general reasoning, safety). LoRA at low rank naturally guards against this — you're only slightly rotating the model in a small subspace. For full fine-tunes, mix a few % of general-purpose data into every batch.</div>

      <div class="callout callout-tip"><div class="callout-title">💡 When to reach for which</div>
      Need up-to-the-minute facts? <strong>RAG</strong>. Need a specific style, format, or narrow-domain expertise? <strong>LoRA/QLoRA fine-tune</strong>. Need both? <strong>Fine-tune the style, retrieve the facts.</strong> Skip fine-tuning entirely if a few good in-context examples do the job — it's often the fastest to production.</div>
    `));
  },
};
