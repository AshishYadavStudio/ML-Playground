// Lesson: Embeddings — a 2-D word map with similarity search and vector arithmetic
import {
  h, html, makeCanvas, demoPanel, button, statRow, pointerPos, selectBox,
} from '../utils.js';

// Hand-placed 2-D "embedding" of words — positions chosen so classic analogies work.
const WORDS = {
  // royalty / gender  (x roughly "gender", y roughly "royalty")
  king: [0.62, 0.80], queen: [-0.62, 0.80], man: [0.62, 0.12], woman: [-0.62, 0.12],
  prince: [0.45, 0.62], princess: [-0.45, 0.62], boy: [0.55, -0.05], girl: [-0.55, -0.05],
  // animals cluster
  cat: [0.05, -0.62], dog: [0.22, -0.58], kitten: [-0.05, -0.72], puppy: [0.14, -0.74], lion: [0.38, -0.52],
  // countries & capitals (parallel offsets)
  france: [-0.85, -0.10], paris: [-0.85, 0.28],
  japan: [-0.60, -0.28], tokyo: [-0.60, 0.10],
  italy: [-0.95, -0.35], rome: [-0.95, 0.03],
  // verbs tense-ish cluster
  walk: [0.85, -0.30], walked: [0.95, -0.42], run: [0.78, -0.18], ran: [0.90, -0.06],
};

const ANALOGIES = [
  { label: 'king − man + woman = ?', a: 'king', b: 'man', c: 'woman', expect: 'queen' },
  { label: 'paris − france + japan = ?', a: 'paris', b: 'france', c: 'japan', expect: 'tokyo' },
  { label: 'puppy − dog + cat = ?', a: 'puppy', b: 'dog', c: 'cat', expect: 'kitten' },
  { label: 'walked − walk + run = ?', a: 'walked', b: 'walk', c: 'run', expect: 'ran' },
];

export default {
  id: 'embeddings',
  emoji: '🗺️',
  title: 'Embeddings & Vector Spaces',
  level: 'Expert',
  blurb: 'Meaning as geometry: king − man + woman = queen. Explore the map where math does semantics.',

  render(root) {
    root.appendChild(html(`
      <p>Neural networks eat numbers, not words. The naive fix — give each word an ID — is terrible: it makes "cat" exactly as different from "kitten" as from "carburetor." The real fix is one of the most beautiful ideas in ML:</p>
      <div class="callout callout-info"><div class="callout-title">The embedding idea</div>
      Represent every word (or image, song, user, product…) as a <strong>point in a continuous vector space</strong>, positioned so that <em>similar things sit close together</em>. The positions aren't designed — they're <strong>learned</strong>, typically by training a model to predict words from their neighbors ("you shall know a word by the company it keeps").</div>
      <p>Real embeddings live in 300–4096 dimensions; below is a 2-D map so you can see the geometry. <strong>Hover any word</strong> to see its nearest neighbors — then run the famous analogies and watch arithmetic do semantics.</p>
    `));

    const cv = makeCanvas(460);
    let hover = null;
    let analogy = null; // {a,b,c,result:[x,y], nearest}
    const stats = statRow(['Word', 'Nearest neighbors']);

    const toX = x => 30 + (x + 1.1) / 2.2 * (cv.W - 60);
    const toY = y => cv.H - 30 - (y + 1.0) / 2.0 * (cv.H - 60);

    function nearest(pt, exclude = [], k = 3) {
      return Object.entries(WORDS)
        .filter(([w]) => !exclude.includes(w))
        .map(([w, p]) => ({ w, d: Math.hypot(p[0] - pt[0], p[1] - pt[1]) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, k);
    }

    function arrow(ctx, x1, y1, x2, y2, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(a - 0.35), y2 - 10 * Math.sin(a - 0.35));
      ctx.lineTo(x2 - 10 * Math.cos(a + 0.35), y2 - 10 * Math.sin(a + 0.35));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      // subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath(); ctx.moveTo(30 + i * (W - 60) / 10, 20); ctx.lineTo(30 + i * (W - 60) / 10, H - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(30, 20 + i * (H - 40) / 10); ctx.lineTo(W - 30, 20 + i * (H - 40) / 10); ctx.stroke();
      }

      // hover neighbor links
      if (hover && !analogy) {
        const ns = nearest(WORDS[hover], [hover], 3);
        for (const n of ns) {
          ctx.strokeStyle = 'rgba(57,210,192,0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(toX(WORDS[hover][0]), toY(WORDS[hover][1]));
          ctx.lineTo(toX(n.w in WORDS ? WORDS[n.w][0] : 0), toY(WORDS[n.w][1]));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // analogy arrows
      if (analogy) {
        const { a, b, c, result } = analogy;
        // vector from b to a, re-applied at c
        arrow(ctx, toX(WORDS[b][0]), toY(WORDS[b][1]), toX(WORDS[a][0]), toY(WORDS[a][1]), '#e3b341');
        arrow(ctx, toX(WORDS[c][0]), toY(WORDS[c][1]), toX(result[0]), toY(result[1]), '#ff7b9c');
        // result marker
        ctx.beginPath();
        ctx.arc(toX(result[0]), toY(result[1]), 9, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff7b9c';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff7b9c';
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillText('?', toX(result[0]) - 3, toY(result[1]) + 4);
      }

      // words
      for (const [w, p] of Object.entries(WORDS)) {
        const isH = w === hover;
        const inAnalogy = analogy && [analogy.a, analogy.b, analogy.c].includes(w);
        const isAnswer = analogy && w === analogy.nearest;
        ctx.beginPath();
        ctx.arc(toX(p[0]), toY(p[1]), isH || isAnswer ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isAnswer ? '#3fb950' : inAnalogy ? '#e3b341' : isH ? '#39d2c0' : '#58a6ff';
        ctx.fill();
        ctx.font = (isH || inAnalogy || isAnswer) ? 'bold 12px Segoe UI' : '11px Segoe UI';
        ctx.fillStyle = isAnswer ? '#3fb950' : inAnalogy ? '#e3b341' : isH ? '#39d2c0' : '#c9d4e3';
        ctx.fillText(w, toX(p[0]) + 8, toY(p[1]) + 4);
      }

      if (hover) {
        const ns = nearest(WORDS[hover], [hover], 3);
        stats.set('Word', `"${hover}"`);
        stats.set('Nearest neighbors', ns.map(n => n.w).join(', '));
      } else if (analogy) {
        stats.set('Word', analogy.label.replace('= ?', ''));
        stats.set('Nearest neighbors', `= ${analogy.nearest} ✓`);
      } else {
        stats.set('Word', 'hover a word');
        stats.set('Nearest neighbors', '—');
      }
    }
    cv.onResize(draw);

    cv.canvas.addEventListener('pointermove', e => {
      const p = pointerPos(cv.canvas, e);
      let best = null, bd = 24;
      for (const [w, pos] of Object.entries(WORDS)) {
        const d = Math.hypot(p.x - toX(pos[0]), p.y - toY(pos[1]));
        if (d < bd) { bd = d; best = w; }
      }
      if (best !== hover) { hover = best; draw(); }
    });

    const anSel = selectBox('Analogy', [{ value: '', label: '— pick one —' }, ...ANALOGIES.map((a, i) => ({ value: String(i), label: a.label }))], v => {
      if (v === '') { analogy = null; draw(); return; }
      const an = ANALOGIES[+v];
      const result = [
        WORDS[an.a][0] - WORDS[an.b][0] + WORDS[an.c][0],
        WORDS[an.a][1] - WORDS[an.b][1] + WORDS[an.c][1],
      ];
      const near = nearest(result, [an.a, an.b, an.c], 1)[0];
      analogy = { ...an, result, nearest: near.w };
      hover = null;
      draw();
    }, '');
    const clearBtn = button('Clear arrows', () => { analogy = null; draw(); }, true);

    root.appendChild(demoPanel(
      'The map of meaning',
      'Hover words for nearest neighbors (dashed teal). Pick an analogy: the yellow arrow (e.g. man→king, "royalty") is copied at the third word (pink) — the nearest word to where it lands answers the analogy.',
      cv.canvas,
      h('div', { class: 'controls' }, [anSel.el, clearBtn]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>Why directions mean things</h3>
      <p>Notice the arrows: <em>man → king</em> and <em>woman → queen</em> are (nearly) the same vector — a "royalty direction." <em>france → paris</em> and <em>japan → tokyo</em> share a "capital-of direction." Nobody programmed these; they <strong>emerge</strong> because the training objective forces words used in analogous contexts into analogous geometric relationships.</p>
      <div class="formula">v(king) − v(man) + v(woman) ≈ v(queen)</div>
      <h3>Embeddings are everywhere</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🔎</div><h4>Semantic search</h4><p>Embed the query and all documents; return nearest neighbors. Finds "how to fix a flat" for "bike tire repair" — no shared keywords needed.</p></div>
        <div class="card"><div class="card-icon">🤖</div><h4>RAG / AI assistants</h4><p>Retrieval-augmented generation: embed your knowledge base, fetch relevant chunks by vector similarity, hand them to an LLM as context.</p></div>
        <div class="card"><div class="card-icon">🎵</div><h4>Recommendations</h4><p>Embed users and items in one space — Spotify literally recommends songs near you in vector space.</p></div>
        <div class="card"><div class="card-icon">🖼️</div><h4>Multimodal (CLIP)</h4><p>Train image and text encoders into a <em>shared</em> space: "a photo of a dog" lands next to actual dog photos. Powers text-to-image search and generation.</p></div>
      </div>
      <h3>Inside a transformer</h3>
      <p>The very first layer of GPT-style models is an embedding table: token → vector. Everything the model does afterward — all the attention you explored last lesson — is geometry on these vectors. The final layer measures which token's embedding best matches the computed vector: meaning in, geometry throughout, meaning out.</p>
      <div class="callout callout-tip"><div class="callout-title">🎓 You made it!</div>
      From "what is ML?" to the geometry inside frontier models — you now have the complete conceptual skeleton of modern machine learning. Where to go deeper: build the NN playground datasets in PyTorch, read "Attention Is All You Need", train a tiny GPT (Karpathy's nanoGPT), or revisit any lesson here — the demos reward second visits.</div>
    `));
  },
};
