// Lesson: Conditions & Loops — if/elif/else, for, while, break/continue + flow tracer
import { h, html, pyCode, demoPanel, button, selectBox } from '../utils.js';
import { onLeave } from '../app.js';

// Precomputed execution traces for the flow tracer
const PROGRAMS = {
  fizzbuzz: {
    name: 'FizzBuzz (if / elif / else)',
    code: [
      'for i in range(1, 8):',
      '    if i % 3 == 0 and i % 5 == 0:',
      '        print("FizzBuzz")',
      '    elif i % 3 == 0:',
      '        print("Fizz")',
      '    elif i % 5 == 0:',
      '        print("Buzz")',
      '    else:',
      '        print(i)',
    ],
    trace: (() => {
      const t = [];
      for (let i = 1; i < 8; i++) {
        t.push({ line: 0, vars: { i }, out: null, note: `range(1, 8) yields ${i} — remember, 8 itself is excluded.` });
        t.push({ line: 1, vars: { i }, out: null, note: `${i} % 3 == 0 and ${i} % 5 == 0 → ${i % 3 === 0 && i % 5 === 0}` });
        if (i % 3 === 0 && i % 5 === 0) t.push({ line: 2, vars: { i }, out: 'FizzBuzz', note: 'Both conditions true.' });
        else {
          t.push({ line: 3, vars: { i }, out: null, note: `elif: ${i} % 3 == 0 → ${i % 3 === 0}` });
          if (i % 3 === 0) t.push({ line: 4, vars: { i }, out: 'Fizz', note: 'Divisible by 3 only.' });
          else {
            t.push({ line: 5, vars: { i }, out: null, note: `elif: ${i} % 5 == 0 → ${i % 5 === 0}` });
            if (i % 5 === 0) t.push({ line: 6, vars: { i }, out: 'Buzz', note: 'Divisible by 5 only.' });
            else t.push({ line: 8, vars: { i }, out: String(i), note: 'No condition matched — the else branch catches everything left.' });
          }
        }
      }
      return t;
    })(),
  },
  breakloop: {
    name: 'break & continue',
    code: [
      'for n in [4, 7, -2, 9, 0, 5]:',
      '    if n == 0:',
      '        break        # stop the whole loop',
      '    if n < 0:',
      '        continue     # skip to the next item',
      '    print(n * 10)',
    ],
    trace: (() => {
      const t = [];
      for (const n of [4, 7, -2, 9, 0, 5]) {
        t.push({ line: 0, vars: { n }, out: null, note: `Next item: n = ${n}` });
        t.push({ line: 1, vars: { n }, out: null, note: `n == 0 → ${n === 0}` });
        if (n === 0) { t.push({ line: 2, vars: { n }, out: null, note: 'break: the loop ends immediately — 5 is never visited.' }); break; }
        t.push({ line: 3, vars: { n }, out: null, note: `n < 0 → ${n < 0}` });
        if (n < 0) { t.push({ line: 4, vars: { n }, out: null, note: 'continue: skip the rest of the body, jump to the next item.' }); continue; }
        t.push({ line: 5, vars: { n }, out: String(n * 10), note: `print(${n} * 10)` });
      }
      return t;
    })(),
  },
  whileloop: {
    name: 'while (loop until a condition)',
    code: [
      'balance = 100',
      'years = 0',
      'while balance < 200:',
      '    balance = balance * 1.5',
      '    years = years + 1',
      'print(years, "years to double+")',
    ],
    trace: (() => {
      const t = [{ line: 0, vars: { balance: 100 }, out: null, note: 'Start with 100.' },
        { line: 1, vars: { balance: 100, years: 0 }, out: null, note: 'Counter at zero.' }];
      let balance = 100, years = 0;
      while (balance < 200) {
        t.push({ line: 2, vars: { balance: +balance.toFixed(2), years }, out: null, note: `${balance.toFixed(1)} < 200 → True, run the body again.` });
        balance *= 1.5;
        t.push({ line: 3, vars: { balance: +balance.toFixed(2), years }, out: null, note: 'Grow by 50%.' });
        years += 1;
        t.push({ line: 4, vars: { balance: +balance.toFixed(2), years }, out: null, note: `years = ${years}` });
      }
      t.push({ line: 2, vars: { balance: +balance.toFixed(2), years }, out: null, note: `${balance.toFixed(1)} < 200 → False — the loop exits.` });
      t.push({ line: 5, vars: { balance: +balance.toFixed(2), years }, out: `${years} years to double+`, note: 'while runs an UNKNOWN number of times — until the condition fails. (for = known count, while = unknown.)' });
      return t;
    })(),
  },
};

export default {
  id: 'python-control',
  emoji: '🔀',
  title: 'Conditions & Loops',
  level: 'Beginner',
  blurb: 'if/elif/else, for, while, break, continue — watch control flow jump around live.',

  render(root) {
    root.appendChild(html(`
      <p>Programs make decisions (<code>if</code>) and repeat work (<code>for</code>, <code>while</code>). Together they're called <strong>control flow</strong> — the order in which lines actually run, which is rarely just top-to-bottom.</p>
      <h3>if / elif / else</h3>
    `));

    root.appendChild(pyCode(
`temperature = 31

if temperature > 35:
    print("heatwave")
elif temperature > 25:          # only checked if the first was False
    print("warm")               # <-- this one runs
elif temperature > 15:
    print("mild")
else:
    print("cold")

# conditions combine with and / or / not
if temperature > 25 and temperature <= 35:
    print("beach day")`,
      { title: 'conditions.py', output: 'warm\nbeach day' }));

    root.appendChild(html(`
      <ul>
        <li>Branches are checked <strong>top to bottom</strong>; the <em>first</em> true one runs and the rest are skipped.</li>
        <li><code>else</code> is the catch-all. <code>elif</code> = "else if".</li>
        <li>Combine tests with <code>and</code>, <code>or</code>, <code>not</code> — real words, not <code>&amp;&amp;</code>/<code>||</code>.</li>
      </ul>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Conditions evaluate to booleans:</strong> Python evaluates the expression after <code>if</code> and coerces it to <code>True</code> or <code>False</code>. Any value can be tested — not just booleans (see truthiness rules in the Deep Dive).</li>
          <li><strong>Branches are checked top-to-bottom:</strong> Python evaluates <code>if</code>, then each <code>elif</code> in order. The <em>first</em> true branch runs; all remaining branches (including <code>else</code>) are skipped entirely — their code is never even evaluated.</li>
          <li><strong>For-loops request items from an iterator:</strong> <code>for x in items</code> calls <code>iter(items)</code> to get an iterator, then calls <code>next()</code> repeatedly. Each call yields the next value; when <code>StopIteration</code> is raised, the loop ends. This protocol is why for-loops work on lists, strings, files, generators — anything iterable.</li>
          <li><strong>While-loops re-check each time:</strong> Before every iteration, the condition is re-evaluated from scratch. If it's <code>True</code>, the body runs; if <code>False</code>, the loop exits. If the condition never becomes <code>False</code>, you get an infinite loop.</li>
          <li><strong>Break and continue alter the flow:</strong> <code>break</code> immediately exits the innermost loop. <code>continue</code> skips the rest of the current iteration and jumps back to the loop header (re-checking the condition for while, fetching the next item for for).</li>
        </ol>
      </div>

      <h3>Watch control flow live</h3>
      <p>Pick a program and step through it. The highlight <em>jumps</em> — into branches, back to loop tops, out on break — that jumping <strong>is</strong> control flow:</p>
    `));

    // ---- flow tracer ----
    let progKey = 'fizzbuzz';
    let step = -1;
    let playing = false, timer = null;

    const codeEl = h('pre', { style: { margin: 0, fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.86rem', lineHeight: 1.75, overflowX: 'auto', padding: '12px 0' } });
    const varEl = h('div', { style: { fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.85rem', color: '#4fd6c5', minHeight: '1.5em', marginTop: '10px' } });
    const outEl = h('pre', { style: { margin: '8px 0 0', fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.82rem', color: '#9ae6b4', minHeight: '2em', background: '#070a12', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' } });
    const noteEl = h('div', { class: 'callout callout-info', style: { minHeight: '3em', marginTop: '10px' } }, 'Press Step ▸ to begin.');
    let outputs = [];

    function render() {
      const prog = PROGRAMS[progKey];
      const cur = step >= 0 ? prog.trace[step] : null;
      codeEl.innerHTML = '';
      prog.code.forEach((lineText, i) => {
        const isCur = cur && cur.line === i;
        const row = h('div', {
          style: {
            padding: '0 12px', whiteSpace: 'pre',
            background: isCur ? 'rgba(109,141,255,0.16)' : 'transparent',
            borderLeft: isCur ? '3px solid #6d8dff' : '3px solid transparent',
          },
        });
        const num = h('span', { style: { color: '#3a4262', display: 'inline-block', width: '2em' } }, String(i + 1));
        const codeSpan = h('span', {});
        codeSpan.textContent = lineText;
        codeSpan.innerHTML = codeSpan.innerHTML
          .replace(/(#.*)$/g, '<span style="color:#546084;font-style:italic">$1</span>')
          .replace(/\b(for|in|if|elif|else|while|break|continue|print|range|and|or)\b/g, '<span style="color:#c792ea">$1</span>')
          .replace(/(&quot;[^&]*?&quot;|"[^"]*")/g, '<span style="color:#7cd9c8">$1</span>');
        row.appendChild(num); row.appendChild(codeSpan);
        codeEl.appendChild(row);
      });
      varEl.textContent = cur ? 'variables:  ' + Object.entries(cur.vars).map(([k, v]) => `${k} = ${v}`).join('   ') : 'variables:  (none yet)';
      outEl.textContent = outputs.length ? outputs.join('\n') : '(no output yet)';
      noteEl.textContent = cur ? cur.note : 'Press Step ▸ to begin.';
    }

    function doStep() {
      const prog = PROGRAMS[progKey];
      if (step < prog.trace.length - 1) {
        step++;
        const cur = prog.trace[step];
        if (cur.out != null) outputs.push(cur.out);
        render();
      } else stopPlay();
    }
    function stopPlay() { playing = false; clearTimeout(timer); playBtn.textContent = '▶ Auto-play'; }
    function loop() { if (!playing) return; doStep(); timer = setTimeout(loop, 700); }
    onLeave(stopPlay);

    const stepBtn = button('Step ▸', () => { stopPlay(); doStep(); });
    const playBtn = button('▶ Auto-play', () => {
      if (playing) { stopPlay(); return; }
      if (step >= PROGRAMS[progKey].trace.length - 1) { step = -1; outputs = []; }
      playing = true; playBtn.textContent = '⏸ Pause'; loop();
    });
    const resetBtn = button('↺ Restart', () => { stopPlay(); step = -1; outputs = []; render(); }, true);
    const sel = selectBox('Program', Object.entries(PROGRAMS).map(([v, p]) => ({ value: v, label: p.name })), v => {
      stopPlay(); progKey = v; step = -1; outputs = []; render();
    }, 'fizzbuzz');

    root.appendChild(demoPanel(
      'Control-flow tracer',
      'The blue highlight is the line being executed. Watch it skip failed conditions, loop back up, and bail out on break.',
      h('div', { style: { background: '#070a12', border: '1px solid var(--border)', borderRadius: '10px' } }, codeEl),
      varEl, outEl, noteEl,
      h('div', { class: 'controls' }, [stepBtn, playBtn, resetBtn, sel.el]),
    ));
    render();

    root.appendChild(html(`<h3>The for-loop toolkit</h3>`));
    root.appendChild(pyCode(
`# range: numbers on demand
for i in range(3):        print(i)        # 0 1 2
for i in range(2, 10, 3): print(i)        # 2 5 8 (start, stop, step)

# enumerate: index AND value together
for i, name in enumerate(["Ada", "Alan", "Grace"]):
    print(i, name)

# zip: walk two lists in lockstep
for name, score in zip(["Ada", "Alan"], [95, 88]):
    print(f"{name}: {score}")`,
      { title: 'loop_tools.py', output: '0\n1\n2\n2\n5\n8\n0 Ada\n1 Alan\n2 Grace\nAda: 95\nAlan: 88' }));

    root.appendChild(html(`
      <h3>for vs while — which loop when?</h3>
      <table class="info-table">
        <tr><th></th><th><code>for</code></th><th><code>while</code></th></tr>
        <tr><td><b>Use when</b></td><td>You know <em>what</em> to iterate over (a list, a range, a file)</td><td>You know <em>when to stop</em>, not how many steps (train until loss &lt; 0.01)</td></tr>
        <tr><td><b>ML example</b></td><td><code>for batch in loader:</code></td><td><code>while not converged:</code></td></tr>
        <tr><td><b>Danger</b></td><td>—</td><td>Forgetting to update the condition → infinite loop (Ctrl+C to escape!)</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 The training loop, again</div>
      Every neural network you trained on this site runs on exactly these tools: <code>for epoch in range(100):</code> wrapping <code>for batch in data:</code>, with an <code>if</code> for early stopping and a <code>break</code> when validation loss rises. Control flow <em>is</em> the training loop.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — truthiness, short-circuit evaluation, and the iterator protocol</summary>
        <div class="deep-dive-body">
          <h4>Truthiness: what counts as True?</h4>
          <p>Python doesn't require booleans in <code>if</code> statements — any value works. The rule: <strong>empty and zero-like things are False; everything else is True</strong>. Specifically falsy: <code>False</code>, <code>None</code>, <code>0</code>, <code>0.0</code>, <code>""</code> (empty string), <code>[]</code> (empty list), <code>{}</code> (empty dict), <code>set()</code>. This is why you see <code>if data:</code> instead of <code>if len(data) > 0:</code> — both work, but the first is idiomatic Python.</p>

          <h4>Short-circuit evaluation</h4>
          <p><code>and</code> stops at the first falsy value; <code>or</code> stops at the first truthy value. Python doesn't even evaluate the rest. This matters: <code>if x != 0 and 10/x > 2:</code> is safe because when <code>x</code> is 0, the <code>and</code> short-circuits before the division. It also means <code>or</code> can serve as a default: <code>name = user_input or "Anonymous"</code> — if the input is empty (falsy), the name becomes "Anonymous".</p>

          <h4>The iterator protocol under the hood</h4>
          <p>When Python encounters <code>for x in obj:</code>, it calls <code>obj.__iter__()</code> to get an iterator, then repeatedly calls <code>iterator.__next__()</code>. When <code>__next__</code> raises <code>StopIteration</code>, the loop ends cleanly. This protocol is what makes Python's for-loop so versatile — any object that implements <code>__iter__</code> and <code>__next__</code> is iterable. Files yield lines, <code>range()</code> yields numbers, generators yield whatever you <code>yield</code>.</p>

          <h4>Common Pitfalls</h4>
          <div class="misconception"><strong>❌ Pitfall:</strong> Modifying a list while iterating over it: <code>for x in lst: if x < 0: lst.remove(x)</code></div>
          <p><strong>✅ Better approach:</strong> Build a new list: <code>lst = [x for x in lst if x >= 0]</code>. Removing items during iteration skips elements because the underlying index shifts. This bug is silent — no error, just wrong results.</p>

          <h4>The else clause on loops</h4>
          <p>Python has an unusual feature: <code>for...else</code> and <code>while...else</code>. The <code>else</code> block runs only if the loop completed without hitting <code>break</code>. Useful for search patterns: loop through items looking for a match, <code>break</code> when found, and the <code>else</code> handles the "not found" case — cleaner than a flag variable.</p>
        </div>
      </details>
    `));
  },
};
