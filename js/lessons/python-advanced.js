// Lesson: Advanced Python — comprehensions (interactive builder), OOP, exceptions,
// files, generators, decorators
import { h, html, pyCode, demoPanel, selectBox, statRow } from '../utils.js';

const SOURCE = [3, 8, 1, 12, 7, 20, 5, 16];
const TRANSFORMS = {
  'x': { label: 'x (keep as is)', fn: x => x },
  'x * 2': { label: 'x * 2', fn: x => x * 2 },
  'x ** 2': { label: 'x ** 2', fn: x => x ** 2 },
  'x - 10': { label: 'x - 10', fn: x => x - 10 },
};
const FILTERS = {
  '': { label: '(no filter)', fn: () => true },
  'x % 2 == 0': { label: 'x % 2 == 0  (even)', fn: x => x % 2 === 0 },
  'x > 6': { label: 'x > 6', fn: x => x > 6 },
  'x < 10': { label: 'x < 10', fn: x => x < 10 },
};

export default {
  id: 'python-advanced',
  emoji: '🧙',
  title: 'Advanced Python',
  level: 'Intermediate',
  blurb: 'Comprehensions, classes, exceptions, files, generators, decorators — the tools that make code Pythonic.',

  render(root) {
    root.appendChild(html(`
      <p>You can now write working Python. This lesson adds the tools that make code <em>elegant</em> — the idioms that fill every real ML codebase, so you can read (and write) like a native.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Comprehensions — loops as expressions:</strong> <code>[expr for x in items if cond]</code> creates a new list by filtering and transforming in a single readable line. The same pattern works for sets (<code>{}</code>), dicts (<code>{k: v for ...}</code>), and generators (<code>()</code>).</li>
          <li><strong>Classes — bundling data with behavior:</strong> <code>class Model:</code> groups related data (attributes) and functions (methods) into one unit. <code>__init__</code> runs at creation; <code>self</code> refers to the current instance. Inheritance lets you reuse and override — every PyTorch model inherits from <code>nn.Module</code>.</li>
          <li><strong>Exceptions — structured error handling:</strong> <code>try/except/finally</code> catches errors without crashing. <code>raise</code> signals problems explicitly. This is how ML code handles bad data, missing files, and GPU errors gracefully.</li>
          <li><strong>Generators — lazy evaluation:</strong> <code>yield</code> makes a function produce values one at a time, on demand, without storing the full sequence in memory. This is how you stream a 100 GB dataset through 8 GB of RAM.</li>
          <li><strong>Decorators — functions that wrap functions:</strong> <code>@decorator</code> transforms a function at definition time — adding timing, caching, or gradient control. You'll meet <code>@property</code>, <code>@torch.no_grad()</code>, and <code>@app.route()</code> everywhere in production ML.</li>
        </ol>
      </div>

      <h3>List comprehensions: loops in one line</h3>
      <p>The most Pythonic construct of all. <code>[expression for x in items if condition]</code> builds a new list in a single readable line. Assemble one live:</p>
    `));

    // ---- comprehension builder ----
    let tKey = 'x * 2', fKey = 'x % 2 == 0';
    const codeEl = h('div', {
      style: {
        fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.95rem', color: '#4fd6c5',
        background: '#070a12', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '12px 16px', margin: '4px 0 12px',
      },
    });
    const loopEl = h('div');
    const flowBox = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', margin: '12px 0' } });
    const stats = statRow(['Input length', 'Output length']);

    function render() {
      const t = TRANSFORMS[tKey], f = FILTERS[fKey];
      const result = SOURCE.filter(f.fn).map(t.fn);
      codeEl.textContent = `result = [${tKey} for x in nums${fKey ? ' if ' + fKey : ''}]   # → [${result.join(', ')}]`;
      flowBox.innerHTML = '';
      SOURCE.forEach(x => {
        const passes = f.fn(x);
        const col = h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } });
        col.appendChild(h('div', {
          style: {
            width: '40px', height: '34px', display: 'grid', placeItems: 'center', borderRadius: '8px',
            fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.85rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#8b96b2',
          },
        }, String(x)));
        col.appendChild(h('div', { style: { fontSize: '0.72rem', color: passes ? '#4ade80' : '#f87171' } }, passes ? '↓' : '✗'));
        col.appendChild(h('div', {
          style: {
            width: '40px', height: '34px', display: 'grid', placeItems: 'center', borderRadius: '8px',
            fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.85rem', transition: 'all 0.3s',
            background: passes ? 'rgba(109,141,255,0.22)' : 'transparent',
            border: passes ? '1px solid var(--accent)' : '1px dashed var(--border)',
            color: passes ? '#eaf0fa' : 'transparent',
          },
        }, passes ? String(t.fn(x)) : '·'));
        flowBox.appendChild(col);
      });
      loopEl.innerHTML = '';
      loopEl.appendChild(pyCode(
`# the same thing as an ordinary loop:
result = []
for x in nums:${fKey ? `\n    if ${fKey}:` : ''}
${fKey ? '        ' : '    '}result.append(${tKey})`,
        { title: 'loop_equivalent.py' }));
      stats.set('Input length', String(SOURCE.length));
      stats.set('Output length', String(result.length));
    }
    const tSel = selectBox('Transform', Object.entries(TRANSFORMS).map(([v, o]) => ({ value: v, label: o.label })), v => { tKey = v; render(); }, 'x * 2');
    const fSel = selectBox('Filter', Object.entries(FILTERS).map(([v, o]) => ({ value: v, label: o.label })), v => { fKey = v; render(); }, 'x % 2 == 0');

    root.appendChild(demoPanel(
      'Comprehension builder',
      'nums = [3, 8, 1, 12, 7, 20, 5, 16]. Top row: input. Middle: does it pass the filter? Bottom: the transformed survivors.',
      h('div', { class: 'controls', style: { marginTop: 0, marginBottom: '10px' } }, [tSel.el, fSel.el]),
      codeEl, flowBox, loopEl, stats.el,
    ));

    root.appendChild(html(`<h3>Classes: your own types (OOP)</h3>
      <p>A <strong>class</strong> bundles data and the functions that operate on it into one unit — an <em>object</em>. Every model you've used, <code>LogisticRegression()</code>, <code>MLP()</code>, is a class:</p>`));

    root.appendChild(pyCode(
`class Perceptron:
    def __init__(self, lr=0.1):        # constructor: runs at creation
        self.w = 0.0                   # self = THIS object's data
        self.b = 0.0
        self.lr = lr

    def predict(self, x):              # a method
        return 1 if self.w * x + self.b > 0 else 0

    def train_step(self, x, y):
        error = y - self.predict(x)
        self.w += self.lr * error * x
        self.b += self.lr * error

model = Perceptron(lr=0.5)             # create an instance
model.train_step(2.0, 1)
print(model.predict(2.0), model.w)`,
      { title: 'perceptron.py', output: '1 1.0' }));

    root.appendChild(html(`
      <ul>
        <li><code>__init__</code> runs when you create the object; <code>self</code> means "this particular instance".</li>
        <li>Two <code>Perceptron()</code> objects have independent <code>w</code> and <code>b</code> — data travels with the object.</li>
        <li><strong>Inheritance</strong>: <code>class LSTM(RNN):</code> reuses everything from RNN and overrides what differs. PyTorch models all inherit from <code>nn.Module</code> this way.</li>
      </ul>
      <h3>Exceptions: when things go wrong</h3>`));

    root.appendChild(pyCode(
`def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("warning: divide by zero, returning 0")
        return 0.0
    finally:
        pass          # finally ALWAYS runs — great for cleanup

print(safe_divide(10, 2))
print(safe_divide(10, 0))

# raise your own errors to fail loudly and clearly
def set_learning_rate(lr):
    if lr <= 0:
        raise ValueError(f"lr must be positive, got {lr}")`,
      { title: 'exceptions.py', output: '5.0\nwarning: divide by zero, returning 0\n0.0' }));

    root.appendChild(html(`<h3>Files: reading & writing</h3>`));
    root.appendChild(pyCode(
`# 'with' auto-closes the file, even if an error occurs
with open("results.txt", "w") as f:
    f.write("epoch,loss\\n")
    f.write("1,0.693\\n")

with open("results.txt") as f:
    for line in f:                 # files are iterable line by line
        print(line.strip())

import json                        # and structured data:
config = {"lr": 0.001, "epochs": 50}
with open("config.json", "w") as f:
    json.dump(config, f)`,
      { title: 'files.py', output: 'epoch,loss\n1,0.693' }));

    root.appendChild(html(`<h3>Generators: lazy sequences</h3>
      <p><code>yield</code> makes a function produce values <em>one at a time, on demand</em> — nothing is stored. This is how you stream a 100 GB dataset through 8 GB of RAM:</p>`));

    root.appendChild(pyCode(
`def batches(data, size):
    for i in range(0, len(data), size):
        yield data[i:i + size]        # pause here, hand out one batch

for batch in batches(list(range(10)), size=4):
    print(batch)
# PyTorch's DataLoader is exactly this idea, industrial-strength`,
      { title: 'generators.py', output: '[0, 1, 2, 3]\n[4, 5, 6, 7]\n[8, 9]' }));

    root.appendChild(html(`<h3>Decorators: functions that wrap functions</h3>`));
    root.appendChild(pyCode(
`import time

def timed(func):                       # takes a function...
    def wrapper(*args, **kwargs):
        t0 = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - t0:.3f}s")
        return result
    return wrapper                     # ...returns a wrapped version

@timed                                 # sugar for: slow = timed(slow)
def slow():
    time.sleep(0.5)

slow()
# you'll meet these as @property, @torch.no_grad(), @app.route(...)`,
      { title: 'decorators.py', output: 'slow took 0.501s' }));

    root.appendChild(html(`
      <h3>Modules: organizing bigger programs</h3>
      <table class="info-table">
        <tr><th>Pattern</th><th>Meaning</th></tr>
        <tr><td><code>import math</code> → <code>math.sqrt(2)</code></td><td>Standard library, namespaced</td></tr>
        <tr><td><code>from utils import accuracy</code></td><td>Pull one name from your own utils.py</td></tr>
        <tr><td><code>import numpy as np</code></td><td>The alias convention — np, pd, plt, torch</td></tr>
        <tr><td><code>if __name__ == "__main__":</code></td><td>"Only run this when executed directly, not when imported" — bottom of every script</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">🎓 You now read Python natively</div>
      Comprehensions, classes, context managers, generators, decorators — open any real ML repository (scikit-learn, nanoGPT) and every construct you see is one of these. Nothing in professional Python code is foreign to you anymore. Next stop: <strong>NumPy</strong>, where Python meets serious math.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — dunder methods, descriptors, and metaclasses</summary>
        <div class="deep-dive-body">
          <h4>Dunder (Magic) Methods</h4>
          <p>Python's double-underscore methods let your classes integrate with the language itself:</p>
          <div class="formula">__init__ (constructor) · __repr__ (debug string) · __len__ (len()) · __getitem__ (indexing)
__add__ (+ operator) · __iter__ (for loops) · __call__ (make instances callable) · __enter__/__exit__ (with blocks)</div>
          <p>PyTorch's <code>nn.Module</code> uses <code>__call__</code> to wrap <code>forward()</code> with hooks and gradient tracking. Datasets use <code>__len__</code> and <code>__getitem__</code> for DataLoader integration. When you write <code>model(x)</code>, you're calling <code>model.__call__(x)</code> which calls <code>model.forward(x)</code>.</p>

          <h4>Context Managers</h4>
          <p>The <code>with</code> statement ensures cleanup happens even if an error occurs. The pattern: <code>__enter__</code> runs at the start, <code>__exit__</code> runs at the end (even during exceptions). You've seen <code>with open(file)</code> — in ML, you'll see <code>with torch.no_grad():</code> (disable gradient tracking for inference) and <code>with torch.cuda.amp.autocast():</code> (mixed precision training).</p>

          <h4>The Descriptor Protocol</h4>
          <p><code>@property</code> turns a method into an attribute — <code>model.num_params</code> instead of <code>model.num_params()</code>. Under the hood, it uses Python's descriptor protocol: objects with <code>__get__</code>, <code>__set__</code>, or <code>__delete__</code> methods control attribute access on the class they belong to. This is how PyTorch's <code>nn.Parameter</code> registers tensors for gradient tracking when you assign them as attributes.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "List comprehensions are just a shortcut for loops."</div>
          <p><strong>✅ Reality:</strong> Comprehensions are actually <em>faster</em> than equivalent for-loops because Python optimizes them internally (the loop runs in C, not in the interpreter). They're also more readable once you're fluent — a single line that says "transform these items" is clearer than four lines of loop setup. But nested comprehensions (<code>[[... for ...] for ...]</code>) quickly become unreadable — use regular loops when nesting goes deeper than two levels.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "You need to understand metaclasses to use Python effectively."</div>
          <p><strong>✅ Reality:</strong> Metaclasses (classes that create classes) are Python's deepest abstraction. In 10+ years of ML code, you'll almost never write one. They power framework internals — Django's ORM, SQLAlchemy, some PyTorch registry patterns — but as a user, you just inherit from the base class and everything works.</p>

          <h4>Historical Context</h4>
          <p>List comprehensions were added in Python 2.0 (2000), inspired by Haskell. Generator expressions came in 2.4 (2004). Decorators (@syntax) arrived in 2.4 via PEP 318. The <code>with</code> statement was added in 2.5 (2006). Type hints (PEP 484) arrived in 3.5 (2015). Each addition made Python more expressive without sacrificing readability — the core design principle Guido van Rossum maintained throughout: "There should be one — and preferably only one — obvious way to do it."</p>
        </div>
      </details>
    `));
  },
};
