// Lesson: Collections — lists/tuples/dicts/sets + interactive slicing visualizer
import { h, html, pyCode, demoPanel, slider, statRow } from '../utils.js';

export default {
  id: 'python-collections',
  emoji: '📚',
  title: 'Lists, Dicts & Collections',
  level: 'Beginner',
  blurb: 'The four containers every program is built from — with an interactive slicing machine.',

  render(root) {
    root.appendChild(html(`
      <p>Single variables hold one value; real programs juggle thousands. Python ships four workhorse <strong>collections</strong> — and choosing the right one is half of writing clean code.</p>
      <h3>Lists — ordered &amp; changeable</h3>
    `));

    root.appendChild(pyCode(
`scores = [78, 92, 85, 60]
scores.append(99)          # add to the end
scores[0] = 80             # replace by index (0-based!)
scores.sort()              # in-place sort
print(scores)
print(len(scores), max(scores), sum(scores) / len(scores))
print(99 in scores)        # membership test`,
      { title: 'lists.py', output: '[60, 80, 85, 92, 99]\n5 99 83.2\nTrue' }));

    root.appendChild(html(`
      <h3>Slicing — the superpower</h3>
      <p><code>lst[start:stop:step]</code> extracts a sub-list: <em>start</em> is included, <em>stop</em> is <strong>excluded</strong>, negatives count from the end. This exact syntax reappears in NumPy, pandas and PyTorch on million-element arrays — master it here on eight letters:</p>
    `));

    // ---- Demo: slicing visualizer ----
    const ITEMS = ['P', 'Y', 'T', 'H', 'O', 'N', '!', '🚀'];
    let start = 1, stop = 6, step = 1;
    const boxRow = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '4px 0 2px' } });
    const idxRow = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' } });
    const codeEl = h('div', {
      style: {
        fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.95rem', color: '#4fd6c5',
        background: '#070a12', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '10px 14px', margin: '10px 0',
      },
    });
    const stats = statRow(['Result', 'Length']);

    function selectedIndices() {
      const out = [];
      if (step > 0) for (let i = start; i < stop; i += step) { if (i >= 0 && i < ITEMS.length) out.push(i); }
      else for (let i = start; i > stop; i += step) { if (i >= 0 && i < ITEMS.length) out.push(i); }
      return out;
    }

    function draw() {
      const sel = new Set(selectedIndices());
      boxRow.innerHTML = ''; idxRow.innerHTML = '';
      ITEMS.forEach((it, i) => {
        boxRow.appendChild(h('div', {
          style: {
            width: '46px', height: '46px', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono, Consolas)', fontSize: '1.1rem', fontWeight: '700',
            borderRadius: '9px', transition: 'all 0.25s',
            background: sel.has(i) ? 'rgba(109,141,255,0.25)' : 'var(--bg-card)',
            border: sel.has(i) ? '2px solid var(--accent)' : '1px solid var(--border)',
            color: sel.has(i) ? '#eaf0fa' : '#5a6480',
            transform: sel.has(i) ? 'translateY(-3px)' : 'none',
          },
        }, it));
        idxRow.appendChild(h('div', {
          style: { width: '46px', textAlign: 'center', fontSize: '0.68rem', fontFamily: 'var(--font-mono, Consolas)', color: '#5a6480' },
        }, `${i} / ${i - ITEMS.length}`));
      });
      const ordered = selectedIndices();
      codeEl.textContent = `letters[${start}:${stop}:${step}]   →   [${ordered.map(i => `'${ITEMS[i]}'`).join(', ')}]`;
      stats.set('Result', ordered.map(i => ITEMS[i]).join('') || '(empty)');
      stats.set('Length', String(ordered.length));
    }

    const sS = slider('start', { min: -8, max: 8, step: 1, value: 1 }, v => { start = v; draw(); });
    const eS = slider('stop', { min: -8, max: 8, step: 1, value: 6 }, v => { stop = v; draw(); });
    const stS = slider('step', { min: -3, max: 3, step: 1, value: 1 }, v => { step = v === 0 ? 1 : v; draw(); });
    // normalize negative starts for display simplicity: python allows them; emulate
    function norm(v) { return v < 0 ? v + ITEMS.length : v; }
    const origDraw = draw;
    draw = function () {
      const s0 = start, e0 = stop;
      start = norm(start); stop = step > 0 ? (e0 < 0 ? e0 + ITEMS.length : e0) : (e0 < 0 ? e0 + ITEMS.length : e0);
      origDraw();
      codeEl.textContent = `letters[${s0}:${e0}:${step}]   →   ` + codeEl.textContent.split('→')[1].trim();
      start = s0; stop = e0;
    };
    draw();

    root.appendChild(demoPanel(
      'The slicing machine',
      'Grey numbers under each box show its positive / negative index. Try step −1 with start 7 to walk backwards — and notice the stop index is always excluded.',
      boxRow, idxRow, codeEl,
      h('div', { class: 'controls' }, [sS.el, eS.el, stS.el]),
      stats.el,
    ));

    root.appendChild(pyCode(
`letters = ['P','Y','T','H','O','N','!','🚀']
print(letters[1:6])     # start included, stop EXCLUDED
print(letters[:3])      # omitted start = from the beginning
print(letters[-3:])     # last three
print(letters[::2])     # every second item
print(letters[::-1])    # reversed!  the classic interview trick`,
      { title: 'slicing.py', output: "['Y', 'T', 'H', 'O', 'N']\n['P', 'Y', 'T']\n['N', '!', '🚀']\n['P', 'T', 'O', '!']\n['🚀', '!', 'N', 'O', 'H', 'T', 'Y', 'P']" }));

    root.appendChild(html(`<h3>Dictionaries — labeled data</h3>
      <p>Lists index by position; <strong>dicts</strong> index by <em>meaning</em>. They are the shape of nearly all structured data — JSON, API responses, model configs:</p>`));

    root.appendChild(pyCode(
`model_config = {
    "layers": 3,
    "activation": "relu",
    "learning_rate": 0.001,
}
print(model_config["activation"])          # lookup by key
model_config["dropout"] = 0.5              # add / update
print(model_config.get("optimizer", "adam"))  # safe lookup w/ default

for key, value in model_config.items():   # loop over pairs
    print(f"  {key} = {value}")`,
      { title: 'dicts.py', output: 'relu\nadam\n  layers = 3\n  activation = relu\n  learning_rate = 0.001\n  dropout = 0.5' }));

    root.appendChild(html(`<h3>Tuples &amp; sets — the specialists</h3>`));
    root.appendChild(pyCode(
`point = (3.5, -1.2)         # tuple: like a list, but IMMUTABLE (frozen)
x, y = point                 # unpacking — used everywhere
# point[0] = 9  ->  TypeError! tuples can't change

tags = {"cat", "dog", "cat", "bird"}   # set: unique items only
print(tags)                   # duplicates silently removed
print("dog" in tags)          # membership check is ultra-fast
print(tags & {"dog", "fish"}) # set intersection`,
      { title: 'tuples_sets.py', output: "{'cat', 'dog', 'bird'}\nTrue\n{'dog'}" }));

    root.appendChild(html(`
      <h3>Which container when?</h3>
      <table class="info-table">
        <tr><th>Container</th><th>Syntax</th><th>Ordered?</th><th>Changeable?</th><th>Reach for it when…</th></tr>
        <tr><td><b>list</b></td><td><code>[1, 2, 3]</code></td><td>✅</td><td>✅</td><td>A sequence of things (samples, losses per epoch)</td></tr>
        <tr><td><b>tuple</b></td><td><code>(1, 2)</code></td><td>✅</td><td>❌</td><td>Fixed-size records: coordinates, (width, height), function returns</td></tr>
        <tr><td><b>dict</b></td><td><code>{"k": v}</code></td><td>✅ (insertion)</td><td>✅</td><td>Named lookups: configs, vocabularies, JSON</td></tr>
        <tr><td><b>set</b></td><td><code>{1, 2}</code></td><td>❌</td><td>✅</td><td>Uniqueness &amp; fast membership: seen IDs, stopwords</td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The copy trap</div>
      <code>b = a</code> does <b>not</b> copy a list — both names point at the <em>same</em> list, so <code>b.append(9)</code> changes <code>a</code> too! To actually copy: <code>b = a.copy()</code> (or <code>a[:]</code>). This bug bites every single Python beginner exactly once.</div>
      <div class="callout callout-tip"><div class="callout-title">💡 The ML connection</div>
      A dataset is a <em>list</em> of examples; each example a <em>dict</em> of features; vocabulary lookups are <em>dicts</em>; deduplication uses <em>sets</em>; functions return <em>tuples</em>. Every ML script is these four containers all the way down.</div>
    `));
  },
};
