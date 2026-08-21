// Lesson: Variables & Data Types — type inspector demo + full reference
import { h, html, pyCode, demoPanel, statRow } from '../utils.js';

function classify(raw) {
  const s = raw.trim();
  if (s === '') return null;
  if (s === 'True' || s === 'False') return { type: 'bool', repr: s, note: 'Booleans are capitalized in Python — true/false is a NameError.' };
  if (s === 'None') return { type: 'NoneType', repr: 'None', note: 'None means "no value here" — what functions return when they return nothing.' };
  if (/^-?\d+$/.test(s)) return { type: 'int', repr: s, note: 'A whole number. Python ints have unlimited size — 2**1000 just works.' };
  if (/^-?\d*\.\d+(e-?\d+)?$/i.test(s) || /^-?\d+e-?\d+$/i.test(s)) return { type: 'float', repr: String(parseFloat(s)), note: 'A decimal number (64-bit). Beware: 0.1 + 0.2 == 0.30000000000000004 — floats are approximations.' };
  if ((s.startsWith('"') && s.endsWith('"') && s.length >= 2) || (s.startsWith("'") && s.endsWith("'") && s.length >= 2))
    return { type: 'str', repr: s, note: `A string of ${s.length - 2} character(s). Single or double quotes — identical meaning.` };
  if (s.startsWith('[') && s.endsWith(']')) return { type: 'list', repr: s, note: 'An ordered, changeable collection — next lesson covers it in depth.' };
  if (s.startsWith('(') && s.endsWith(')')) return { type: 'tuple', repr: s, note: 'Like a list, but frozen (immutable).' };
  if (s.startsWith('{') && s.endsWith('}')) return { type: s.includes(':') ? 'dict' : 'set', repr: s, note: s.includes(':') ? 'Key → value pairs.' : 'Unique items, no order.' };
  return { type: 'str?', repr: `"${s}"`, note: `Bare text like this is read as a variable NAME. To make it a string value, wrap it in quotes: "${s}".` };
}

export default {
  id: 'python-variables',
  emoji: '🏷️',
  title: 'Variables & Data Types',
  level: 'Beginner',
  blurb: 'Boxes with labels: numbers, text, booleans, f-strings, casting — and the type inspector to test them all.',

  render(root) {
    root.appendChild(html(`
      <p>A <strong>variable</strong> is a name pointing at a value. The <code>=</code> sign means "store", not "equals" — read it right-to-left: <em>compute the right side, attach the name on the left</em>.</p>
    `));

    root.appendChild(pyCode(
`age = 25              # int     (whole number)
height = 1.75         # float   (decimal)
name = "Ada"          # str     (text in quotes)
is_student = True     # bool    (True / False)
nothing = None        # NoneType ("no value")

age = age + 1         # variables can be re-assigned
print(type(age), age)`,
      { title: 'variables.py', output: "<class 'int'> 26" }));

    root.appendChild(html(`
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Objects are created in memory:</strong> When you write <code>25</code>, Python creates an <em>int object</em> on the heap — a C struct containing the value, a type pointer, and a reference count.</li>
          <li><strong>Names are bound to objects:</strong> <code>age = 25</code> doesn't put 25 "inside" a box called age. It creates a <em>name</em> in the current namespace that <em>points</em> to the int object. The name is the label, not the container.</li>
          <li><strong>Reassignment rebinds the name:</strong> <code>age = 26</code> creates a new int object (26) and points the name <code>age</code> at it. The old object (25) loses a reference and may be garbage-collected.</li>
          <li><strong>Type lives on the object, not the name:</strong> The variable <code>x</code> can point to an int now and a string later — the name has no type, only the object does. This is what "dynamically typed" means.</li>
          <li><strong>Reference counting manages memory:</strong> Each object tracks how many names point to it. When the count drops to zero, CPython immediately frees the memory — no manual <code>free()</code> needed.</li>
        </ol>
      </div>

      <p>Python is <strong>dynamically typed</strong>: you never declare types — the value itself carries its type, and <code>type(x)</code> reveals it. Test your intuition below:</p>
    `));

    // ---- Demo: type inspector ----
    const input = h('input', { type: 'text', value: '3.14', style: { width: '100%', fontFamily: 'var(--font-mono, Consolas)', fontSize: '1rem', padding: '11px 14px' } });
    const stats = statRow(['type( … )', 'value']);
    const noteEl = h('div', { class: 'callout callout-info', style: { minHeight: '3.2em', marginTop: '12px' } }, '');
    const tryRow = h('div', { class: 'controls' });
    for (const ex of ['42', '3.14', '"hello"', 'True', 'None', '[1, 2, 3]', '2e10', 'hello']) {
      tryRow.appendChild(h('button', { class: 'btn secondary', onclick: () => { input.value = ex; update(); } }, ex));
    }
    function update() {
      const r = classify(input.value);
      stats.set('type( … )', r ? r.type : '—');
      stats.set('value', r ? r.repr : '—');
      noteEl.textContent = r ? r.note : 'Type a Python value above.';
    }
    input.addEventListener('input', update);
    update();

    root.appendChild(demoPanel(
      'Type inspector',
      'Type any Python literal — or click an example — and see what type() would report. Try the trap: hello without quotes.',
      input, stats.el, tryRow, noteEl,
    ));

    root.appendChild(html(`<h3>Strings: the type you'll use most</h3>`));
    root.appendChild(pyCode(
`first = "Ada"
last = 'Lovelace'                  # ' and " are identical
full = first + " " + last          # concatenation
shout = full.upper()               # methods: .lower() .strip() .replace() ...

# f-strings — THE way to build text (note the f before the quote)
age = 36
msg = f"{full} is {age} years old ({age * 12} months)"
print(msg)
print(len(msg), msg[0], msg[-1])   # length, first char, last char`,
      { title: 'strings.py', output: 'Ada Lovelace is 36 years old (432 months)\n41 A )' }));

    root.appendChild(html(`<h3>Numbers & operators</h3>`));
    root.appendChild(pyCode(
`a, b = 17, 5          # multiple assignment in one line
print(a + b, a - b, a * b)   # arithmetic
print(a / b)          # true division  -> always float
print(a // b, a % b)  # floor division & remainder (modulo)
print(a ** 2)         # power
print(a > b, a == b, a != b) # comparisons -> booleans`,
      { title: 'numbers.py', output: '22 12 85\n3.4\n3 2\n289\nTrue False True' }));

    root.appendChild(html(`
      <div class="callout callout-tip"><div class="callout-title">💡 % and // in ML code</div>
      <code>i % batch_size</code> cycles through batches; <code>epoch // 10</code> buckets epochs for learning-rate decay. These two "weird" operators appear constantly.</div>
      <h3>Casting: converting between types</h3>`));
    root.appendChild(pyCode(
`x = "42"              # a string, not a number!
print(x + "1")        # string concat -> "421"
print(int(x) + 1)     # cast first    -> 43

print(float("3.5"), str(99), int(3.99), bool(0), bool("hi"))
# int() truncates toward zero; bool(): 0, "", [], None are False`,
      { title: 'casting.py', output: '421\n43\n3.5 99 3 False True' }));

    root.appendChild(html(`
      <h3>Naming rules & conventions</h3>
      <table class="info-table">
        <tr><th>Rule</th><th>✅ Valid</th><th>❌ Invalid</th></tr>
        <tr><td>Letters, digits, underscore; can't start with a digit</td><td><code>learning_rate</code>, <code>x2</code>, <code>_temp</code></td><td><code>2x</code>, <code>my-var</code>, <code>class</code> (reserved)</td></tr>
        <tr><td>Convention: snake_case for variables/functions</td><td><code>train_data</code>, <code>num_epochs</code></td><td><code>TrainData</code> (that style is for classes)</td></tr>
        <tr><td>Case-sensitive</td><td colspan="2"><code>Loss</code>, <code>loss</code>, and <code>LOSS</code> are three different variables</td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The float surprise</div>
      <code>0.1 + 0.2 == 0.3</code> is <b>False</b> (it's 0.30000000000000004). Floats are binary approximations. Never compare floats with <code>==</code>; use <code>abs(a - b) &lt; 1e-9</code> — and in ML, where <em>everything</em> is floats, this is why two "identical" training runs can differ in the last decimal places.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Python's memory model and identity vs equality</summary>
        <div class="deep-dive-body">
          <h4>Identity vs equality: <code>is</code> vs <code>==</code></h4>
          <p><code>==</code> checks whether two objects have the same <em>value</em>. <code>is</code> checks whether they are the <em>same object in memory</em> (same address). These are fundamentally different questions:</p>
          <p><code>a = [1, 2]; b = [1, 2]</code> — here <code>a == b</code> is <code>True</code> (same contents) but <code>a is b</code> is <code>False</code> (two different list objects). However, <code>a = b = [1, 2]</code> makes both names point to the same list, so <code>a is b</code> is <code>True</code>. Use <code>is</code> only for <code>None</code> checks (<code>if x is None</code>) — everywhere else, use <code>==</code>.</p>

          <h4>Mutability: the real dividing line</h4>
          <p><strong>Immutable types</strong> (int, float, str, tuple, frozenset) cannot be changed after creation. <code>x = x + 1</code> doesn't modify the int — it creates a new one. <strong>Mutable types</strong> (list, dict, set) can be modified in place: <code>lst.append(4)</code> changes the existing list object. This is why passing a list to a function and modifying it inside affects the caller's list too — both names point to the same mutable object.</p>

          <h4>Integer caching (small-integer optimization)</h4>
          <p>CPython pre-creates int objects for -5 through 256 and reuses them. So <code>a = 100; b = 100; a is b</code> is <code>True</code> — both point to the same cached object. But <code>a = 1000; b = 1000; a is b</code> may be <code>False</code> because large integers are created fresh. This is an implementation detail you should never rely on — always use <code>==</code> for value comparison.</p>

          <h4>Common Pitfalls</h4>
          <div class="misconception"><strong>❌ Pitfall:</strong> Using <code>is</code> to compare numbers or strings: <code>if score is 100:</code></div>
          <p><strong>✅ Better approach:</strong> Always use <code>==</code> for value comparison. <code>is</code> happens to work for small integers due to caching, then breaks mysteriously for larger values. Reserve <code>is</code> for <code>None</code>, <code>True</code>, and <code>False</code>.</p>

          <h4>Variables in ML contexts</h4>
          <p>Understanding the name-to-object model matters for ML: when you write <code>X_train = X[:8000]</code>, NumPy slicing creates a <em>view</em>, not a copy — modifying <code>X_train</code> modifies <code>X</code>. When you write <code>model_backup = model</code>, both names point to the same neural network — training one trains both. Explicit copying (<code>.copy()</code>, <code>copy.deepcopy()</code>) is the safety net.</p>
        </div>
      </details>
    `));
  },
};
