// Lesson: Python Basics — step through code with live variable state
import {
  h, html, demoPanel, button, selectBox,
} from '../utils.js';
import { onLeave } from '../app.js';

// Each program: lines of code + a precomputed execution trace.
// trace step: { line (0-based), vars: {name: repr}, out: [lines printed so far], note }
const PROGRAMS = {
  variables: {
    name: '1 · Variables & types',
    code: [
      'name = "Ada"',
      'age = 36',
      'height = 1.70',
      'is_ml_fan = True',
      '',
      'print(name, "is", age)',
      'age = age + 1',
      'print("next year:", age)',
    ],
    trace: [
      { line: 0, vars: { name: '"Ada"' }, out: [], note: 'A variable is a name pointing at a value. Strings live in quotes.' },
      { line: 1, vars: { name: '"Ada"', age: '36' }, out: [], note: 'age is an int — Python figures out types automatically (dynamic typing).' },
      { line: 2, vars: { name: '"Ada"', age: '36', height: '1.7' }, out: [], note: 'height is a float (decimal number).' },
      { line: 3, vars: { name: '"Ada"', age: '36', height: '1.7', is_ml_fan: 'True' }, out: [], note: 'Booleans are True / False (capitalized in Python).' },
      { line: 5, vars: { name: '"Ada"', age: '36', height: '1.7', is_ml_fan: 'True' }, out: ['Ada is 36'], note: 'print() writes to the console. Commas add spaces.' },
      { line: 6, vars: { name: '"Ada"', age: '37', height: '1.7', is_ml_fan: 'True' }, out: ['Ada is 36'], note: 'Right side computed first (36 + 1), then stored back into age.' },
      { line: 7, vars: { name: '"Ada"', age: '37', height: '1.7', is_ml_fan: 'True' }, out: ['Ada is 36', 'next year: 37'], note: 'The variable now holds the updated value.' },
    ],
  },
  loop: {
    name: '2 · Lists & loops',
    code: [
      'scores = [78, 92, 85]',
      'total = 0',
      'for s in scores:',
      '    total = total + s',
      'mean = total / len(scores)',
      'print("mean:", mean)',
    ],
    trace: [
      { line: 0, vars: { scores: '[78, 92, 85]' }, out: [], note: 'A list holds an ordered collection. Index from 0: scores[0] is 78.' },
      { line: 1, vars: { scores: '[78, 92, 85]', total: '0' }, out: [], note: 'An accumulator, starting at zero.' },
      { line: 2, vars: { scores: '[78, 92, 85]', total: '0', s: '78' }, out: [], note: 'The for loop visits each element. First pass: s = 78.' },
      { line: 3, vars: { scores: '[78, 92, 85]', total: '78', s: '78' }, out: [], note: 'Indentation defines the loop body — no braces in Python!' },
      { line: 2, vars: { scores: '[78, 92, 85]', total: '78', s: '92' }, out: [], note: 'Back to the top: s = 92.' },
      { line: 3, vars: { scores: '[78, 92, 85]', total: '170', s: '92' }, out: [], note: '78 + 92 = 170.' },
      { line: 2, vars: { scores: '[78, 92, 85]', total: '170', s: '85' }, out: [], note: 'Last element: s = 85.' },
      { line: 3, vars: { scores: '[78, 92, 85]', total: '255', s: '85' }, out: [], note: 'List exhausted — the loop ends after this.' },
      { line: 4, vars: { scores: '[78, 92, 85]', total: '255', s: '85', mean: '85.0' }, out: [], note: 'len(scores) is 3; division always gives a float.' },
      { line: 5, vars: { scores: '[78, 92, 85]', total: '255', s: '85', mean: '85.0' }, out: ['mean: 85.0'], note: 'You just computed your first ML statistic. 🎉' },
    ],
  },
  functions: {
    name: '3 · Functions & if',
    code: [
      'def grade(score):',
      '    if score >= 90:',
      '        return "A"',
      '    elif score >= 80:',
      '        return "B"',
      '    return "C"',
      '',
      'result = grade(85)',
      'print(result)',
    ],
    trace: [
      { line: 0, vars: {}, out: [], note: 'def defines a function. Nothing runs yet — Python just remembers it.' },
      { line: 7, vars: {}, out: [], note: 'Now we call grade(85). Execution jumps into the function…' },
      { line: 1, vars: { 'score (inside grade)': '85' }, out: [], note: '85 >= 90? No — skip this branch.' },
      { line: 3, vars: { 'score (inside grade)': '85' }, out: [], note: '85 >= 80? Yes — take this branch.' },
      { line: 4, vars: { 'score (inside grade)': '85' }, out: [], note: 'return sends "B" back to the caller and exits the function.' },
      { line: 7, vars: { result: '"B"' }, out: [], note: 'The returned value lands in result. The local variable score is gone.' },
      { line: 8, vars: { result: '"B"' }, out: ['B'], note: 'Functions let you name and reuse logic — models are built from thousands of them.' },
    ],
  },
  dict: {
    name: '4 · Dictionaries (counting)',
    code: [
      'words = ["spam", "ham", "spam"]',
      'counts = {}',
      'for w in words:',
      '    counts[w] = counts.get(w, 0) + 1',
      'print(counts)',
    ],
    trace: [
      { line: 0, vars: { words: '["spam", "ham", "spam"]' }, out: [], note: 'Three words, one of them twice.' },
      { line: 1, vars: { words: '[…]', counts: '{}' }, out: [], note: 'A dict maps keys → values. Perfect for counting.' },
      { line: 2, vars: { words: '[…]', counts: '{}', w: '"spam"' }, out: [], note: 'First word.' },
      { line: 3, vars: { words: '[…]', counts: '{"spam": 1}', w: '"spam"' }, out: [], note: '.get(w, 0) returns 0 if the key is missing — so 0 + 1 = 1.' },
      { line: 2, vars: { words: '[…]', counts: '{"spam": 1}', w: '"ham"' }, out: [], note: 'Next word.' },
      { line: 3, vars: { words: '[…]', counts: '{"spam": 1, "ham": 1}', w: '"ham"' }, out: [], note: 'New key created.' },
      { line: 2, vars: { words: '[…]', counts: '{"spam": 1, "ham": 1}', w: '"spam"' }, out: [], note: '"spam" again…' },
      { line: 3, vars: { words: '[…]', counts: '{"spam": 2, "ham": 1}', w: '"spam"' }, out: [], note: 'Existing count incremented: 1 + 1 = 2.' },
      { line: 4, vars: { words: '[…]', counts: '{"spam": 2, "ham": 1}', w: '"spam"' }, out: ["{'spam': 2, 'ham': 1}"], note: 'Word counting is literally how Naive Bayes spam filters are trained!' },
    ],
  },
};

export default {
  id: 'python-basics',
  emoji: '🎬',
  title: 'Step-Through Practice',
  level: 'Beginner',
  blurb: 'Consolidate everything so far: trace four real programs line by line and predict each step.',

  render(root) {
    root.appendChild(html(`
      <p>Python is the native language of machine learning — every major framework (PyTorch, TensorFlow, scikit-learn) speaks it. The good news: you need surprisingly little Python to start doing ML. These four mini-programs cover 80% of what you'll read in real ML code.</p>
      <h3>Step through real code</h3>
      <p>Press <strong>Step</strong> to execute one line at a time. The highlighted line is <em>about to run's just run</em>; watch the variables panel and console update, and read the explanation under the code.</p>
    `));

    let progKey = 'variables';
    let step = -1; // -1 = not started
    let playing = false, timer = null;

    const codeEl = h('pre', { style: { margin: '0', fontFamily: 'Consolas, monospace', fontSize: '0.86rem', lineHeight: '1.7', overflowX: 'auto', padding: '12px 0' } });
    const varsEl = h('div');
    const outEl = h('pre', { style: { margin: '0', fontFamily: 'Consolas, monospace', fontSize: '0.82rem', color: '#3fb950', minHeight: '2.4em' } });
    const noteEl = h('div', { class: 'callout callout-info', style: { marginTop: '12px', minHeight: '3em' } }, 'Press Step ▸ to begin.');

    function renderState() {
      const prog = PROGRAMS[progKey];
      const cur = step >= 0 ? prog.trace[step] : null;
      // code with highlight
      codeEl.innerHTML = '';
      prog.code.forEach((lineText, i) => {
        const isCur = cur && cur.line === i;
        const row = h('div', {
          style: {
            padding: '0 12px',
            background: isCur ? 'rgba(88,166,255,0.15)' : 'transparent',
            borderLeft: isCur ? '3px solid #58a6ff' : '3px solid transparent',
            whiteSpace: 'pre',
          },
        });
        const num = h('span', { style: { color: '#4a5568', display: 'inline-block', width: '2em' } }, String(i + 1));
        const code = h('span', { style: { color: '#e6edf3' } });
        code.textContent = lineText || ' ';
        // crude syntax colors
        code.innerHTML = code.innerHTML
          .replace(/(&quot;.*?&quot;|"[^"]*")/g, '<span style="color:#39d2c0">$1</span>')
          .replace(/\b(def|for|in|if|elif|return|print|len|True|False|range)\b/g, '<span style="color:#bc8cff">$1</span>')
          .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#e3b341">$1</span>');
        row.appendChild(num);
        row.appendChild(code);
        codeEl.appendChild(row);
      });
      // vars table
      varsEl.innerHTML = '';
      const vars = cur ? cur.vars : {};
      const tbl = h('table', { class: 'info-table', style: { margin: '0', fontSize: '0.8rem' } });
      tbl.appendChild(h('tr', {}, [h('th', {}, 'variable'), h('th', {}, 'value')]));
      const names = Object.keys(vars);
      if (names.length === 0) tbl.appendChild(h('tr', {}, [h('td', { colspan: '2', style: { color: '#4a5568' } }, '(none yet)')]));
      const prevVars = step > 0 ? prog.trace[step - 1].vars : {};
      for (const n of names) {
        const changed = prevVars[n] !== vars[n];
        tbl.appendChild(h('tr', {}, [
          h('td', { style: { fontFamily: 'Consolas' } }, n),
          h('td', { style: { fontFamily: 'Consolas', color: changed ? '#e3b341' : '#c9d4e3', fontWeight: changed ? '700' : '400' } }, vars[n]),
        ]));
      }
      varsEl.appendChild(tbl);
      // console
      outEl.textContent = cur && cur.out.length ? cur.out.join('\n') : '(console empty)';
      outEl.style.color = cur && cur.out.length ? '#3fb950' : '#4a5568';
      noteEl.textContent = cur ? cur.note : 'Press Step ▸ to begin.';
      stepBtn.disabled = cur ? step >= prog.trace.length - 1 : false;
    }

    function doStep() {
      const prog = PROGRAMS[progKey];
      if (step < prog.trace.length - 1) { step++; renderState(); }
      if (step >= prog.trace.length - 1) stopPlay();
    }
    function stopPlay() {
      playing = false;
      clearTimeout(timer);
      playBtn.textContent = '▶ Auto-play';
    }
    function playLoop() {
      if (!playing) return;
      doStep();
      timer = setTimeout(playLoop, 1400);
    }
    onLeave(stopPlay);

    const stepBtn = button('Step ▸', () => { stopPlay(); doStep(); });
    const playBtn = button('▶ Auto-play', () => {
      if (playing) { stopPlay(); return; }
      if (step >= PROGRAMS[progKey].trace.length - 1) step = -1;
      playing = true;
      playBtn.textContent = '⏸ Pause';
      playLoop();
    });
    const resetBtn = button('↺ Restart', () => { stopPlay(); step = -1; renderState(); }, true);
    const progSel = selectBox('Program', Object.entries(PROGRAMS).map(([v, p]) => ({ value: v, label: p.name })), v => {
      stopPlay(); progKey = v; step = -1; renderState();
    }, 'variables');

    const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(280px, 3fr) minmax(180px, 2fr)', gap: '14px' } }, [
      h('div', { style: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' } }, codeEl),
      h('div', {}, [
        h('div', { style: { fontSize: '0.75rem', color: '#8b96a8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' } }, 'Variables'),
        varsEl,
        h('div', { style: { fontSize: '0.75rem', color: '#8b96a8', margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' } }, 'Console output'),
        h('div', { style: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' } }, outEl),
      ]),
    ]);

    root.appendChild(demoPanel(
      'The Python visualizer',
      'Blue highlight = the line that just executed. Yellow values in the panel = just changed.',
      grid,
      noteEl,
      h('div', { class: 'controls' }, [stepBtn, playBtn, resetBtn, progSel.el]),
    ));
    renderState();

    root.appendChild(html(`
      <h3>The Python survival kit for ML</h3>
      <table class="info-table">
        <tr><th>Concept</th><th>Syntax</th><th>Where you'll see it in ML</th></tr>
        <tr><td>List</td><td><code>[1, 2, 3]</code></td><td>Sequences of samples, losses per epoch</td></tr>
        <tr><td>Dict</td><td><code>{"lr": 0.01}</code></td><td>Hyperparameter configs, vocabularies</td></tr>
        <tr><td>For loop</td><td><code>for batch in data:</code></td><td>The training loop itself</td></tr>
        <tr><td>Function</td><td><code>def train(model, data):</code></td><td>Everything is functions</td></tr>
        <tr><td>List comprehension</td><td><code>[x**2 for x in xs]</code></td><td>Quick transforms: <code>[t.lower() for t in tokens]</code></td></tr>
        <tr><td>Import</td><td><code>import numpy as np</code></td><td>First line of every ML script ever written</td></tr>
        <tr><td>Slicing</td><td><code>data[:100]</code>, <code>x[::2]</code></td><td>Train/test splits, batching</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Why indentation matters</div>
      Python uses indentation (4 spaces) instead of braces to define blocks — the visual structure <em>is</em> the logic. It's why Python reads almost like pseudocode, and why ML researchers, who prototype constantly, adopted it en masse.</div>
      <div class="callout callout-info"><div class="callout-title">📌 Next step</div>
      Plain Python loops are too slow for math on millions of numbers. The next lesson shows the fix that makes Python viable for ML at all: <strong>NumPy</strong>.</div>
    `));
  },
};
