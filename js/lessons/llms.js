// Lesson: How LLMs work — tokenizer, next-token prediction with temperature,
// autoregressive generation (a real tiny n-gram LM trained in-browser), training pipeline.
import {
  h, html, makeCanvas, demoPanel, slider, button, statRow,
} from '../utils.js';
import { onLeave } from '../app.js';

// ---------- tiny BPE-ish tokenizer ----------
const SUBWORDS = [
  'the', 'ing', 'tion', 'ation', 'trans', 'form', 'er', 'est', 'un', 're', 'pre',
  'token', 'learn', 'machine', 'model', 'attention', 'neural', 'network', 'gener',
  'lang', 'uage', 'compute', 'anthropic', 'claude', 'chat', 'gpt', 'intel', 'ligence',
  'ed', 'ly', 'al', 'ic', 'ous', 'ment', 'ness', 'able', 'iz', 'at', 'or', 'an',
  'in', 'on', 'is', 'it', 'and', 'of', 'to', 'ai', 'writ', 'read', 'th', 'ch', 'sh',
  'qu', 'ck', 'll', 'ss', 'ee', 'oo', 'ea', 'ou', 'ar', 'en', 'es', 'te', 'ti', 'st',
];
function tokenize(text) {
  const tokens = [];
  const words = text.split(/(\s+)/);
  for (const w of words) {
    if (!w) continue;
    if (/^\s+$/.test(w)) { continue; }
    let rest = w.toLowerCase().replace(/[^a-z0-9']/g, m => m); // keep punctuation as chars
    let isFirst = true;
    while (rest.length > 0) {
      let matched = null;
      for (const s of SUBWORDS.slice().sort((a, b) => b.length - a.length)) {
        if (rest.startsWith(s)) { matched = s; break; }
      }
      if (!matched) matched = rest[0];
      tokens.push({ text: matched, space: isFirst });
      rest = rest.slice(matched.length);
      isFirst = false;
    }
  }
  return tokens;
}

// ---------- tiny corpus + n-gram language model ----------
const CORPUS = `
a language model predicts the next word in a sentence .
the model learns patterns from huge amounts of text .
a neural network learns to predict the next token .
the transformer uses attention to understand context .
attention lets every word look at every other word .
the model turns words into vectors called embeddings .
training adjusts billions of weights with gradient descent .
the model predicts one token at a time .
each new token is fed back into the model .
sampling with high temperature makes the output creative .
sampling with low temperature makes the output predictable .
the model does not copy text , it predicts patterns .
large models learn grammar facts and reasoning from data .
the network never stores sentences , only weights .
a prompt gives the model context for its prediction .
the model reads your prompt and predicts a reply .
chat models are trained to follow instructions .
human feedback teaches the model to be helpful .
reinforcement learning shapes the model after pretraining .
the context window limits how much the model can read .
every reply is generated one token at a time .
deep networks learn simple patterns first and complex patterns later .
scaling up data and compute makes models smarter .
the model computes a probability for every possible next token .
good predictions require understanding the whole sentence .
the next word depends on all the words before it .
big models can write code and answer questions .
text becomes tokens and tokens become vectors .
the model outputs probabilities , not certainties .
a language model is just a very good guesser .
`.trim().replace(/\n/g, ' ');

function buildLM(text) {
  const words = text.split(/\s+/);
  const uni = {}, bi = {}, tri = {};
  for (let i = 0; i < words.length; i++) {
    uni[words[i]] = (uni[words[i]] || 0) + 1;
    if (i >= 1) {
      const k = words[i - 1];
      (bi[k] = bi[k] || {})[words[i]] = (bi[k][words[i]] || 0) + 1;
    }
    if (i >= 2) {
      const k = words[i - 2] + ' ' + words[i - 1];
      (tri[k] = tri[k] || {})[words[i]] = (tri[k][words[i]] || 0) + 1;
    }
  }
  return { uni, bi, tri, words };
}
const LM = buildLM(CORPUS);

function nextDist(context) {
  // trigram backoff → bigram → unigram; returns {word: score}
  const ws = context.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const w1 = ws[ws.length - 2], w2 = ws[ws.length - 1];
  let counts = null;
  if (w1 && LM.tri[w1 + ' ' + w2]) counts = LM.tri[w1 + ' ' + w2];
  else if (w2 && LM.bi[w2]) counts = LM.bi[w2];
  else counts = LM.uni;
  return counts;
}
function applyTemperature(counts, T) {
  const entries = Object.entries(counts);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  let probs = entries.map(([w, c]) => [w, c / total]);
  // p^(1/T) renormalized
  const powed = probs.map(([w, p]) => [w, Math.pow(p, 1 / Math.max(0.05, T))]);
  const z = powed.reduce((s, [, p]) => s + p, 0);
  return powed.map(([w, p]) => [w, p / z]).sort((a, b) => b[1] - a[1]);
}
function sample(dist) {
  let r = Math.random();
  for (const [w, p] of dist) { r -= p; if (r <= 0) return w; }
  return dist[0][0];
}

const TOKEN_COLORS = ['#58a6ff', '#f0883e', '#3fb950', '#bc8cff', '#ff7b9c', '#39d2c0', '#e3b341'];

export default {
  id: 'llms',
  emoji: '💬',
  title: 'How LLMs Work (ChatGPT & Claude)',
  level: 'Expert',
  blurb: 'The grand finale: tokenize text, watch a real language model predict the next token, and meet RLHF.',

  render(root) {
    root.appendChild(html(`
      <p>ChatGPT, Claude, Gemini — under the hood, every one of them is the same machine: a giant <strong>transformer</strong> (previous lessons!) trained on one deceptively simple game:</p>
      <div class="callout callout-info"><div class="callout-title">The whole secret</div>
      <strong>Given all the text so far, predict the next token.</strong> That's it. Play this game trillions of times on internet-scale text, and to keep winning, the model is forced to absorb grammar, facts, style, code, and reasoning — because all of them help predict what comes next.</div>
      <p>This lesson walks the full journey of your message through an LLM, with working demos at each step.</p>

      <h3>Step 1 · Text becomes tokens</h3>
      <p>Models don't see letters or words — they see <strong>tokens</strong>: frequent chunks of characters from a fixed vocabulary (~100,000 entries, learned by counting which character pairs co-occur most — <em>byte-pair encoding</em>). Common words are one token; rare words get split into pieces. <strong>Type below</strong> and watch a miniature tokenizer segment your text live:</p>
    `));

    // ---------- Demo 1: tokenizer ----------
    const tokInput = h('input', {
      type: 'text',
      value: 'The transformer generates intelligence',
      style: { width: '100%', fontSize: '0.95rem', padding: '10px 12px' },
    });
    const tokOut = h('div', { style: { marginTop: '12px', lineHeight: '2.2', minHeight: '2.5em' } });
    const tokStats = statRow(['Characters', 'Tokens', 'Compression']);

    function renderTokens() {
      const toks = tokenize(tokInput.value);
      tokOut.innerHTML = '';
      toks.forEach((t, i) => {
        if (t.space && i > 0) tokOut.appendChild(document.createTextNode(' '));
        tokOut.appendChild(h('span', {
          style: {
            background: TOKEN_COLORS[i % TOKEN_COLORS.length] + '33',
            border: '1px solid ' + TOKEN_COLORS[i % TOKEN_COLORS.length],
            borderRadius: '6px',
            padding: '2px 7px',
            margin: '0 1px',
            fontFamily: 'Consolas, monospace',
            fontSize: '0.88rem',
          },
        }, t.text));
      });
      const chars = tokInput.value.length;
      tokStats.set('Characters', String(chars));
      tokStats.set('Tokens', String(toks.length));
      tokStats.set('Compression', toks.length ? (chars / toks.length).toFixed(1) + ' chars/token' : '—');
    }
    tokInput.addEventListener('input', renderTokens);

    root.appendChild(demoPanel(
      'Mini tokenizer',
      'Each colored chip = one token. Notice "the" survives whole while "intelligence" shatters into learned subword pieces — real tokenizers (GPT/Claude) work the same way with much bigger vocabularies.',
      h('div', {}, [tokInput, tokOut]),
      tokStats.el,
    ));
    renderTokens();

    root.appendChild(html(`
      <h3>Step 2 · Tokens flow through the transformer</h3>
      <p>Each token becomes an <strong>embedding vector</strong> (Embeddings lesson), then flows through dozens of transformer blocks where <strong>attention</strong> lets it gather context from every earlier token (Transformers lesson). At the top, the model outputs a <strong>probability for every token in the vocabulary</strong> as the next one.</p>
      <div class="formula">tokens → embeddings → [attention + feed-forward] × 96 → softmax → P(next token) for all ~100k tokens</div>

      <h3>Step 3 · Predict, sample, repeat — watch it live</h3>
      <p>This demo runs a real (tiny!) language model, trained right now in your browser on a 30-sentence corpus about AI. The bars show its actual predicted distribution for the next word. Press <strong>Sample one token</strong> to pick from the bars and append; press <strong>Generate</strong> to loop — that loop <em>is</em> how ChatGPT and Claude write every reply, one token at a time.</p>
    `));

    // ---------- Demo 2: next-token prediction + generation ----------
    let context = 'the model';
    let T = 0.8;
    let genRunning = false, genTimer = null;
    const cv = makeCanvas(280);
    const ctxEl = h('div', {
      style: {
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '12px 14px', fontFamily: 'Consolas, monospace', fontSize: '0.92rem',
        lineHeight: '1.7', minHeight: '3.2em', marginBottom: '12px',
      },
    });

    function renderContext(highlightLast = false) {
      ctxEl.innerHTML = '';
      const ws = context.split(/\s+/);
      ws.forEach((w, i) => {
        const last = i === ws.length - 1;
        ctxEl.appendChild(h('span', {
          style: last && highlightLast
            ? { background: 'rgba(63,185,80,0.25)', borderRadius: '4px', padding: '1px 4px', color: '#3fb950', fontWeight: '700' }
            : {},
        }, w + ' '));
      });
      ctxEl.appendChild(h('span', { style: { color: '#58a6ff', fontWeight: '700' } }, '▌'));
    }

    function drawDist() {
      const dist = applyTemperature(nextDist(context), T).slice(0, 8);
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText('P(next token | context)  — top candidates at temperature ' + T.toFixed(2), 10, 18);
      const rowH = Math.min(30, (H - 40) / dist.length);
      const maxP = dist[0]?.[1] || 1;
      dist.forEach(([w, p], i) => {
        const y = 32 + i * rowH;
        ctx.fillStyle = '#c9d4e3';
        ctx.font = '13px Consolas';
        ctx.textAlign = 'right';
        ctx.fillText(w, 110, y + rowH / 2 + 4);
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? 'rgba(63,185,80,0.8)' : 'rgba(88,166,255,0.65)';
        ctx.fillRect(120, y + rowH / 2 - 7, (W - 210) * (p / maxP), 14);
        ctx.fillStyle = '#8b96a8';
        ctx.font = '11px Consolas';
        ctx.fillText((p * 100).toFixed(1) + '%', 126 + (W - 210) * (p / maxP), y + rowH / 2 + 4);
      });
    }
    cv.onResize(drawDist);

    function sampleOne() {
      const dist = applyTemperature(nextDist(context), T);
      const w = sample(dist);
      context += ' ' + w;
      const ws = context.split(/\s+/);
      if (ws.length > 26) context = ws.slice(-26).join(' '); // rolling context window
      renderContext(true);
      drawDist();
    }
    function stopGen() {
      genRunning = false;
      clearTimeout(genTimer);
      genBtn.textContent = '▶ Generate';
    }
    function genLoop(n) {
      if (!genRunning || n <= 0) { stopGen(); return; }
      sampleOne();
      genTimer = setTimeout(() => genLoop(n - 1), 380);
    }
    onLeave(stopGen);

    const sampleBtn = button('Sample one token ▸', () => { stopGen(); sampleOne(); });
    const genBtn = button('▶ Generate', () => {
      if (genRunning) { stopGen(); return; }
      genRunning = true;
      genBtn.textContent = '⏸ Stop';
      genLoop(18);
    });
    const resetBtn = button('↺ Reset prompt', () => { stopGen(); context = 'the model'; renderContext(); drawDist(); }, true);
    const tSlider = slider('Temperature', { min: 0.1, max: 2.5, step: 0.05, value: 0.8, fmt: v => v.toFixed(2) }, v => { T = v; drawDist(); });

    root.appendChild(demoPanel(
      'A working (tiny) language model',
      'The green cursor shows where the next token goes. Green bar = most likely candidate. Try temperature 0.1 (robotic, repetitive) vs 2.0 (chaotic) — the same knob exists in the real ChatGPT/Claude APIs.',
      h('div', {}, [ctxEl]),
      cv.canvas,
      h('div', { class: 'controls' }, [sampleBtn, genBtn, resetBtn, tSlider.el]),
    ));
    renderContext();

    root.appendChild(html(`
      <div class="callout callout-warn"><div class="callout-title">⚠️ This also explains hallucinations</div>
      The model always outputs <em>some</em> distribution and always samples <em>something</em> — it has no built-in "I don't know" state. When the context runs outside what training data supports, it still produces fluent, confident, plausible-sounding tokens. Fluency is not truth; that's why LLM outputs need verification for factual claims.</div>

      <h3>Step 4 · From autocomplete to assistant: the three-stage training</h3>
      <p>Raw next-token training produces a brilliant <em>autocomplete</em>, not a helpful assistant — ask it a question and it might continue with <em>more questions</em> (that's what internet text looks like!). Two more stages shape it:</p>
      <div class="cards">
        <div class="card"><div class="card-icon">📚</div><h4>1 · Pretraining</h4><p>Predict the next token on trillions of tokens of text and code. Months on thousands of GPUs; &gt;99% of all compute. Result: a "base model" that knows a lot but just continues text.</p></div>
        <div class="card"><div class="card-icon">🎓</div><h4>2 · Instruction tuning (SFT)</h4><p>Fine-tune on high-quality example conversations written by humans: question → helpful answer. The model learns the <em>assistant format</em>: answer the question, be clear, stop when done.</p></div>
        <div class="card"><div class="card-icon">🏆</div><h4>3 · RLHF / preference training</h4><p>Humans rank pairs of model answers; a <em>reward model</em> learns those preferences; reinforcement learning tunes the LLM to score highly — more helpful, more honest, less harmful. (Claude adds <em>Constitutional AI</em>: the model critiques its own outputs against written principles.)</p></div>
      </div>

      <h3>The full journey of your chat message</h3>
      <ol>
        <li>Your message (plus the conversation so far, plus a hidden <em>system prompt</em>) is <strong>tokenized</strong>.</li>
        <li>All tokens flow through ~100 transformer layers; <strong>attention</strong> connects every token to every other.</li>
        <li>The model outputs a probability distribution; a token is <strong>sampled</strong> (temperature!).</li>
        <li>The token is appended and the loop repeats — at tens to hundreds of tokens per second — until a stop token.</li>
        <li>Tokens are decoded back to text and streamed to your screen. What you watch "typing" is the sampling loop from the demo above, at scale.</li>
      </ol>

      <h3>Concepts you'll hear around LLMs</h3>
      <table class="info-table">
        <tr><th>Term</th><th>Meaning</th></tr>
        <tr><td><b>Context window</b></td><td>Maximum tokens the model can attend over in one go (200k+ for Claude). Beyond it, the oldest content must be dropped or summarized — like our demo's rolling 26-word window.</td></tr>
        <tr><td><b>RAG</b></td><td>Retrieval-augmented generation: embed your documents (Embeddings lesson!), fetch relevant chunks by vector similarity, paste them into the context so answers cite real sources.</td></tr>
        <tr><td><b>Fine-tuning / LoRA</b></td><td>Continue training on your own data. LoRA trains tiny low-rank add-on matrices instead of all weights — 1000× cheaper, nearly as good.</td></tr>
        <tr><td><b>Prompt engineering</b></td><td>Since the model continues context, the context is your programming interface: instructions, examples ("few-shot"), and step-by-step nudges ("think step by step") all reshape the distribution.</td></tr>
        <tr><td><b>Mixture of Experts</b></td><td>Route each token through a small subset of specialist sub-networks — trillion-parameter capacity at a fraction of the compute.</td></tr>
        <tr><td><b>Multimodal</b></td><td>Images/audio are tokenized too (patch embeddings — CNN lesson meets Transformers) and share the same context. Same next-token machine, richer tokens.</td></tr>
      </table>

      <div class="callout callout-tip"><div class="callout-title">🎓 The complete picture</div>
      You now hold the entire chain: <strong>data → features → gradient descent → neural nets → backprop → attention → embeddings → next-token prediction → RLHF</strong>. Every "AI breakthrough" headline you read is a variation somewhere along this chain — and you can now place it. That's what expert-level understanding looks like.</div>
    `));
  },
};
