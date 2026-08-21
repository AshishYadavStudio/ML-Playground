// Lesson: RNNs — hidden state as memory, animated sequence processing
import {
  h, html, makeCanvas, demoPanel, button, slider, statRow,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'rnn',
  emoji: '🔁',
  title: 'Recurrent Networks & Memory',
  level: 'Advanced',
  blurb: 'Sequences need memory. Watch a hidden state read a sentence one word at a time — and slowly forget.',

  render(root) {
    root.appendChild(html(`
      <p>Images have fixed size; <strong>sequences don't</strong>. A sentence, a stock history, an audio clip — each has arbitrary length and order matters. The recurrent idea: process one element at a time, carrying a <strong>hidden state</strong> — a fixed-size vector that acts as the network's running memory.</p>
      <div class="formula">hₜ = tanh(W·xₜ + U·hₜ₋₁ + b) &nbsp;&nbsp; — new memory = squash( current input + previous memory )</div>
      <p>The same weights <code>W, U</code> are reused at every step (like a CNN reuses filters across space, an RNN reuses them across <em>time</em>).</p>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Initialize the hidden state:</strong> Before reading any input, the hidden state vector <em>h<sub>0</sub></em> is set to all zeros — a blank memory slate.</li>
          <li><strong>Read one element at a time:</strong> At each time step <em>t</em>, the network receives the current input <em>x<sub>t</sub></em> (a word embedding, a sensor reading, etc.) and combines it with the previous hidden state <em>h<sub>t-1</sub></em> using learned weight matrices <em>W</em> and <em>U</em>.</li>
          <li><strong>Squash through tanh:</strong> The combined signal is passed through a tanh activation, which squeezes values between -1 and +1. This is the new hidden state <em>h<sub>t</sub></em> — the network's updated "memory" after seeing everything up to step <em>t</em>.</li>
          <li><strong>Reuse the same weights:</strong> Crucially, the same <em>W</em> and <em>U</em> matrices are applied at every time step — just like CNNs reuse filters across space, RNNs reuse weights across time. This lets them handle sequences of any length.</li>
          <li><strong>Output or continue:</strong> At any step, the hidden state can be fed to an output layer for prediction (e.g. classify sentiment after the last word), or the network simply continues to the next step, carrying the updated memory forward.</li>
        </ol>
      </div>

      <h3>Watch a memory read a sentence</h3>
      <p>Below, a toy RNN with an 8-dimensional hidden state reads a sentence word by word. Each column of squares is the hidden state <em>after</em> consuming that word — watch how it shifts when meaningful words arrive, and how early words' influence fades as the sequence grows.</p>
    `));

    const SENTENCE = ['the', 'cat', 'sat', 'on', 'the', 'mat', 'and', 'then', 'fell', 'asleep'];
    const HDIM = 8;

    // deterministic pseudo-embeddings and weights
    function hashf(s, i) {
      let x = 2166136261;
      for (const c of s + i) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); }
      return ((x >>> 0) / 4294967296) * 2 - 1;
    }
    const embed = w => Array.from({ length: HDIM }, (_, i) => hashf(w, i) * 0.9);
    const Wih = Array.from({ length: HDIM }, (_, i) => Array.from({ length: HDIM }, (_, j) => hashf('W' + i, j) * 0.55));
    const Whh = Array.from({ length: HDIM }, (_, i) => Array.from({ length: HDIM }, (_, j) => hashf('U' + i, j) * 0.45));

    function stepRnn(hPrev, word) {
      const x = embed(word);
      return Array.from({ length: HDIM }, (_, i) => {
        let s = 0;
        for (let j = 0; j < HDIM; j++) s += Wih[i][j] * x[j] + Whh[i][j] * hPrev[j];
        return Math.tanh(s);
      });
    }

    // precompute all states
    const states = [new Array(HDIM).fill(0)];
    for (const w of SENTENCE) states.push(stepRnn(states[states.length - 1], w));

    const cv = makeCanvas(320);
    let t = 0; // how many words consumed
    let playing = false, timer = null;
    const stats = statRow(['Words read', 'Hidden-state norm']);

    function cellColor(v) {
      if (v >= 0) return `rgba(88,166,255,${0.15 + 0.85 * Math.min(1, v)})`;
      return `rgba(240,136,62,${0.15 + 0.85 * Math.min(1, -v)})`;
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const n = SENTENCE.length;
      const colW = Math.min(64, (W - 60) / (n + 1));
      const cellH = 20;
      const y0 = 60;

      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText('hidden state h (8 dims) after each word — blue = positive, orange = negative', 10, 20);

      for (let s = 0; s <= n; s++) {
        const x0 = 30 + s * colW;
        const consumed = s <= t;
        // word label
        ctx.save();
        ctx.translate(x0 + colW / 2 - 6, y0 - 12);
        ctx.rotate(-0.5);
        ctx.font = consumed && s > 0 ? 'bold 12px Segoe UI' : '12px Segoe UI';
        ctx.fillStyle = s === t && s > 0 ? '#e3b341' : consumed ? '#e6edf3' : '#4a5568';
        ctx.fillText(s === 0 ? 'h₀' : SENTENCE[s - 1], 0, 0);
        ctx.restore();
        // state cells
        for (let i = 0; i < HDIM; i++) {
          const v = states[s][i];
          ctx.fillStyle = consumed ? cellColor(v) : 'rgba(45,53,72,0.6)';
          ctx.fillRect(x0, y0 + i * cellH, colW - 8, cellH - 3);
        }
        // arrow
        if (s < n) {
          ctx.strokeStyle = s < t ? '#58a6ff' : '#2d3548';
          ctx.lineWidth = s === t - 1 ? 2.5 : 1.5;
          const ay = y0 + HDIM * cellH + 14;
          ctx.beginPath();
          ctx.moveTo(x0 + colW - 8, ay);
          ctx.lineTo(x0 + colW, ay);
          ctx.stroke();
        }
      }
      // recurrence annotation
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('same weights W, U applied at every step →', 30, y0 + HDIM * cellH + 34);

      const norm = Math.sqrt(states[t].reduce((a, v) => a + v * v, 0));
      stats.set('Words read', `${t} / ${n}`);
      stats.set('Hidden-state norm', norm.toFixed(3));
    }
    cv.onResize(draw);

    function stopPlay() {
      playing = false;
      clearTimeout(timer);
      playBtn.textContent = '▶ Read sentence';
    }
    function playLoop() {
      if (!playing) return;
      if (t < SENTENCE.length) { t++; draw(); timer = setTimeout(playLoop, 650); }
      else stopPlay();
    }
    onLeave(stopPlay);

    const stepBtn = button('Next word ▸', () => { stopPlay(); t = Math.min(t + 1, SENTENCE.length); draw(); });
    const playBtn = button('▶ Read sentence', () => {
      if (playing) { stopPlay(); return; }
      if (t >= SENTENCE.length) t = 0;
      playing = true;
      playBtn.textContent = '⏸ Pause';
      playLoop();
    });
    const resetBtn = button('↺ Reset', () => { stopPlay(); t = 0; draw(); }, true);

    root.appendChild(demoPanel(
      'A memory reading, one word at a time',
      'Each column = the hidden state after consuming that word. The yellow word is the one just read.',
      cv.canvas,
      h('div', { class: 'controls' }, [stepBtn, playBtn, resetBtn]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>The fatal flaw: long-range forgetting</h3>
      <p>Information from early words must survive being squashed through tanh and mixed with new input at <em>every</em> step. By word 30, the signal from word 1 has been multiplied by dozens of small derivatives — the <strong>vanishing gradient across time</strong>. Plain RNNs reliably forget anything more than ~10–20 steps back.</p>
      <h3>LSTM: memory with gates</h3>
      <p>The Long Short-Term Memory cell (1997!) fixes forgetting with a separate <strong>cell state</strong> — a conveyor belt that information can ride across many steps unchanged — controlled by three learned <em>gates</em>:</p>
      <div class="cards">
        <div class="card"><div class="card-icon">🗑️</div><h4>Forget gate</h4><p>"How much of the old memory should I erase?" — a sigmoid per dimension, 0 = wipe, 1 = keep.</p></div>
        <div class="card"><div class="card-icon">📥</div><h4>Input gate</h4><p>"How much of the new information should I write in?"</p></div>
        <div class="card"><div class="card-icon">📤</div><h4>Output gate</h4><p>"How much of the memory should I reveal to the next layer right now?"</p></div>
      </div>
      <p>Because the conveyor belt is additive (not repeatedly squashed), gradients flow back through hundreds of steps. LSTMs powered Google Translate, Siri, and speech recognition throughout the 2010s.</p>
      <h3>The cliffhanger that changes everything</h3>
      <p>Even an LSTM must cram the entire past into one fixed-size vector, and must process words <strong>one at a time</strong> — no parallelism, painful on GPUs. In 2017 a paper asked: what if, instead of remembering, every word could just <em>look directly at every other word</em>? The paper was titled <em>"Attention Is All You Need."</em> Next lesson: the transformer.</p>
      <div class="callout callout-info"><div class="callout-title">📌 When RNNs are still the right tool</div>
      Streaming/online settings with strict latency (keyword spotting on tiny chips), some time-series problems, and modern linear-state-space revivals (Mamba-style models) — the recurrent idea is down but not out.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Vanishing Gradients, LSTM Gate Math & Beyond</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>The vanilla RNN update rule is:</p>
          <div class="formula">h<sub>t</sub> = tanh(W<sub>xh</sub> · x<sub>t</sub> + W<sub>hh</sub> · h<sub>t-1</sub> + b<sub>h</sub>)</div>
          <p>During backpropagation through time (BPTT), the gradient of the loss with respect to an earlier hidden state <em>h<sub>k</sub></em> involves a product of Jacobians:</p>
          <div class="formula">∂L/∂h<sub>k</sub> = ∂L/∂h<sub>T</sub> · ∏<sub>t=k+1</sub><sup>T</sup> diag(1 − h<sub>t</sub>²) · W<sub>hh</sub></div>
          <p>Since <code>|tanh'(x)| ≤ 1</code> and each step multiplies by <em>W<sub>hh</sub></em>, this product shrinks exponentially if the largest singular value of <em>W<sub>hh</sub></em> is less than 1 (vanishing gradient) or grows explosively if it exceeds 1 (exploding gradient). Gradient clipping handles explosions, but vanishing gradients require architectural changes.</p>

          <h4>LSTM Gate Equations</h4>
          <p>The Long Short-Term Memory cell (Hochreiter & Schmidhuber, 1997) introduces a <em>cell state</em> <em>c<sub>t</sub></em> — an additive pathway that gradients flow through with minimal decay:</p>
          <div class="formula">
            f<sub>t</sub> = σ(W<sub>f</sub> · [h<sub>t-1</sub>, x<sub>t</sub>] + b<sub>f</sub>) &nbsp;&nbsp; <em>(forget gate)</em><br>
            i<sub>t</sub> = σ(W<sub>i</sub> · [h<sub>t-1</sub>, x<sub>t</sub>] + b<sub>i</sub>) &nbsp;&nbsp; <em>(input gate)</em><br>
            c̃<sub>t</sub> = tanh(W<sub>c</sub> · [h<sub>t-1</sub>, x<sub>t</sub>] + b<sub>c</sub>) &nbsp;&nbsp; <em>(candidate)</em><br>
            c<sub>t</sub> = f<sub>t</sub> ⊙ c<sub>t-1</sub> + i<sub>t</sub> ⊙ c̃<sub>t</sub> &nbsp;&nbsp; <em>(cell update)</em><br>
            o<sub>t</sub> = σ(W<sub>o</sub> · [h<sub>t-1</sub>, x<sub>t</sub>] + b<sub>o</sub>) &nbsp;&nbsp; <em>(output gate)</em><br>
            h<sub>t</sub> = o<sub>t</sub> ⊙ tanh(c<sub>t</sub>)
          </div>
          <p>The key: <code>c<sub>t</sub> = f<sub>t</sub> ⊙ c<sub>t-1</sub> + ...</code> is an addition, not a repeated matrix multiply. When the forget gate is close to 1, information rides the cell state conveyor belt across hundreds of steps with gradients intact.</p>

          <h4>GRU — A Simpler Alternative</h4>
          <p>The Gated Recurrent Unit (Cho et al., 2014) merges the forget and input gates into a single "update gate" <em>z<sub>t</sub></em> and eliminates the separate cell state, using only two gates instead of three. GRUs match LSTM performance on most benchmarks with fewer parameters and faster training.</p>

          <h4>Bidirectional RNNs</h4>
          <p>A standard RNN only sees past context. A bidirectional RNN runs two RNNs — one forward, one backward — and concatenates their hidden states. This gives every position access to both past and future, which is critical for tasks like named entity recognition ("is 'Washington' a person or a place?" often depends on words after it). BERT's key insight was bringing this bidirectional idea to transformers.</p>

          <h4>Intuition</h4>
          <p>Imagine writing a summary of a 500-page book, but you can only keep notes on a single sticky note. Every page, you must decide what to erase and what to add. That is the RNN's dilemma: a fixed-size vector must summarize an arbitrarily long past. The LSTM's fix is giving you a second, larger notepad (the cell state) where you can write in pen (the input gate controls writing) and only erase specific lines (the forget gate controls erasing).</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "LSTMs completely solve the vanishing gradient problem."</div>
          <p><strong>✅ Reality:</strong> LSTMs dramatically extend the effective memory range (from ~10–20 steps to hundreds), but they are not immune. On very long sequences (thousands of tokens), the forget gate must stay near 1.0 for extended periods, which is hard to learn reliably. This is ultimately why transformers — with direct attention connections between any two positions — replaced recurrent architectures for long-range tasks.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "RNNs are obsolete."</div>
          <p><strong>✅ Reality:</strong> For streaming applications where each time step must be processed with constant memory and O(1) compute (e.g. keyword spotting on a hearing aid), recurrent architectures remain ideal. State-space models like Mamba (2023) revive the recurrent idea with linear-time training, rivaling transformers on many benchmarks while maintaining constant-memory inference.</p>

          <h4>Historical Context</h4>
          <p>The idea of recurrent connections dates to John Hopfield (1982) and Jeffrey Elman's "simple recurrent network" (1990). The vanishing gradient problem was rigorously analyzed by Hochreiter in his 1991 diploma thesis. LSTM (1997) was initially ignored due to limited compute, but became dominant from 2013–2017, powering Google Translate, Apple Siri, and Amazon Alexa. The GRU (2014) offered a popular simplification. By 2018, transformers (Vaswani et al., 2017) had largely replaced RNNs in NLP, though RNN-style ideas persist in efficient architectures like RWKV and Mamba.</p>
        </div>
      </details>
    `));
  },
};
