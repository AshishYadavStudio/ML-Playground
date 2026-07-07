// Lesson: Transformers & Attention — interactive attention matrix over a sentence
import {
  h, html, makeCanvas, demoPanel, selectBox, statRow, pointerPos,
} from '../utils.js';

// Hand-crafted toy attention patterns for illustrative sentences.
// Weights are illustrative of what trained heads actually learn.
const EXAMPLES = {
  pronoun: {
    label: '"it" resolution',
    tokens: ['The', 'robot', 'picked', 'up', 'the', 'ball', 'because', 'it', 'was', 'round'],
    focus: 7, // "it"
    attn: [
      // for each query token, attention over all tokens (rows sum to ~1)
    ],
    build(n) {
      const A = uniform(n);
      // "it" attends strongly to "ball" (round → ball)
      setRow(A, 7, { 5: 0.62, 1: 0.13, 7: 0.10 });
      setRow(A, 9, { 5: 0.35, 7: 0.25, 9: 0.2 });   // "round" ← ball, it
      setRow(A, 2, { 1: 0.45, 2: 0.2, 5: 0.2 });    // "picked" ← robot, ball
      setRow(A, 6, { 2: 0.3, 8: 0.25, 6: 0.15 });
      return A;
    },
  },
  pronoun2: {
    label: '"it" resolution (flipped)',
    tokens: ['The', 'robot', 'picked', 'up', 'the', 'ball', 'because', 'it', 'was', 'strong'],
    focus: 7,
    build(n) {
      const A = uniform(n);
      // now "strong" makes "it" refer to the robot!
      setRow(A, 7, { 1: 0.60, 5: 0.12, 7: 0.10 });
      setRow(A, 9, { 1: 0.4, 7: 0.25, 9: 0.15 });
      setRow(A, 2, { 1: 0.45, 2: 0.2, 5: 0.2 });
      return A;
    },
  },
  syntax: {
    label: 'verb ↔ subject/object',
    tokens: ['The', 'chef', 'who', 'won', 'the', 'prize', 'cooked', 'a', 'perfect', 'meal'],
    focus: 6,
    build(n) {
      const A = uniform(n);
      setRow(A, 6, { 1: 0.5, 9: 0.28, 6: 0.08 });  // "cooked" ← chef, meal (skipping the clause!)
      setRow(A, 3, { 2: 0.3, 1: 0.35, 5: 0.2 });   // "won" ← who/chef, prize
      setRow(A, 9, { 6: 0.35, 8: 0.3, 9: 0.15 });
      return A;
    },
  },
};

function uniform(n) {
  return Array.from({ length: n }, () => new Array(n).fill(1 / n));
}
function setRow(A, i, strong) {
  const n = A[i].length;
  const used = Object.values(strong).reduce((a, b) => a + b, 0);
  const rest = (1 - used) / (n - Object.keys(strong).length);
  for (let j = 0; j < n; j++) A[i][j] = strong[j] ?? rest;
}

export default {
  id: 'transformers',
  emoji: '🤖',
  title: 'Attention & Transformers',
  level: 'Expert',
  blurb: 'The architecture behind ChatGPT: every word looks at every other word. Explore real attention patterns.',

  render(root) {
    root.appendChild(html(`
      <p>RNNs squeeze the whole past into one vector. The transformer's answer (2017, <em>"Attention Is All You Need"</em>): forget memory — let every token <strong>directly look at every other token</strong> and decide, with learned weights, which ones matter for interpreting it. That mechanism is <strong>self-attention</strong>.</p>
      <h3>Queries, Keys, Values — the library analogy</h3>
      <p>Each token emits three vectors, produced by three learned matrices:</p>
      <ul>
        <li><strong>Query (Q):</strong> "here's what I'm looking for" — like a search request.</li>
        <li><strong>Key (K):</strong> "here's what I contain" — like a book's index entry.</li>
        <li><strong>Value (V):</strong> "here's the information I'll hand over if you pick me."</li>
      </ul>
      <div class="formula">Attention(Q, K, V) = softmax( QKᵀ / √d ) · V</div>
      <p>Each token's query is dotted against every key → similarity scores → softmax turns them into weights summing to 1 → the token's new representation is the <strong>weighted average of all values</strong>. Every token updates in parallel: no recurrence, perfect for GPUs.</p>
      <h3>Explore: what attention actually learns</h3>
      <p><strong>Hover any word</strong> (or any matrix row) to see where that word "looks." Then switch to the flipped sentence — one changed word (<em>round</em> → <em>strong</em>) completely redirects where <em>"it"</em> attends. This is context-dependent understanding, the thing no fixed dictionary could ever do.</p>
    `));

    let exName = 'pronoun';
    let hoverTok = EXAMPLES[exName].focus;
    const cv = makeCanvas(430);
    const stats = statRow(['Hovered token', 'Strongest attention', 'Weight']);

    function draw() {
      const ex = EXAMPLES[exName];
      const tokens = ex.tokens;
      const n = tokens.length;
      const A = ex.build(n);
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);

      // --- sentence with attention arcs at top ---
      const sentY = 60;
      const tokW = Math.min(85, (W - 20) / n);
      const tokX = i => 12 + i * tokW + tokW / 2;
      // arcs from hovered token
      if (hoverTok != null) {
        for (let j = 0; j < n; j++) {
          const w = A[hoverTok][j];
          if (w < 0.02 || j === hoverTok) continue;
          const x1 = tokX(hoverTok), x2 = tokX(j);
          ctx.strokeStyle = `rgba(188,140,255,${Math.min(1, w * 2.2)})`;
          ctx.lineWidth = 1 + w * 9;
          ctx.beginPath();
          ctx.moveTo(x1, sentY - 12);
          ctx.quadraticCurveTo((x1 + x2) / 2, sentY - 12 - Math.min(46, Math.abs(x2 - x1) * 0.35), x2, sentY - 12);
          ctx.stroke();
        }
      }
      // tokens
      ctx.textAlign = 'center';
      for (let i = 0; i < n; i++) {
        const isH = i === hoverTok;
        const w = hoverTok != null ? A[hoverTok][i] : 0;
        if (hoverTok != null && !isH && w > 0.02) {
          ctx.fillStyle = `rgba(188,140,255,${Math.min(0.75, w * 1.6)})`;
          const tw = ctx.measureText(tokens[i]).width + 10;
          ctx.fillRect(tokX(i) - tw / 2, sentY - 6, tw, 20);
        }
        ctx.font = isH ? 'bold 13px Segoe UI' : '13px Segoe UI';
        ctx.fillStyle = isH ? '#e3b341' : '#e6edf3';
        ctx.fillText(tokens[i], tokX(i), sentY + 8);
      }
      ctx.textAlign = 'left';

      // --- attention matrix ---
      const mTop = 100;
      const avail = Math.min(H - mTop - 20, W - 150);
      const cell = avail / n;
      const mx = 105, my = mTop + 10;
      ctx.font = '10px Segoe UI';
      for (let i = 0; i < n; i++) {
        // row labels (queries)
        ctx.fillStyle = i === hoverTok ? '#e3b341' : '#8b96a8';
        ctx.textAlign = 'right';
        ctx.fillText(tokens[i], mx - 6, my + i * cell + cell / 2 + 3);
        ctx.textAlign = 'left';
        for (let j = 0; j < n; j++) {
          const v = A[i][j];
          ctx.fillStyle = `rgba(188,140,255,${Math.min(1, v * 1.9)})`;
          ctx.fillRect(mx + j * cell, my + i * cell, cell - 1.5, cell - 1.5);
          if (i === hoverTok) {
            ctx.strokeStyle = 'rgba(227,179,65,0.85)';
            ctx.lineWidth = 1;
            ctx.strokeRect(mx + j * cell, my + i * cell, cell - 1.5, cell - 1.5);
          }
        }
      }
      // column labels
      for (let j = 0; j < n; j++) {
        ctx.save();
        ctx.translate(mx + j * cell + cell / 2 + 3, my - 6);
        ctx.rotate(-0.9);
        ctx.fillStyle = '#8b96a8';
        ctx.fillText(tokens[j], 0, 0);
        ctx.restore();
      }
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('rows = queries ("who is looking") · columns = keys ("being looked at")', mx, my + n * cell + 16);

      if (hoverTok != null) {
        const row = A[hoverTok];
        let bj = 0;
        row.forEach((v, j) => { if (j !== hoverTok && v > row[bj]) bj = j; });
        if (row[bj] <= (row[hoverTok] ?? 0) && hoverTok !== bj) { /* keep bj anyway */ }
        stats.set('Hovered token', `"${tokens[hoverTok]}"`);
        stats.set('Strongest attention', `"${tokens[bj]}"`);
        stats.set('Weight', (row[bj] * 100).toFixed(0) + '%');
      }
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointermove', e => {
      const ex = EXAMPLES[exName];
      const n = ex.tokens.length;
      const p = pointerPos(cv.canvas, e);
      const tokW = Math.min(85, (cv.W - 20) / n);
      let nt = null;
      // over sentence?
      if (p.y > 30 && p.y < 80) {
        const i = Math.floor((p.x - 12) / tokW);
        if (i >= 0 && i < n) nt = i;
      } else {
        // over matrix rows?
        const mTop = 100;
        const avail = Math.min(cv.H - mTop - 20, cv.W - 150);
        const cell = avail / n;
        const i = Math.floor((p.y - (mTop + 10)) / cell);
        if (i >= 0 && i < n && p.x > 20 && p.x < 105 + n * cell) nt = i;
      }
      if (nt !== null && nt !== hoverTok) { hoverTok = nt; draw(); }
    });

    const sel = selectBox('Sentence', Object.entries(EXAMPLES).map(([v, o]) => ({ value: v, label: o.label })), v => {
      exName = v;
      hoverTok = EXAMPLES[v].focus;
      draw();
    }, 'pronoun');

    root.appendChild(demoPanel(
      'Self-attention explorer',
      'Hover words or matrix rows. Purple arcs and highlights show where the hovered word directs its attention.',
      cv.canvas,
      h('div', { class: 'controls' }, [sel.el]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>The full transformer block</h3>
      <p>Attention is the star, but a transformer layer wraps it with supporting machinery, then stacks the whole block dozens of times:</p>
      <div class="cards">
        <div class="card"><div class="card-icon">🎯</div><h4>Multi-head attention</h4><p>Run 8–96 attention "heads" in parallel, each with its own Q/K/V matrices — one head tracks syntax, another coreference, another position…</p></div>
        <div class="card"><div class="card-icon">🧮</div><h4>Feed-forward network</h4><p>A 2-layer MLP applied to each token independently — where much of the model's factual "knowledge" appears to live.</p></div>
        <div class="card"><div class="card-icon">🛣️</div><h4>Residual connections</h4><p>Each sublayer's output is <em>added</em> to its input — the gradient highway that makes 100-layer stacks trainable (remember backprop!).</p></div>
        <div class="card"><div class="card-icon">📍</div><h4>Positional encoding</h4><p>Attention itself is order-blind, so position information is injected into the embeddings — otherwise "dog bites man" = "man bites dog."</p></div>
      </div>
      <h3>How this becomes ChatGPT</h3>
      <ol>
        <li><strong>Pretraining:</strong> a decoder-only transformer (attention masked so tokens only look <em>backward</em>) plays one game trillions of times: <em>predict the next token</em>. That humble objective forces it to absorb grammar, facts, reasoning patterns, and style.</li>
        <li><strong>Generation:</strong> predict a token, append it, predict again — one token at a time, each new token attending over everything before it.</li>
        <li><strong>Alignment:</strong> fine-tuning on instructions plus reinforcement learning from human feedback (RLHF) shapes the raw predictor into a helpful assistant.</li>
      </ol>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The quadratic tax</div>
      Every token attends to every other: cost grows as n² with sequence length. Doubling context = 4× compute. Whole research fields (FlashAttention, sliding windows, state-space models) exist to soften this.</div>
      <div class="callout callout-tip"><div class="callout-title">💡 One architecture to rule them all</div>
      Transformers now dominate language (GPT, Claude), vision (ViT), audio (Whisper), protein folding (AlphaFold), and robotics. Learning this one architecture is the single highest-leverage investment in modern ML.</div>
    `));
  },
};
