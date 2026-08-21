// Lesson: Functions & Scope — args/kwargs/defaults/lambda + call-stack visualizer
import { h, html, pyCode, demoPanel, button } from '../utils.js';
import { onLeave } from '../app.js';

// call-stack trace for factorial(4)
const STACK_TRACE = (() => {
  const t = [];
  t.push({ stack: [], note: 'We call factorial(4). Each call gets its own frame — a private box of local variables.', ret: null });
  const frames = [];
  function push(n) {
    frames.push(`factorial(${n})  n=${n}`);
    t.push({ stack: [...frames], note: n <= 1 ? `n = ${n} hits the base case: return 1 — no more calls.` : `n = ${n} > 1, so it must compute ${n} * factorial(${n - 1}) — a NEW call goes on the stack.`, ret: null });
    if (n > 1) {
      push(n - 1);
      const below = t[t.length - 1].retVal;
      frames.pop();
      t.push({ stack: [...frames], note: `factorial(${n - 1}) returned ${below}. Now factorial(${n}) computes ${n} × ${below} = ${n * below} and returns it.`, ret: `factorial(${n}) → ${n * below}`, retVal: n * below });
    } else {
      frames.pop();
      t.push({ stack: [...frames], note: 'The base-case frame pops off, handing 1 back to its caller.', ret: 'factorial(1) → 1', retVal: 1 });
    }
  }
  push(4);
  t.push({ stack: [], note: '🎉 The stack is empty and 24 lands in the original caller. Recursion = a function trusting a smaller version of itself.', ret: 'final result: 24', retVal: 24 });
  return t;
})();

export default {
  id: 'python-functions',
  emoji: '📦',
  title: 'Functions & Scope',
  level: 'Beginner',
  blurb: 'Name a piece of logic and reuse it forever: parameters, returns, defaults, *args, lambda, and the call stack.',

  render(root) {
    root.appendChild(html(`
      <p>A <strong>function</strong> packages logic behind a name: inputs go in (<em>parameters</em>), a result comes out (<em>return</em>). They're how programs stay readable at 10 lines and survivable at 10,000.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Define with <code>def</code>:</strong> <code>def name(params):</code> creates a function. The body (indented code) doesn't run yet — Python just memorizes it for later.</li>
          <li><strong>Call it:</strong> Writing <code>name(args)</code> creates a new <em>frame</em> — a private workspace of local variables. Arguments are matched to parameters by position or name.</li>
          <li><strong>Execute the body:</strong> Python runs the indented code top to bottom. Any variables created here are local — they exist only inside this call and vanish when the function returns.</li>
          <li><strong>Return a value:</strong> <code>return value</code> exits the function immediately and sends the result back to the caller. If there's no return statement, the function returns <code>None</code>.</li>
          <li><strong>Pop the frame:</strong> The local workspace is destroyed. If the function called another function (recursion!), those inner frames stack up and pop off in order — the call stack.</li>
        </ol>
      </div>
    `));

    root.appendChild(pyCode(
`def accuracy(correct, total):
    """Fraction of correct predictions."""   # docstring = built-in docs
    if total == 0:
        return 0.0            # return exits immediately
    return correct / total

print(accuracy(45, 50))       # arguments by position
print(accuracy(total=50, correct=45))   # or by name (any order!)`,
      { title: 'functions.py', output: '0.9\n0.9' }));

    root.appendChild(html(`<h3>Default values &amp; flexible arguments</h3>`));
    root.appendChild(pyCode(
`def train(data, epochs=10, lr=0.001, verbose=False):
    print(f"training {epochs} epochs at lr={lr}")

train("mnist")                      # defaults kick in
train("mnist", epochs=50)           # override just one
train("mnist", lr=0.1, verbose=True)

# *args / **kwargs: accept ANY number of arguments
def report(*args, **kwargs):
    print("positional:", args)      # a tuple
    print("named:", kwargs)         # a dict

report(1, 2, 3, mode="fast", debug=True)`,
      { title: 'flexible.py', output: "training 10 epochs at lr=0.001\ntraining 50 epochs at lr=0.001\ntraining 10 epochs at lr=0.1\npositional: (1, 2, 3)\nnamed: {'mode': 'fast', 'debug': True}" }));

    root.appendChild(html(`
      <div class="callout callout-tip"><div class="callout-title">💡 Why this matters for ML</div>
      Every ML library call you'll ever make is this pattern: <code>RandomForestClassifier(n_estimators=100, max_depth=5)</code>, <code>model.fit(X, y, epochs=10)</code>. Keyword arguments with defaults are why 30-parameter functions stay usable — you only name what you change.</div>
      <h3>Scope: who can see what</h3>
    `));

    root.appendChild(pyCode(
`total = 0                 # global variable

def add_score(score):
    bonus = 5              # local — exists ONLY inside this call
    return score + bonus

result = add_score(10)
print(result)              # 15
# print(bonus)  ->  NameError! bonus died when the function returned`,
      { title: 'scope.py', output: '15' }));

    root.appendChild(html(`
      <p>Each function call gets its own private workspace (a <strong>frame</strong>) that vanishes on return. Frames stack up when functions call functions — watch the famous recursive factorial run:</p>
    `));

    // ---- call-stack visualizer ----
    let step = 0;
    let playing = false, timer = null;
    const stackBox = h('div', { style: { minHeight: '190px', display: 'flex', flexDirection: 'column-reverse', gap: '6px', justifyContent: 'flex-start', padding: '12px', background: '#070a12', border: '1px solid var(--border)', borderRadius: '10px' } });
    const noteEl = h('div', { class: 'callout callout-info', style: { minHeight: '3.4em', marginTop: '10px' } }, '');
    const retEl = h('div', { style: { fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.86rem', color: '#9ae6b4', minHeight: '1.4em', marginTop: '8px' } }, '');

    const codeSide = pyCode(
`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(4))   # 24`,
      { title: 'recursion.py' });

    function render() {
      const cur = STACK_TRACE[step];
      stackBox.innerHTML = '';
      if (cur.stack.length === 0) {
        stackBox.appendChild(h('div', { style: { color: '#3a4262', fontSize: '0.8rem', fontFamily: 'var(--font-mono, Consolas)' } }, '(call stack empty)'));
      }
      cur.stack.forEach((f, i) => {
        const isTop = i === cur.stack.length - 1;
        stackBox.appendChild(h('div', {
          style: {
            padding: '9px 14px', borderRadius: '8px', fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.85rem',
            background: isTop ? 'rgba(109,141,255,0.22)' : 'var(--bg-card)',
            border: isTop ? '1px solid var(--accent)' : '1px solid var(--border)',
            color: isTop ? '#eaf0fa' : '#8b96b2',
            fontWeight: isTop ? '700' : '400',
          },
        }, (isTop ? '▶ ' : '') + f));
      });
      noteEl.textContent = cur.note;
      retEl.textContent = cur.ret ? '↩ ' + cur.ret : '';
      stepBtn.disabled = step >= STACK_TRACE.length - 1;
    }
    function doStep() { if (step < STACK_TRACE.length - 1) { step++; render(); } else stopPlay(); }
    function stopPlay() { playing = false; clearTimeout(timer); playBtn.textContent = '▶ Auto-play'; }
    function loopP() { if (!playing) return; doStep(); if (step < STACK_TRACE.length - 1) timer = setTimeout(loopP, 1300); else stopPlay(); }
    onLeave(stopPlay);

    const stepBtn = button('Step ▸', () => { stopPlay(); doStep(); });
    const playBtn = button('▶ Auto-play', () => {
      if (playing) { stopPlay(); return; }
      if (step >= STACK_TRACE.length - 1) step = 0;
      playing = true; playBtn.textContent = '⏸ Pause'; loopP();
    });
    const resetBtn = button('↺ Restart', () => { stopPlay(); step = 0; render(); }, true);

    root.appendChild(demoPanel(
      'The call stack, live',
      'Frames stack upward as factorial calls itself, then pop off as returns flow back down. The highlighted frame is the one currently running.',
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' } }, [codeSide, stackBox]),
      retEl, noteEl,
      h('div', { class: 'controls' }, [stepBtn, playBtn, resetBtn]),
    ));
    render();

    root.appendChild(html(`<h3>Lambda: one-line throwaway functions</h3>`));
    root.appendChild(pyCode(
`square = lambda x: x ** 2          # same as a one-line def
print(square(6))

# where lambdas actually shine: as arguments to other functions
scores = [("Ada", 91), ("Alan", 78), ("Grace", 95)]
top = sorted(scores, key=lambda pair: pair[1], reverse=True)
print(top)`,
      { title: 'lambda.py', output: "36\n[('Grace', 95), ('Ada', 91), ('Alan', 78)]" }));

    root.appendChild(html(`
      <h3>Function design cheat sheet</h3>
      <table class="info-table">
        <tr><th>Concept</th><th>Syntax</th><th>Remember</th></tr>
        <tr><td>Define</td><td><code>def name(params):</code></td><td>Body is indented; runs only when <em>called</em></td></tr>
        <tr><td>Return</td><td><code>return value</code></td><td>Exits instantly; no return = returns <code>None</code></td></tr>
        <tr><td>Multiple returns</td><td><code>return mean, std</code></td><td>Actually returns a tuple; unpack with <code>m, s = f()</code></td></tr>
        <tr><td>Default</td><td><code>def f(x, k=10):</code></td><td>Defaults must come after required params</td></tr>
        <tr><td>Any count</td><td><code>*args, **kwargs</code></td><td>Tuple of positionals, dict of named</td></tr>
        <tr><td>Docs</td><td><code>"""docstring"""</code></td><td>First line inside — what <code>help(f)</code> shows</td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The mutable default trap</div>
      Never write <code>def f(items=[])</code> — that ONE list is shared across every call and grows forever. Use <code>def f(items=None)</code> then <code>if items is None: items = []</code> inside. This is the most famous Python gotcha of all.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — closures, decorators, and the LEGB rule</summary>
        <div class="deep-dive-body">
          <h4>The LEGB Scope Rule</h4>
          <p>When Python sees a variable name, it searches four scopes in order:</p>
          <div class="formula">L (Local) → E (Enclosing function) → G (Global/module) → B (Built-in)</div>
          <p>Local variables shadow outer ones. The <code>global</code> keyword lets a function write to module scope; <code>nonlocal</code> lets an inner function write to its enclosing function's scope. In practice, you rarely need either — prefer returning values over mutating outer state.</p>

          <h4>Closures</h4>
          <p>A <strong>closure</strong> is a function that remembers variables from its enclosing scope even after that scope has finished. This is how decorators, callbacks, and factory functions work:</p>
          <div class="formula">def make_multiplier(factor):
    def multiply(x):
        return x * factor   # "factor" is captured from enclosing scope
    return multiply
double = make_multiplier(2)   # double remembers factor=2 forever</div>

          <h4>*args and **kwargs Internals</h4>
          <p><code>*args</code> collects extra positional arguments into a tuple. <code>**kwargs</code> collects extra keyword arguments into a dict. Together they let a function accept literally any combination of arguments — which is how decorators wrap functions without knowing their signatures, and how <code>super().__init__(**kwargs)</code> chains constructors in PyTorch modules.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Lambda functions are faster than regular functions."</div>
          <p><strong>✅ Reality:</strong> Lambdas compile to the exact same bytecode as an equivalent <code>def</code>. They're syntactic sugar for one-expression functions, not an optimization. Use them for short throwaway callbacks (<code>sorted(items, key=lambda x: x[1])</code>); use <code>def</code> for anything that needs a name, a docstring, or multiple statements.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Recursion is always elegant and efficient."</div>
          <p><strong>✅ Reality:</strong> Python has a default recursion limit of 1,000 frames (no tail-call optimization). Deep recursion causes <code>RecursionError</code>. For most problems, an iterative approach with an explicit stack is both safer and faster in Python. Use recursion when the structure is naturally recursive (trees, parsers) and depth is bounded.</p>

          <h4>Historical Context</h4>
          <p>Functions as first-class objects — passable as arguments, returnable as values — came to Python from Lisp via Guido van Rossum's design philosophy. Lambda was added in Python 1.0 (1994) but intentionally restricted to single expressions to discourage complex anonymous functions. Decorators (@syntax) were added in Python 2.4 (2004) via PEP 318, inspired by Java annotations. The <code>*args/**kwargs</code> convention became the backbone of Python's flexible function signatures and is why ML libraries can offer 30-parameter constructors that remain usable.</p>
        </div>
      </details>
    `));
  },
};
