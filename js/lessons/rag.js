// Lesson: Retrieval-Augmented Generation — how modern LLMs answer with fresh facts
import {
  h, html, button, statRow, legend, selectBox,
} from '../utils.js';

const DOCS = [
  { id: 1, topic: 'refund', text: 'Refunds are processed within 5–7 business days after the return is received at our warehouse. Original shipping fees are non-refundable.' },
  { id: 2, topic: 'refund', text: 'To start a return, log into your account, select the order, click "Return item", and print the prepaid label.' },
  { id: 3, topic: 'refund', text: 'Sale items marked "final sale" are not eligible for refund. Store credit may be offered case-by-case.' },
  { id: 4, topic: 'shipping', text: 'Standard shipping takes 3–5 business days within the continental US. Expedited shipping (1–2 days) is available at checkout.' },
  { id: 5, topic: 'shipping', text: 'We ship to Canada, the UK, and the EU. International orders may incur customs fees payable to your local carrier.' },
  { id: 6, topic: 'shipping', text: 'Orders placed after 3pm PT ship the next business day. Weekend orders ship Monday.' },
  { id: 7, topic: 'account', text: 'To reset your password, click "Forgot password" on the login page and follow the emailed link. Links expire after 30 minutes.' },
  { id: 8, topic: 'account', text: 'Two-factor authentication is available in Account Settings → Security. We support Google Authenticator, Authy, and 1Password.' },
  { id: 9, topic: 'warranty', text: 'All products carry a 1-year limited warranty against manufacturing defects. Extended warranties can be purchased separately.' },
  { id: 10, topic: 'warranty', text: 'Warranty claims require the original order number and photos of the defect. Contact support@example.com to start a claim.' },
  { id: 11, topic: 'discount', text: 'Sign up for our newsletter to receive a 15% off welcome coupon. New subscribers only, valid for 30 days.' },
  { id: 12, topic: 'discount', text: 'We offer a 10% student discount verified via SheerID. Discounts do not stack with other promotions.' },
];

const QUERIES = [
  { text: 'How long do refunds take?', expected: [1, 3] },
  { text: 'Can I get an extended warranty?', expected: [9, 10] },
  { text: 'Do you ship to the UK?', expected: [5, 4] },
  { text: 'How do I turn on 2FA?', expected: [8, 7] },
  { text: 'Is there a student discount?', expected: [12, 11] },
  { text: 'What color is the sky?', expected: [] },  // out-of-scope
];

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'of', 'do', 'you', 'i', 'my', 'in', 'on', 'for', 'be', 'can']);

function tokens(str) {
  return str.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOPWORDS.has(t));
}

// Toy "embedding" = TF-IDF-style overlap score (real RAG uses dense embeddings; the mechanism is the same).
function score(query, doc) {
  const qT = new Set(tokens(query));
  const dT = tokens(doc.text.toLowerCase() + ' ' + doc.topic);
  let s = 0;
  for (const t of dT) if (qT.has(t)) s++;
  // small penalty for extreme length so tiny docs can compete
  return s / Math.sqrt(dT.length);
}

export default {
  id: 'rag',
  emoji: '📚',
  title: 'Retrieval-Augmented Generation',
  level: 'Expert',
  blurb: "How LLMs stay current, cite sources, and answer from your data — without ever being retrained on it.",

  render(root) {
    root.appendChild(html(`
      <p>Frontier LLMs know a lot of the internet, but not <em>your</em> internal wiki, not last week's news, and not the source code you just wrote. <strong>Retrieval-Augmented Generation (RAG)</strong> is the standard fix: don't retrain the model — instead, find the most relevant snippets of your data at query time and paste them into the prompt.</p>
      <div class="cards">
        <div class="card"><div class="card-icon">🔎</div><h4>Step 1 — Retrieve</h4><p>Embed the user's question. Search a vector database for the top-k semantically closest chunks.</p></div>
        <div class="card"><div class="card-icon">🧾</div><h4>Step 2 — Augment</h4><p>Stuff those chunks into the LLM's prompt as context, along with instructions like "answer using only these sources."</p></div>
        <div class="card"><div class="card-icon">💬</div><h4>Step 3 — Generate</h4><p>The LLM writes its answer grounded in the retrieved text, and can cite specific sources.</p></div>
      </div>

      <h3>Try it: a customer-support bot with a 12-document knowledge base</h3>
      <p>Pick a question. The system retrieves the top-3 chunks from a tiny knowledge base of policy snippets, then a (simulated) LLM composes an answer using only those. Toggle "No retrieval" to see what the same LLM would say without any of your data — the classic hallucination gap.</p>
    `));

    let queryIdx = 0;
    let useRAG = true;
    let topK = 3;
    const stats = statRow(['Query', 'Retrieved', 'Top score', 'Grounded']);

    const querySel = selectBox('User question',
      QUERIES.map((q, i) => ({ value: String(i), label: q.text })),
      v => { queryIdx = +v; run(); }, '0');

    const kSelect = selectBox('Top-K to retrieve', [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '5', label: '5' },
    ], v => { topK = +v; run(); }, '3');

    const modeBtn = button('🔄 Toggle: No retrieval', () => {
      useRAG = !useRAG;
      modeBtn.textContent = useRAG ? '🔄 Toggle: No retrieval' : '🔄 Toggle: Use retrieval';
      modeBtn.className = 'btn' + (useRAG ? '' : ' secondary');
      run();
    });

    // Render slots
    const queryEl = h('div', { style: { padding: '14px 16px', background: 'rgba(109,141,255,0.09)', border: '1px solid rgba(109,141,255,0.28)', borderRadius: '10px', marginTop: '12px', fontSize: '0.98rem', color: 'var(--text)' } }, '');
    const retrievedEl = h('div', { style: { marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' } });
    const answerEl = h('div', { style: { padding: '16px 18px', background: 'rgba(79,214,197,0.09)', border: '1px solid rgba(79,214,197,0.35)', borderRadius: '10px', marginTop: '14px', fontSize: '0.94rem', color: 'var(--text)', lineHeight: '1.6' } }, '');

    function run() {
      const q = QUERIES[queryIdx];
      queryEl.innerHTML = '<b style="color:var(--accent);font-size:.75rem;letter-spacing:.1em;">USER QUESTION</b><br>' + q.text;

      retrievedEl.innerHTML = '';
      if (!useRAG) {
        retrievedEl.appendChild(h('div', { style: { color: 'var(--text-dim)', fontStyle: 'italic', padding: '10px' } }, '(retrieval disabled — the LLM must rely on its baked-in knowledge only)'));
      } else {
        const scored = DOCS.map(d => ({ d, s: score(q.text, d) })).sort((a, b) => b.s - a.s).slice(0, topK);
        scored.forEach((sc, i) => {
          const bar = h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' } }, [
            h('span', { style: { fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: '700', minWidth: '30px' } }, '#' + sc.d.id),
            h('span', { style: { fontFamily: 'var(--font-mono)', fontSize: '.78rem', color: 'var(--cyan)', minWidth: '54px' } }, 'sim ' + sc.s.toFixed(2)),
            h('span', { style: { color: 'var(--text-body)', fontSize: '.86rem', flex: '1' } }, sc.d.text),
          ]);
          retrievedEl.appendChild(bar);
        });
      }

      // "generate" answer
      answerEl.innerHTML = '<b style="color:var(--cyan);font-size:.75rem;letter-spacing:.1em;">LLM ANSWER</b><br>';
      if (!useRAG) {
        // Simulated ungrounded answers
        const NAIVE = {
          0: "Refunds usually take a few weeks. You'd need to check the store's policy for exact timing. <span style='color:var(--red)'>(I'm guessing — I don't know this specific store.)</span>",
          1: "Yes, most retailers offer extended warranties for an additional fee at checkout. <span style='color:var(--red)'>(Not sure about this specific merchant.)</span>",
          2: "Yes, most online stores ship internationally. <span style='color:var(--red)'>(Guessing — I don't have this vendor's shipping policy.)</span>",
          3: "Usually 2FA is under Security in account settings. <span style='color:var(--red)'>(Generic guidance — this store's exact steps could differ.)</span>",
          4: "Many stores offer student discounts, but I can't confirm without more info. <span style='color:var(--red)'>(Hallucination risk.)</span>",
          5: "The sky is typically blue due to Rayleigh scattering.",
        };
        answerEl.innerHTML += NAIVE[queryIdx];
        stats.set('Grounded', '❌ ungrounded');
        stats.set('Retrieved', '0 / ' + DOCS.length);
        stats.set('Top score', '—');
        stats.set('Query', q.text.slice(0, 30) + (q.text.length > 30 ? '…' : ''));
        return;
      }
      const scored = DOCS.map(d => ({ d, s: score(q.text, d) })).sort((a, b) => b.s - a.s).slice(0, topK);
      const strong = scored.filter(sc => sc.s > 0.15);
      if (!strong.length) {
        answerEl.innerHTML += '<span style="color:var(--yellow)">I could not find relevant information in the knowledge base to answer that question.</span>';
        stats.set('Grounded', '⚠️ no match');
      } else {
        const GROUNDED = {
          0: `Refunds are processed within <b>5–7 business days</b> after your return arrives at the warehouse (source #${strong[0]?.d.id}). Note that "final sale" items are not eligible for a refund${strong.find(s => s.d.id === 3) ? ' — store credit may be offered instead (source #3)' : ''}.`,
          1: `Yes — all products come with a <b>1-year limited warranty</b> against manufacturing defects, and extended warranties can be purchased separately at checkout (source #${strong[0]?.d.id}). To file a claim, contact <code>support@example.com</code> with your order number.`,
          2: `Yes, we ship to the UK (source #${strong[0]?.d.id}). Note that international orders may include customs fees payable to your local carrier — not to us.`,
          3: `Go to <b>Account Settings → Security</b>. We support Google Authenticator, Authy, and 1Password (source #${strong[0]?.d.id}).`,
          4: `Yes — we offer a <b>10% student discount</b>, verified through SheerID (source #${strong[0]?.d.id}). Note: it does not stack with other promotions.`,
          5: 'I could not find relevant information in the knowledge base to answer that question.',
        };
        answerEl.innerHTML += GROUNDED[queryIdx];
        stats.set('Grounded', '✅ cites sources');
      }
      stats.set('Retrieved', scored.length + ' / ' + DOCS.length);
      stats.set('Top score', scored[0] ? scored[0].s.toFixed(2) : '—');
      stats.set('Query', q.text.slice(0, 30) + (q.text.length > 30 ? '…' : ''));
    }

    // demoPanel doesn't fit here — build a custom bordered panel
    const panel = h('div', { class: 'demo' }, [
      h('div', { class: 'demo-title' }, 'Live RAG pipeline'),
      h('div', { class: 'demo-hint' }, 'Watch retrieval turn a would-be hallucination into a grounded, sourced answer.'),
      h('div', { class: 'controls' }, [querySel.el, kSelect.el, modeBtn]),
      queryEl,
      h('div', { style: { fontSize: '.72rem', color: 'var(--text-faint)', fontWeight: '700', letterSpacing: '.1em', marginTop: '14px', textTransform: 'uppercase' } }, '🔎 RETRIEVED CHUNKS (SORTED BY SIMILARITY)'),
      retrievedEl,
      answerEl,
      stats.el,
    ]);
    root.appendChild(panel);

    run();

    root.appendChild(html(`
      <h3>The full stack in one diagram</h3>
      <div class="formula" style="white-space:normal;font-family:var(--font-mono);font-size:.86rem;line-height:1.8;">
        <b>Indexing (offline, once):</b><br>
        docs → chunker → embedding model → vector database (Pinecone / Weaviate / pgvector / Chroma)<br><br>
        <b>Query (online, every request):</b><br>
        user query → embedding model → vector DB kNN → top-k chunks → prompt template with chunks → LLM → grounded answer
      </div>

      <h3>Why RAG (usually) beats fine-tuning for knowledge</h3>
      <table class="info-table">
        <tr><th></th><th>RAG</th><th>Fine-tuning</th></tr>
        <tr><td><b>Update time</b></td><td>Instant — re-embed and index new docs</td><td>Hours to days per training run</td></tr>
        <tr><td><b>Cost per update</b></td><td>Cents (embedding tokens)</td><td>$$$–$$$$ (GPU time)</td></tr>
        <tr><td><b>Citations</b></td><td>Native — you know which chunks were used</td><td>Impossible — knowledge is baked into weights</td></tr>
        <tr><td><b>Deleting data</b></td><td>Delete the row in the vector DB</td><td>Can't — model has absorbed it (GDPR nightmare)</td></tr>
        <tr><td><b>Best for</b></td><td>Facts, docs, changing info</td><td>Style, format, tone, narrow reasoning skills</td></tr>
      </table>

      <h3>Where RAG goes wrong (and the fixes)</h3>
      <ul>
        <li><strong>Bad chunks in, bad answer out:</strong> the LLM will confidently answer from wrong context. Fix: <em>reranker</em> models (a small cross-encoder that re-scores the top-20 into top-3), and threshold below which to say "I don't know."</li>
        <li><strong>Chunk boundaries slice concepts in half:</strong> use overlapping chunks (e.g. 512 tokens with 50-token overlap), or use hierarchical chunking (small chunks for retrieval, larger parent chunks for context).</li>
        <li><strong>Keyword queries miss semantic matches</strong> and vice-versa. Fix: <em>hybrid search</em> — combine BM25 (keyword) and dense (semantic) with reciprocal-rank fusion.</li>
        <li><strong>Multi-hop questions</strong> ("Which employee shipped the most bug-fix commits in Q3?") need <em>tool use / agentic retrieval</em>, not one-shot RAG.</li>
      </ul>

      <div class="callout callout-tip"><div class="callout-title">💡 The one-line intuition</div>
      Fine-tuning teaches the model a new <em>skill</em>. RAG hands the model a new <em>book</em>. Most production LLM applications need one book of company knowledge, not a new skill — so most start with RAG.</div>

      <div class="callout callout-info"><div class="callout-title">📌 What "the LLM" actually does here</div>
      In our simulated demo the answer text is scripted based on which chunks were retrieved. In a real system, that final "compose an answer from these chunks" step is a normal LLM call — the retrieved text just becomes part of the prompt. All the machine learning is upstream: the embedding model that maps text → vector, and the vector DB that finds nearest neighbors fast.</div>
    `));
  },
};
