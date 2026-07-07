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
    `));
  },
};
