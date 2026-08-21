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

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Start with a pretrained model:</strong> Take a foundation model (e.g. Llama 7B) that already knows grammar, facts, and reasoning from pretraining on trillions of tokens. All this knowledge lives in billions of weight parameters.</li>
          <li><strong>Prepare your dataset:</strong> Collect (prompt, completion) pairs in your target format — customer support conversations, legal documents, code in your style. Quality matters far more than quantity: 1,000 excellent examples often beat 100,000 noisy ones.</li>
          <li><strong>Choose your strategy:</strong> Full fine-tuning updates every weight (expensive, powerful). LoRA freezes the base and trains tiny low-rank adapter matrices (cheap, nearly as good). QLoRA adds 4-bit quantization of the base to cut memory further.</li>
          <li><strong>Train:</strong> Run gradient descent on your data, updating only the trainable parameters. Monitor validation loss to avoid overfitting (catastrophic forgetting). Typically 1–5 epochs is enough.</li>
          <li><strong>Deploy:</strong> For LoRA, you can merge the adapter into the base weights for zero overhead at inference, or hot-swap different adapters for different tasks using the same base model.</li>
        </ol>
      </div>

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

      <details class="deep-dive">
        <summary>🔬 Deep Dive — LoRA math, quantization, and forgetting</summary>
        <div class="deep-dive-body">
          <h4>The LoRA Decomposition</h4>
          <p>For a pretrained weight matrix W ∈ ℝ^(d×k), LoRA adds a low-rank update:</p>
          <div class="formula">W' = W + ΔW = W + B·A &nbsp;&nbsp; where A ∈ ℝ^(r×k), B ∈ ℝ^(d×r), r ≪ min(d,k)</div>
          <p>A is initialized with random Gaussian values and B is initialized to zero, so ΔW = 0 at the start of training (the model begins exactly where pretraining left off). Only A and B receive gradients. For a typical transformer layer with d = 4096 and r = 8, LoRA adds 2 × 8 × 4096 = 65,536 parameters per matrix — versus 4096² = 16.7M for the full matrix. That's 0.4%.</p>

          <h4>QLoRA: Quantization + LoRA</h4>
          <p>QLoRA (Dettmers et al., 2023) quantizes the frozen base weights to 4-bit NormalFloat (NF4) — a data type optimized for the roughly Gaussian distribution of neural network weights. During the forward pass, 4-bit weights are dequantized to bf16 on the fly. Gradients flow only through the bf16 LoRA adapters. The result: a 65B-parameter model fits in ~33 GB (vs ~130 GB in bf16), making fine-tuning possible on a single 48 GB GPU.</p>
          <div class="formula">Memory: full bf16 = 2N bytes &nbsp;|&nbsp; LoRA bf16 = 2N + 2rdk bytes &nbsp;|&nbsp; QLoRA = 0.5N + 2rdk bytes</div>

          <h4>Catastrophic Forgetting</h4>
          <p>When fine-tuning on narrow data, the model overwrites general knowledge — it "forgets" how to do math or follow safety guidelines. Defenses include: (1) LoRA at low rank inherently limits how far the model can drift; (2) mixing 5–10% of general-purpose data into each training batch; (3) using a learning rate 10–100× lower than pretraining; (4) early stopping based on validation loss on a held-out general benchmark.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Fine-tuning teaches the model new facts."</div>
          <p><strong>✅ Reality:</strong> Fine-tuning primarily teaches the model a new <em>format, style, or behavior</em> — not new knowledge. Factual knowledge is absorbed during pretraining on trillions of tokens. Trying to fine-tune facts in with a few hundred examples doesn't reliably embed them — use RAG for dynamic knowledge instead.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "More training data always helps."</div>
          <p><strong>✅ Reality:</strong> Data quality dominates. Fine-tuning on 500 carefully curated examples often outperforms 50,000 noisy ones. Duplicates, contradictions, and low-quality completions degrade the model. The LIMA paper (2023) showed that just 1,000 high-quality examples can produce strong instruction-following.</p>

          <h4>Historical Context</h4>
          <p>Transfer learning via fine-tuning was popularized by ULMFiT (Howard & Ruder, 2018) and BERT (Devlin, 2018) — pretrain once, fine-tune cheaply for each task. Adapter layers (Houlsby et al., 2019) introduced the idea of freezing the base and adding small trainable modules. LoRA (Hu et al., 2021) simplified this to low-rank matrix pairs. QLoRA (Dettmers et al., 2023) added quantization, democratizing fine-tuning of 65B+ models. Today, LoRA is the default fine-tuning method for open-source LLMs.</p>
        </div>
      </details>
    `));
  },
};
