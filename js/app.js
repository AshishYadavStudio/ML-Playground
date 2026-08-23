// ============ ML Playground — app shell, router, navigation ============
import { h } from './utils.js';

import intro from './lessons/intro.js';
import supervisedLearning from './lessons/supervised-learning.js';
import unsupervisedLearning from './lessons/unsupervised-learning.js';
import reinforcementLearning from './lessons/reinforcement-learning.js';
import dataFeatures from './lessons/data-features.js';
import featureEngineering from './lessons/feature-engineering.js';
import linearRegression from './lessons/linear-regression.js';
import gradientDescent from './lessons/gradient-descent.js';
import overfitting from './lessons/overfitting.js';
import crossValidation from './lessons/cross-validation.js';
import bayesTheorem from './lessons/bayes-theorem.js';
import metrics from './lessons/metrics.js';
import pythonIntro from './lessons/python-intro.js';
import pythonVariables from './lessons/python-variables.js';
import pythonCollections from './lessons/python-collections.js';
import pythonControl from './lessons/python-control.js';
import pythonFunctions from './lessons/python-functions.js';
import pythonAdvanced from './lessons/python-advanced.js';
import pythonBasics from './lessons/python-basics.js';
import numpy from './lessons/numpy.js';
import pandas from './lessons/pandas.js';
import dataviz from './lessons/dataviz.js';
import mlCode from './lessons/ml-code.js';
import { QUIZZES } from './quizzes.js';
import { EXAMPLES } from './examples.js';
import { GISCUS, NEWSLETTER } from './config.js';
let pyCell = null;
import { GAMES } from '../games/games-data.js';
import logisticRegression from './lessons/logistic-regression.js';
import knn from './lessons/knn.js';
import svm from './lessons/svm.js';
import naiveBayes from './lessons/naive-bayes.js';
import decisionTrees from './lessons/decision-trees.js';
import ensembleMethods from './lessons/ensemble-methods.js';
import kmeans from './lessons/kmeans.js';
import pca from './lessons/pca.js';
import neuralNetworks from './lessons/neural-networks.js';
import activations from './lessons/activations.js';
import backprop from './lessons/backprop.js';
import optimizers from './lessons/optimizers.js';
import autoencoders from './lessons/autoencoders.js';
import cnn from './lessons/cnn.js';
import rnn from './lessons/rnn.js';
import transformers from './lessons/transformers.js';
import embeddings from './lessons/embeddings.js';
import generative from './lessons/generative.js';
import diffusion from './lessons/diffusion.js';
import llms from './lessons/llms.js';
import fineTuning from './lessons/fine-tuning.js';
import rag from './lessons/rag.js';
import csvSandbox from './lessons/csv-sandbox.js';

export const SECTIONS = [
  { name: '🌱 Foundations', short: 'Foundations', lessons: [intro, supervisedLearning, unsupervisedLearning, reinforcementLearning, dataFeatures, featureEngineering, bayesTheorem, linearRegression, gradientDescent, overfitting, crossValidation, metrics] },
  { name: '🐍 Python for ML', short: 'Python for ML', lessons: [pythonIntro, pythonVariables, pythonCollections, pythonControl, pythonFunctions, pythonBasics, pythonAdvanced, numpy, pandas, dataviz, mlCode, csvSandbox] },
  { name: '📊 Classical ML', short: 'Classical ML', lessons: [logisticRegression, knn, svm, naiveBayes, decisionTrees, ensembleMethods, kmeans, pca] },
  { name: '🧠 Deep Learning', short: 'Deep Learning', lessons: [neuralNetworks, activations, backprop, optimizers, autoencoders] },
  { name: '🚀 Advanced', short: 'Advanced & GenAI', lessons: [cnn, rnn, transformers, embeddings, generative, diffusion, llms, fineTuning, rag] },
];

const ALL = SECTIONS.flatMap(s => s.lessons.map(l => ({ ...l, sectionName: s.name })));

// ---- URL model: real paths (SEO-friendly) with hash-URL backwards compat ----
// Custom domain (mlplayground.co.in) and localhost both serve at /.
// The old /ML-Playground/ prefix (project-pages URL) is kept as a redirect
// for any inbound links from before the custom domain was set up.
const BASE_PATH = (function () {
  const p = location.pathname;
  if (p.startsWith('/ML-Playground/') || p === '/ML-Playground') return '/ML-Playground';
  return '';
})();
const lessonUrl = id => id === 'home' ? BASE_PATH + '/' : BASE_PATH + '/' + id + '/';
const gamesUrl = slug => BASE_PATH + '/games/' + (slug ? slug + '/' : '');
const ALL_IDS = new Set(ALL.map(l => l.id));
function currentLessonId() {
  // 1) initial-page marker (set by generated <lesson>/index.html)
  if (window.__initialLesson && ALL_IDS.has(window.__initialLesson)) {
    const id = window.__initialLesson;
    window.__initialLesson = null; // consume once
    return id;
  }
  // 2) legacy hash URL — redirect to real path
  if (location.hash.startsWith('#/')) {
    const id = location.hash.slice(2);
    if (id && id !== 'home' && ALL_IDS.has(id)) {
      history.replaceState(null, '', lessonUrl(id));
      return id;
    }
    if (id === 'home' || id === '') {
      history.replaceState(null, '', lessonUrl('home'));
      return 'home';
    }
  }
  // 3) real path
  let p = location.pathname;
  if (BASE_PATH && p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length);
  p = p.replace(/^\/+|\/+$/g, '');
  if (!p || p === 'index.html') return 'home';
  return ALL_IDS.has(p) ? p : 'home';
}
// Read the currently-displayed lesson id (without mutating history — used by renderNav).
function currentPathId() {
  let p = location.pathname;
  if (BASE_PATH && p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length);
  p = p.replace(/^\/+|\/+$/g, '');
  if (location.hash.startsWith('#/')) {
    const h = location.hash.slice(2);
    if (h && ALL_IDS.has(h)) return h;
    if (h === 'home' || h === '') return 'home';
  }
  if (!p || p === 'index.html') return 'home';
  return ALL_IDS.has(p) ? p : 'home';
}
function navigateTo(id, replace = false) {
  const url = lessonUrl(id);
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  route();
}

// ---- concept cross-linking ----
// Distinctive concept phrases → the lesson that explains them. The first mention
// of each concept in a lesson's prose becomes a clickable link to its full lesson.
// [term, lessonId, caseSensitive?]. Acronyms are case-sensitive to avoid false hits.
const CONCEPTS = [
  ['supervised learning', 'supervised-learning'],
  ['unsupervised learning', 'unsupervised-learning'],
  ['reinforcement learning', 'reinforcement-learning'],
  ['self-supervised', 'llms'],
  ['clustering', 'unsupervised-learning'],
  ['anomaly detection', 'unsupervised-learning'],
  ['classification', 'supervised-learning'],
  ['q-learning', 'reinforcement-learning'],
  ['RLHF', 'reinforcement-learning', true],
  ['linear regression', 'linear-regression'],
  ['logistic regression', 'logistic-regression'],
  ['gradient descent', 'gradient-descent'],
  ['backpropagation', 'backprop'],
  ['overfitting', 'overfitting'],
  ['overfit', 'overfitting'],
  ['regularization', 'overfitting'],
  ['cross-entropy', 'logistic-regression'],
  ['activation function', 'activations'],
  ['neural network', 'neural-networks'],
  ['decision tree', 'decision-trees'],
  ['random forest', 'decision-trees'],
  ['support vector machine', 'svm'],
  ['naive bayes', 'naive-bayes'],
  ['principal component analysis', 'pca'],
  ['k-means', 'kmeans'],
  ['k-nearest neighbors', 'knn'],
  ['nearest neighbor', 'knn'],
  ['convolutional', 'cnn'],
  ['convolution', 'cnn'],
  ['recurrent', 'rnn'],
  ['self-attention', 'transformers'],
  ['attention', 'transformers'],
  ['transformer', 'transformers'],
  ['embedding', 'embeddings'],
  ['diffusion', 'generative'],
  ['autoencoder', 'generative'],
  ['vectorization', 'numpy'],
  ['broadcasting', 'numpy'],
  ['dataframe', 'pandas'],
  ['confusion matrix', 'metrics'],
  ['feature scaling', 'data-features'],
  ['standardization', 'data-features'],
  ['sigmoid', 'activations'],
  ['softmax', 'activations'],
  ['momentum', 'optimizers'],
  ['comprehension', 'python-advanced'],
  ['ensemble', 'ensemble-methods'],
  ['random forest', 'ensemble-methods'],
  ['random forests', 'ensemble-methods'],
  ['gradient boosting', 'ensemble-methods'],
  ['boosting', 'ensemble-methods'],
  ['bagging', 'ensemble-methods'],
  ['cross-validation', 'cross-validation'],
  ['k-fold', 'cross-validation'],
  ['bayes theorem', 'bayes-theorem'],
  ["bayes' theorem", 'bayes-theorem'],
  ['posterior', 'bayes-theorem'],
  ['prior probability', 'bayes-theorem'],
  ['feature engineering', 'feature-engineering'],
  ['one-hot', 'feature-engineering'],
  ['target encoding', 'feature-engineering'],
  ['autoencoder', 'autoencoders'],
  ['autoencoders', 'autoencoders'],
  ['bottleneck', 'autoencoders'],
  ['denoising autoencoder', 'autoencoders'],
  ['diffusion model', 'diffusion'],
  ['diffusion models', 'diffusion'],
  ['stable diffusion', 'diffusion'],
  ['fine-tune', 'fine-tuning'],
  ['fine-tuning', 'fine-tuning'],
  ['LoRA', 'fine-tuning', true],
  ['QLoRA', 'fine-tuning', true],
  ['retrieval-augmented', 'rag'],
  ['vector database', 'rag'],
  ['RAG', 'rag', true],
  // case-sensitive acronyms / proper names
  ['SVM', 'svm', true],
  ['CNN', 'cnn', true],
  ['RNN', 'rnn', true],
  ['LSTM', 'rnn', true],
  ['KNN', 'knn', true],
  ['PCA', 'pca', true],
  ['GAN', 'generative', true],
  ['LLM', 'llms', true],
  ['ReLU', 'activations', true],
  ['MSE', 'linear-regression', true],
  ['AUC', 'metrics', true],
  ['ROC', 'metrics', true],
  ['NumPy', 'numpy', true],
  ['Adam', 'optimizers', true],
  ['SGD', 'optimizers', true],
  ['XGBoost', 'ensemble-methods', true],
  ['LightGBM', 'ensemble-methods', true],
  ['CatBoost', 'ensemble-methods', true],
  ['VAE', 'autoencoders', true],
  ['MAE', 'autoencoders', true],
  ['DDPM', 'diffusion', true],
  ['RAG', 'rag', true],
  ['bring your own data', 'csv-sandbox'],
  ['csv sandbox', 'csv-sandbox'],
  ['upload csv', 'csv-sandbox'],
];

const PYTHON_STARTERS = {
  'python-intro': `# Your first Python program
name = "ML Playground"
print(f"Hello from {name}!")
print(f"2 + 3 = {2 + 3}")`,

  'python-variables': `# Try different variable types
x = 42
pi = 3.14159
name = "neural network"
is_training = True

print(type(x), x)
print(type(pi), pi)
print(type(name), name)
print(type(is_training), is_training)`,

  'python-collections': `# Lists, dicts, and comprehensions
scores = [85, 92, 78, 95, 88]
print("Scores:", scores)
print("Average:", sum(scores) / len(scores))
print("Top 3:", sorted(scores, reverse=True)[:3])

student = {"name": "Alex", "grade": "A", "score": 95}
for key, val in student.items():
    print(f"  {key}: {val}")`,

  'python-control': `# Loops and conditionals
for i in range(1, 6):
    if i % 2 == 0:
        print(f"{i} is even")
    else:
        print(f"{i} is odd")

# While loop with break
n = 1
while True:
    if n * n > 50:
        print(f"{n}^2 = {n*n} > 50, stopping")
        break
    n += 1`,

  'python-functions': `# Define and use functions
def greet(name, excited=False):
    msg = f"Hello, {name}!"
    return msg.upper() if excited else msg

print(greet("World"))
print(greet("ML", excited=True))

# Lambda + map
nums = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, nums))
print("Squared:", squared)`,

  'python-basics': `# Putting it together: a mini data pipeline
data = [
    {"name": "Alice", "score": 92},
    {"name": "Bob", "score": 85},
    {"name": "Carol", "score": 97},
    {"name": "Dave", "score": 78},
]

avg = sum(d["score"] for d in data) / len(data)
print(f"Class average: {avg:.1f}")

top = [d["name"] for d in data if d["score"] > avg]
print(f"Above average: {', '.join(top)}")`,

  'python-advanced': `# Generators and decorators
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

fibs = list(fibonacci(10))
print("First 10 Fibonacci:", fibs)

# List comprehension with condition
evens = [x for x in fibs if x % 2 == 0]
print("Even ones:", evens)`,

  'numpy': `import numpy as np

# Vectorized operations — no loops needed
a = np.array([1, 2, 3, 4, 5])
b = np.array([10, 20, 30, 40, 50])
print("a + b =", a + b)
print("a * b =", a * b)
print("mean(a) =", np.mean(a))

# Broadcasting: matrix + vector
M = np.arange(12).reshape(3, 4)
print("\\nMatrix:\\n", M)
print("\\nRow means:", M.mean(axis=1))`,

  'pandas': `import numpy as np

# Simulated pandas-like operations with numpy
# (pandas takes ~30s to load; numpy shows the same ideas)
names = ["Alice", "Bob", "Carol", "Dave", "Eve"]
scores = np.array([92, 85, 97, 78, 91])
hours = np.array([12, 8, 15, 6, 11])

print("Student data:")
for n, s, h in zip(names, scores, hours):
    print(f"  {n}: score={s}, hours={h}")

print(f"\\nAverage score: {scores.mean():.1f}")
print(f"Score std dev: {scores.std():.1f}")
print(f"Correlation (hours vs score): {np.corrcoef(hours, scores)[0,1]:.3f}")`,

  'dataviz': `import numpy as np

# Generate data for a scatter plot pattern
np.random.seed(42)
n = 20
x = np.linspace(0, 10, n)
y = 2.5 * x + np.random.randn(n) * 3

print("x:", np.round(x[:5], 2), "...")
print("y:", np.round(y[:5], 2), "...")
print(f"Correlation: {np.corrcoef(x, y)[0,1]:.3f}")
print(f"Best fit: y = {np.polyfit(x, y, 1)[0]:.2f}x + {np.polyfit(x, y, 1)[1]:.2f}")`,

  'ml-code': `import numpy as np

# Mini linear regression from scratch
np.random.seed(42)
X = np.random.rand(50) * 10
y = 3 * X + 7 + np.random.randn(50) * 2

# Gradient descent
w, b, lr = 0.0, 0.0, 0.01
for epoch in range(200):
    pred = w * X + b
    error = pred - y
    w -= lr * (2/len(X)) * np.dot(error, X)
    b -= lr * (2/len(X)) * error.sum()

print(f"Learned: y = {w:.2f}x + {b:.2f}")
print(f"True:    y = 3.00x + 7.00")
print(f"Final MSE: {np.mean((w*X + b - y)**2):.3f}")`,
};

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CONCEPT_TERMS = CONCEPTS
  .map(([term, id, cs]) => ({
    term, id, cs: !!cs,
    re: new RegExp('\\b' + escapeRe(term) + (cs ? '(s)?' : '(s|es)?') + '\\b', cs ? '' : 'i'),
  }))
  .sort((a, b) => b.term.length - a.term.length);

// tags/classes whose text should never be auto-linked
const SKIP_TAGS = new Set(['A', 'CODE', 'PRE', 'BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'H1', 'H2', 'H3', 'H4']);
const SKIP_CLASSES = ['demo', 'code-block', 'formula', 'callout-title', 'demo-title', 'demo-hint', 'code-output', 'quiz'];

function isLinkable(node, root) {
  for (let el = node.parentNode; el && el !== root; el = el.parentNode) {
    if (el.nodeType !== 1) continue;
    if (SKIP_TAGS.has(el.tagName)) return false;
    for (const c of SKIP_CLASSES) if (el.classList && el.classList.contains(c)) return false;
  }
  return true;
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) if (n.nodeValue.trim().length > 2 && isLinkable(n, root)) nodes.push(n);
  return nodes;
}

/** Wrap the first mention of each distinctive concept in a link to its lesson. */
function crossLinkConcepts(root, currentId) {
  const usedTargets = new Set([currentId]); // never self-link; one link per destination
  for (const t of CONCEPT_TERMS) {
    if (usedTargets.has(t.id)) continue;
    for (const node of collectTextNodes(root)) {
      const m = t.re.exec(node.nodeValue);
      if (!m) continue;
      const matched = m[0];
      const before = node.nodeValue.slice(0, m.index);
      const after = node.nodeValue.slice(m.index + matched.length);
      const a = document.createElement('a');
      a.href = lessonUrl(t.id);
      a.className = 'concept-link';
      a.textContent = matched;
      a.title = 'Open lesson: ' + matched;
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(a);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      usedTargets.add(t.id);
      break;
    }
  }
}

// ---- progress (localStorage) ----
const LS_KEY = 'mlplayground-progress';
function getProgress() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function setDone(id, done) {
  const p = getProgress();
  if (done) p[id] = true; else delete p[id];
  localStorage.setItem(LS_KEY, JSON.stringify(p));
  renderNav();
}

// ---- cleanup hooks for lesson animations ----
let cleanups = [];
export function onLeave(fn) { cleanups.push(fn); }

// ---- navigation ----
const navEl = document.getElementById('nav');
const contentEl = document.getElementById('content');
const sidebar = document.getElementById('sidebar');
const readProgress = document.getElementById('read-progress');

function renderNav() {
  const progress = getProgress();
  const current = currentPathId();
  navEl.innerHTML = '';
  navEl.appendChild(h('a', {
    class: 'nav-link' + (current === 'home' ? ' active' : ''),
    href: lessonUrl('home'),
  }, [h('span', { class: 'nav-emoji' }, '🏠'), 'Home / Curriculum']));

  for (const sec of SECTIONS) {
    const box = h('div', { class: 'nav-section' }, [
      h('div', { class: 'nav-section-title' }, sec.name),
    ]);
    for (const l of sec.lessons) {
      box.appendChild(h('a', {
        class: 'nav-link' + (current === l.id ? ' active' : '') + (progress[l.id] ? ' done' : ''),
        href: lessonUrl(l.id),
      }, [h('span', { class: 'nav-emoji' }, l.emoji), l.title, h('span', { class: 'check' }, '✓')]));
    }
    navEl.appendChild(box);
  }
  const doneCount = ALL.filter(l => progress[l.id]).length;
  document.getElementById('progress-fill').style.width = (doneCount / ALL.length * 100) + '%';
  document.getElementById('progress-text').textContent = `${doneCount} / ${ALL.length} lessons completed`;
}

// ---- reading progress bar ----
function updateReadProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const frac = max > 0 ? window.scrollY / max : 0;
  readProgress.style.width = (frac * 100).toFixed(2) + '%';
}
window.addEventListener('scroll', updateReadProgress, { passive: true });

// ---- scroll-reveal ----
const revealObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  }
}, { threshold: 0.08 });
function reveal(el, delay = 0) {
  el.classList.add('reveal');
  if (delay) el.style.transitionDelay = delay + 'ms';
  revealObserver.observe(el);
  return el;
}

// ---- hero neural-network animation ----
function startHeroAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, raf = null, alive = true;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  function size() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas.parentElement);

  // network layout: layered like a neural net, drifting gently
  const layers = 6;
  const nodes = [];
  for (let l = 0; l < layers; l++) {
    const count = 4 + Math.round(Math.sin(l / (layers - 1) * Math.PI) * 4);
    for (let i = 0; i < count; i++) {
      nodes.push({
        l,
        fx: 0.06 + l / (layers - 1) * 0.88,
        fy: (i + 0.5 + (Math.random() - 0.5) * 0.3) / count,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        r: 1.6 + Math.random() * 1.8,
      });
    }
  }
  const edges = [];
  for (const a of nodes) {
    const next = nodes.filter(n => n.l === a.l + 1);
    for (const b of next) if (Math.random() < 0.45) edges.push({ a, b, pulse: Math.random(), speed: 0.001 + Math.random() * 0.003 });
  }

  function pos(n, t) {
    return {
      x: n.fx * W + Math.sin(t * 0.0004 * n.speed + n.phase) * 10,
      y: n.fy * H + Math.cos(t * 0.0005 * n.speed + n.phase) * 12,
    };
  }

  function frame(t) {
    if (!alive) return;
    ctx.clearRect(0, 0, W, H);
    // edges
    for (const e of edges) {
      const pa = pos(e.a, t), pb = pos(e.b, t);
      ctx.strokeStyle = 'rgba(109,141,255,0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      // traveling pulse
      e.pulse += e.speed;
      if (e.pulse > 1) e.pulse = 0;
      const px = pa.x + (pb.x - pa.x) * e.pulse;
      const py = pa.y + (pb.y - pa.y) * e.pulse;
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79,214,197,0.55)';
      ctx.fill();
    }
    // nodes
    for (const n of nodes) {
      const p = pos(n, t);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, n.r * 5);
      glow.addColorStop(0, 'rgba(109,141,255,0.55)');
      glow.addColorStop(1, 'rgba(109,141,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(183,161,255,0.9)';
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  onLeave(() => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); });
}

// ---- Real-world examples block ----
function buildExamples(lessonId) {
  const exs = EXAMPLES[lessonId];
  if (!exs || !exs.length) return null;
  const wrap = h('div', { class: 'examples' }, [
    h('div', { class: 'examples-head' }, [
      h('span', { class: 'examples-badge' }, '🌍 In the real world'),
      h('h3', {}, 'How this shows up in everyday life'),
    ]),
    h('div', { class: 'examples-grid' }, exs.map(ex => h('div', { class: 'example-card' }, [
      h('div', { class: 'example-icon' }, ex.icon),
      h('div', { class: 'example-body' }, [
        h('h4', {}, ex.title),
        h('p', { class: 'example-story', html: ex.story }),
        h('div', { class: 'example-connect' }, [
          h('span', { class: 'connect-arrow' }, '↳ '),
          ex.connection,
        ]),
      ]),
    ]))),
  ]);
  return wrap;
}

// ---- Games highlight (homepage) ----
function buildGamesHighlight() {
  const featured = GAMES.slice(0, 6);
  return h('div', { class: 'games-highlight' }, [
    h('div', { class: 'games-highlight-head' }, [
      h('div', {}, [
        h('span', { class: 'games-highlight-badge' }, '🎮 Learn by playing'),
        h('h3', {}, '13 games, one per concept'),
        h('p', {}, "Tune a learning rate, wire a neuron by hand, out-navigate a Q-learning agent. Each game targets exactly one idea — play it, then the lesson clicks."),
      ]),
      h('a', { class: 'games-highlight-all', href: gamesUrl() }, 'See all 13 games →'),
    ]),
    h('div', { class: 'lesson-grid' }, featured.map(g => h('a', { class: 'lesson-card', href: gamesUrl(g.slug) }, [
      h('div', { class: 'lc-top' }, [h('div', { class: 'lc-emoji' }, g.emoji)]),
      h('h4', {}, g.title),
      h('p', {}, g.blurb),
      h('div', { class: 'lc-foot' }, [
        h('span', { class: 'level-badge level-' + g.level }, g.level),
        h('span', { class: 'lc-arrow' }, 'Play →'),
      ]),
    ]))),
  ]);
}

// ---- Sandbox highlight (homepage) ----
function buildSandboxHighlight() {
  return h('div', { class: 'sandbox-highlight' }, [
    h('div', { class: 'sandbox-highlight-head' }, [
      h('div', {}, [
        h('span', { class: 'sandbox-highlight-badge' }, '🆕 New: hands-on sandboxes'),
        h('h3', {}, 'Write real Python & train on your own data'),
        h('p', {}, "No installs, no sign-ups. Python runs in your browser via WebAssembly, and your CSV never leaves your machine. Drop in data, pick an algorithm, watch it learn."),
      ]),
    ]),
    h('div', { class: 'sandbox-highlight-cards' }, [
      h('a', { class: 'sandbox-card', href: lessonUrl('python-intro') }, [
        h('div', { class: 'sandbox-card-emoji' }, '🐍'),
        h('h4', {}, 'Python in the Browser'),
        h('p', {}, 'Every Python lesson now has a live code cell powered by Pyodide. Edit, run, experiment — real NumPy, real output, zero setup.'),
        h('span', { class: 'sandbox-card-arrow' }, 'Try it →'),
      ]),
      h('a', { class: 'sandbox-card', href: lessonUrl('csv-sandbox') }, [
        h('div', { class: 'sandbox-card-emoji' }, '📂'),
        h('h4', {}, 'Bring Your Own CSV'),
        h('p', {}, 'Drop any CSV and watch linear regression, KNN, or K-Means train live on your data. Everything stays in your browser.'),
        h('span', { class: 'sandbox-card-arrow' }, 'Open sandbox →'),
      ]),
    ]),
  ]);
}

// ---- Comments (Giscus → GitHub Discussions) ----
function buildComments(lessonId) {
  const configured = GISCUS.repoId && !GISCUS.repoId.startsWith('REPLACE_')
    && GISCUS.categoryId && !GISCUS.categoryId.startsWith('REPLACE_');

  const wrap = h('div', { class: 'comments' }, [
    h('div', { class: 'comments-head' }, [
      h('span', { class: 'comments-badge' }, '💬 Discussion & feedback'),
      h('h3', {}, 'Questions, corrections, or ideas?'),
      h('p', { class: 'comments-sub' }, configured
        ? 'Comments are stored as GitHub Discussions in this project\'s repo — one thread per lesson. Sign in with GitHub to post; no other account needed.'
        : 'Discussion is being set up. In the meantime, you can share feedback by opening an issue on GitHub.'),
    ]),
    h('div', { class: 'comments-body', id: 'giscus-mount' }),
  ]);

  const mount = wrap.querySelector('#giscus-mount');
  if (!configured) {
    mount.appendChild(h('a', {
      class: 'comments-fallback',
      href: 'https://github.com/' + GISCUS.repo + '/issues/new?title=Feedback+on+lesson%3A+' + encodeURIComponent(lessonId) + '&labels=feedback',
      target: '_blank', rel: 'noopener',
    }, ['📮 Send feedback via GitHub Issue', h('span', { class: 'arrow' }, '→')]));
    return wrap;
  }

  // Inject Giscus loader script — one thread per lesson id
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.setAttribute('data-repo', GISCUS.repo);
  s.setAttribute('data-repo-id', GISCUS.repoId);
  s.setAttribute('data-category', GISCUS.category);
  s.setAttribute('data-category-id', GISCUS.categoryId);
  s.setAttribute('data-mapping', 'specific');
  s.setAttribute('data-term', 'lesson:' + lessonId);
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'top');
  s.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
  s.setAttribute('data-lang', 'en');
  s.setAttribute('data-loading', 'lazy');
  s.crossOrigin = 'anonymous';
  s.async = true;
  mount.appendChild(s);
  return wrap;
}

function syncCommentsTheme(theme) {
  const frame = document.querySelector('iframe.giscus-frame');
  if (frame && frame.contentWindow) {
    frame.contentWindow.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
  }
}

// ---- "Check your understanding" quiz ----
function buildQuiz(lessonId) {
  const qs = QUIZZES[lessonId];
  if (!qs || !qs.length) return null;
  let answeredCount = 0, correctCount = 0;
  const scoreEl = h('div', { class: 'quiz-score' }, `Answer all ${qs.length} to check your understanding`);

  const wrap = h('div', { class: 'quiz' }, [
    h('div', { class: 'quiz-head' }, [
      h('h3', {}, '🧪 Check your understanding'),
      scoreEl,
    ]),
  ]);

  qs.forEach((item, qi) => {
    let answered = false;
    const why = h('div', { class: 'quiz-why' }, item.why);
    const optEls = [];
    const opts = h('div', { class: 'quiz-opts' }, item.opts.map((opt, oi) => {
      const btn = h('button', { class: 'quiz-opt' }, opt);
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        answeredCount++;
        if (oi === item.correct) { correctCount++; btn.classList.add('correct'); }
        else { btn.classList.add('wrong'); optEls[item.correct].classList.add('correct'); }
        optEls.forEach(b => b.classList.add('locked'));
        why.classList.add('show');
        scoreEl.textContent = answeredCount < qs.length
          ? `${answeredCount} / ${qs.length} answered`
          : (correctCount === qs.length
            ? `🎉 ${correctCount} / ${qs.length} — perfect! Ready for the next lesson.`
            : `${correctCount} / ${qs.length} correct — reread the highlighted explanations, or replay the demo above.`);
      });
      optEls.push(btn);
      return btn;
    }));
    wrap.appendChild(h('div', { class: 'quiz-q' }, [
      h('div', { class: 'quiz-question' }, `${qi + 1}. ${item.q}`),
      opts,
      why,
    ]));
  });
  return wrap;
}

// ---- Newsletter signup ----
function buildNewsletter() {
  const configured = NEWSLETTER.endpoint && !NEWSLETTER.endpoint.startsWith('REPLACE_');
  const status = h('div', { class: 'nl-status' }, '');
  const emailInput = h('input', {
    type: 'email', name: 'email', required: '', placeholder: 'you@example.com', class: 'nl-input',
  });
  const btn = h('button', { type: 'submit', class: 'nl-submit' }, configured ? 'Subscribe →' : 'Coming soon');
  if (!configured) btn.disabled = true;

  const form = h('form', { class: 'nl-form', novalidate: '' }, [emailInput, btn]);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!configured) return;
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) { status.textContent = 'Enter a valid email address.'; status.className = 'nl-status err'; return; }
    btn.disabled = true; btn.textContent = 'Subscribing…';
    try {
      const res = await fetch(NEWSLETTER.endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'ml-playground-footer' }),
      });
      if (res.ok) {
        status.textContent = '🎉 You\'re in! Check your inbox for a confirmation.';
        status.className = 'nl-status ok';
        emailInput.value = '';
        btn.textContent = '✓ Subscribed';
        if (window.gtag) window.gtag('event', 'newsletter_signup', { source: 'footer' });
      } else {
        status.textContent = 'Something went wrong — please try again.';
        status.className = 'nl-status err';
        btn.disabled = false; btn.textContent = 'Subscribe →';
      }
    } catch {
      status.textContent = 'Network error — please try again.';
      status.className = 'nl-status err';
      btn.disabled = false; btn.textContent = 'Subscribe →';
    }
  });

  return h('div', { class: 'newsletter' + (configured ? '' : ' newsletter-pending') }, [
    h('div', { class: 'nl-icon' }, '📬'),
    h('div', { class: 'nl-body' }, [
      h('h4', {}, NEWSLETTER.headline),
      h('p', {}, configured ? NEWSLETTER.subtext : 'Weekly newsletter is being set up. Bookmark the site — every lesson is already free.'),
      form,
      status,
    ]),
  ]);
}

// ---- footer ----
function buildFooter() {
  const colLinks = (title, links) => h('div', { class: 'foot-col' }, [
    h('h5', {}, title),
    ...links.map(([label, href]) => h('a',
      href.startsWith('http') ? { href, target: '_blank', rel: 'noopener' } : { href },
      label)),
  ]);
  return h('footer', { class: 'site-footer' }, [
    h('div', { class: 'foot-grid' }, [
      h('div', { class: 'foot-brand' }, [
        h('h4', {}, '🧠 ML Playground'),
        h('p', {}, 'Machine learning explained the way brains actually learn — visually, interactively, one concept at a time. Built with zero dependencies: every demo runs live in your browser.'),
      ]),
      h('div', { class: 'foot-links' }, [
        colLinks('Start here', [
          ['What is ML?', lessonUrl('intro')],
          ['Python Essentials', lessonUrl('python-basics')],
          ['Linear Regression', lessonUrl('linear-regression')],
        ]),
        colLinks('Most popular', [
          ['Neural Net Playground', lessonUrl('neural-networks')],
          ['How LLMs Work', lessonUrl('llms')],
          ['Transformers', lessonUrl('transformers')],
          ['Generative AI', lessonUrl('generative')],
        ]),
        colLinks('Reference', [
          ['Full curriculum', lessonUrl('home')],
          ['Evaluation Metrics', lessonUrl('metrics')],
          ['Optimizers', lessonUrl('optimizers')],
          ['BYO CSV Sandbox', lessonUrl('csv-sandbox')],
        ]),
        colLinks('🎮 Games', [
          ['All 13 games', gamesUrl()],
          ['Gradient Descent Golf', gamesUrl('gradient-descent-golf')],
          ['Neuron Wiring: XOR', gamesUrl('neuron-wiring')],
        ]),
        h('div', { class: 'foot-col' }, [
          h('h5', {}, '💬 Feedback'),
          h('a', {
            href: 'https://forms.gle/9SLERvXiKTcY4TuFA',
            target: '_blank',
            rel: 'noopener',
            class: 'foot-feedback-btn',
          }, ['📝 Share your thoughts', h('span', {}, '→')]),
        ]),
      ]),
    ]),
    buildNewsletter(),
    h('div', { class: 'foot-bottom' }, [
      h('span', {}, '46 interactive lessons · beginner → expert · free forever'),
      h('span', {}, 'No frameworks, no installs, no fluff — just learning.'),
    ]),
  ]);
}

// ---- home page ----
function renderHome() {
  const progress = getProgress();

  // hero
  const heroCanvas = h('canvas', {
    id: 'hero-canvas',
    // inline positioning so a stale stylesheet can never cause a resize feedback loop
    style: { position: 'absolute', inset: '0', width: '100%', height: '100%' },
  });
  const hero = h('div', { class: 'hero' }, [
    heroCanvas,
    h('div', { class: 'hero-inner' }, [
      h('div', { class: 'hero-badge' }, [h('span', { class: 'pulse-dot' }), '46 interactive lessons · 48+ live demos · 100% free']),
      h('h2', { html: 'See machine learning.<br><span class="grad-text">Actually understand it.</span>' }),
      h('p', { class: 'hero-sub' }, 'From your first regression line to the transformers inside ChatGPT and Claude — every concept is a living visualization you can drag, tune, and train right in your browser. No math prerequisites. No installs. No fluff.'),
      h('div', { class: 'hero-cta' }, [
        h('a', { class: 'cta-primary', href: lessonUrl('intro') }, ['Start learning free', h('span', {}, '→')]),
        h('a', { class: 'cta-ghost', href: lessonUrl('llms') }, ['🤖 How ChatGPT works']),
      ]),
      h('div', { class: 'hero-stats' }, [
        h('div', { class: 'hero-stat' }, [h('b', {}, '46'), h('span', {}, 'visual lessons')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '48+'), h('span', {}, 'interactive demos')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '5'), h('span', {}, 'skill levels')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '0'), h('span', {}, 'installs needed')]),
      ]),
    ]),
  ]);
  contentEl.appendChild(hero);
  startHeroAnimation(heroCanvas);

  // quick-start: first 3 lessons right after hero
  const starters = SECTIONS[0].lessons.slice(0, 3);
  const quickStart = h('div', { class: 'quick-start' }, [
    h('div', { class: 'quick-start-head' }, [
      h('span', { class: 'quick-start-badge' }, 'Start here'),
      h('h3', {}, 'Pick a lesson and try it now'),
      h('p', {}, 'Each one has a live demo you can play with in under 60 seconds.'),
    ]),
    h('div', { class: 'quick-start-grid' }, starters.map((l, i) => h('a', { class: 'quick-start-card', href: lessonUrl(l.id) }, [
      h('div', { class: 'qs-emoji' }, l.emoji),
      h('div', { class: 'qs-body' }, [
        h('span', { class: 'qs-num' }, 'Lesson ' + (i + 1)),
        h('h4', {}, l.title),
        h('p', {}, l.blurb),
      ]),
      h('span', { class: 'qs-arrow' }, '→'),
    ]))),
  ]);
  contentEl.appendChild(reveal(quickStart));

  // feature trio
  const features = h('div', { class: 'features' }, [
    h('div', { class: 'feature' }, [
      h('div', { class: 'f-icon' }, '👆'),
      h('div', {}, [h('h4', {}, 'Learn by doing, not reading'), h('p', {}, 'Drag data points, crank learning rates until they explode, train real neural networks live. Intuition first, formulas second.')]),
    ]),
    h('div', { class: 'feature' }, [
      h('div', { class: 'f-icon' }, '🪜'),
      h('div', {}, [h('h4', {}, 'A real path, newbie → expert'), h('p', {}, 'Five levels that build on each other: foundations, Python, classical ML, deep learning, and modern GenAI — nothing assumed, nothing skipped.')]),
    ]),
    h('div', { class: 'feature' }, [
      h('div', { class: 'f-icon' }, '⚡'),
      h('div', {}, [h('h4', {}, 'Everything runs in your browser'), h('p', {}, 'The models are real — gradient descent, backprop, even a tiny language model — computed live on your machine. View source and learn twice.')]),
    ]),
  ]);
  contentEl.appendChild(reveal(features));

  // curriculum
  const blocks = h('div', { class: 'home-sections' });
  let lessonNo = 0;
  SECTIONS.forEach((sec, si) => {
    const grid = h('div', { class: 'lesson-grid' });
    sec.lessons.forEach((l, li) => {
      lessonNo++;
      grid.appendChild(reveal(h('a', { class: 'lesson-card', href: lessonUrl(l.id) }, [
        h('div', { class: 'lc-top' }, [
          h('div', { class: 'lc-emoji' }, l.emoji),
          h('span', { class: 'lc-num' }, String(lessonNo).padStart(2, '0')),
        ]),
        h('h4', {}, l.title),
        h('p', {}, l.blurb),
        h('div', { class: 'lc-foot' }, [
          h('span', { class: 'level-badge level-' + l.level }, l.level),
          progress[l.id]
            ? h('span', { class: 'lc-done' }, '✓ completed')
            : h('span', { class: 'lc-arrow' }, 'Open lesson →'),
        ]),
      ]), Math.min(li * 40, 160)));
    });
    blocks.appendChild(h('div', { class: 'home-section-block' }, [
      reveal(h('div', { class: 'section-head' }, [
        h('span', { class: 'sec-num' }, '0' + (si + 1)),
        h('h3', {}, sec.name),
        h('span', { class: 'sec-line' }),
      ])),
      grid,
    ]));
  });
  contentEl.appendChild(blocks);

  // games + sandbox highlights after curriculum (retention features, not first-visit priority)
  contentEl.appendChild(reveal(buildGamesHighlight()));
  contentEl.appendChild(reveal(buildSandboxHighlight()));

  contentEl.appendChild(buildFooter());
}

// ---- lesson page ----
function renderLesson(lesson) {
  const idx = ALL.findIndex(l => l.id === lesson.id);
  const progress = getProgress();

  contentEl.appendChild(h('div', { class: 'lesson-header' }, [
    h('div', { class: 'lesson-breadcrumb' }, `${lesson.sectionName}  ·  Lesson ${idx + 1} of ${ALL.length}`),
    h('h2', {}, [
      lesson.emoji + ' ' + lesson.title,
      h('span', { class: 'level-badge level-' + lesson.level }, lesson.level),
    ]),
  ]));

  const body = h('div', { class: 'lesson-body' });
  contentEl.appendChild(body);
  lesson.render(body);

  // turn concept mentions into links to their full lessons
  crossLinkConcepts(body, lesson.id);

  // reveal-on-scroll for demo panels & headings
  body.querySelectorAll('.demo').forEach(d => reveal(d));

  // Pyodide "Try it yourself" playground for Python-section lessons (lazy-loaded)
  if (PYTHON_STARTERS[lesson.id]) {
    const pyWrap = h('div', { class: 'pyodide-playground' }, [
      h('div', { class: 'pyodide-playground-header' }, [
        h('span', {}, '🐍 Try it yourself — real Python, right here'),
        h('span', { class: 'pyodide-playground-hint' }, 'Ctrl+Enter to run · powered by Pyodide (WebAssembly)'),
      ]),
    ]);
    contentEl.appendChild(reveal(pyWrap));
    const starterCode = PYTHON_STARTERS[lesson.id];
    (async () => {
      try {
        if (!pyCell) { const m = await import('./pyodide-runner.js'); pyCell = m.pyCell; }
        pyWrap.appendChild(pyCell(starterCode));
      } catch { pyWrap.style.display = 'none'; }
    })();
  }

  // real-world examples
  const examples = buildExamples(lesson.id);
  if (examples) contentEl.appendChild(reveal(examples));

  // quiz
  const quiz = buildQuiz(lesson.id);
  if (quiz) contentEl.appendChild(reveal(quiz));

  // comments (per-lesson Giscus thread)
  const comments = buildComments(lesson.id);
  if (comments) contentEl.appendChild(reveal(comments));

  // mark-complete button
  const doneBtn = h('button', { class: 'btn' + (progress[lesson.id] ? ' secondary' : '') },
    progress[lesson.id] ? '✓ Completed — click to unmark' : 'Mark lesson as complete ✓');
  doneBtn.addEventListener('click', () => {
    const now = !getProgress()[lesson.id];
    setDone(lesson.id, now);
    doneBtn.textContent = now ? '✓ Completed — click to unmark' : 'Mark lesson as complete ✓';
    doneBtn.className = 'btn' + (now ? ' secondary' : '');
  });
  contentEl.appendChild(h('div', { class: 'complete-row' }, doneBtn));

  // prev / next
  const nav = h('div', { class: 'lesson-nav' });
  const prev = ALL[idx - 1], next = ALL[idx + 1];
  nav.appendChild(prev
    ? h('a', { href: lessonUrl(prev.id) }, [h('span', {}, '← Previous'), prev.emoji + ' ' + prev.title])
    : h('a', { href: lessonUrl('home') }, [h('span', {}, '← Back to'), '🏠 Curriculum']));
  if (next) nav.appendChild(h('a', { href: lessonUrl(next.id), style: { textAlign: 'right' } }, [h('span', {}, 'Next →'), next.emoji + ' ' + next.title]));
  contentEl.appendChild(nav);
  contentEl.appendChild(buildFooter());
}

// ---- Google Analytics: per-route pageviews ----
// Each lesson id becomes its own "page" in GA so you can see which lessons
// actually get read, how long people stay, and where they drop off.
function trackPageView(lesson) {
  if (typeof window.gtag !== 'function') return;
  const id = lesson ? lesson.id : 'home';
  const title = lesson ? ('ML Playground · ' + lesson.title) : 'ML Playground · Curriculum';
  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: location.href,
    page_path: '/' + id,
  });
}

// ---- router ----
function route() {
  cleanups.forEach(f => { try { f(); } catch { /* ignore */ } });
  cleanups = [];
  contentEl.innerHTML = '';
  window.scrollTo(0, 0);
  sidebar.classList.remove('open');
  // retrigger page transition
  contentEl.style.animation = 'none';
  void contentEl.offsetHeight;
  contentEl.style.animation = '';

  const id = currentLessonId();
  renderNav();
  if (id === 'home') { renderHome(); updateReadProgress(); trackPageView(null); return; }
  const lesson = ALL.find(l => l.id === id);
  if (lesson) { renderLesson(lesson); trackPageView(lesson); }
  else { navigateTo('home', true); }
  updateReadProgress();
}

// ---- theme toggle (light "study mode" ⇄ dark "focus mode") ----
const THEME_KEY = 'mlplayground-theme';
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  const label = document.querySelector('#theme-toggle .tt-label');
  const icon = document.querySelector('#theme-toggle .tt-icon');
  if (label) label.textContent = t === 'light' ? 'Light mode' : 'Dark mode';
  if (icon) icon.textContent = t === 'light' ? '☀️' : '🌙';
  syncCommentsTheme(t);
}
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(now);
  });
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
}

// Path-based navigation:
// - popstate fires on back/forward button
// - hashchange still fires for legacy #/ URLs (redirected inside route)
// - clicks on internal <a href="/foo/"> links are intercepted for SPA nav
window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || a.target === '_blank' || a.hasAttribute('download')) return;
  // must be an in-app path (starts with base + /) — everything else falls through
  if (!href.startsWith(BASE_PATH + '/') && !href.startsWith('/')) return;
  // extract lesson id from path
  let p = href.split('#')[0].split('?')[0];
  if (BASE_PATH && p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length);
  p = p.replace(/^\/+|\/+$/g, '');
  const id = !p || p === 'index.html' ? 'home' : p;
  if (id !== 'home' && !ALL_IDS.has(id)) return; // unknown → let browser handle
  e.preventDefault();
  navigateTo(id);
});
document.getElementById('menu-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));

// ============ Site-wide search (Ctrl-K / Cmd-K) ============
// Index: every lesson + every game as one flat searchable list.
const SEARCH_INDEX = [
  ...ALL.map(l => ({
    kind: 'lesson', emoji: l.emoji, title: l.title, blurb: l.blurb,
    section: l.sectionName, url: lessonUrl(l.id),
    haystack: (l.title + ' ' + l.blurb + ' ' + l.sectionName + ' ' + l.id).toLowerCase(),
  })),
  ...GAMES.map(g => ({
    kind: 'game', emoji: g.emoji, title: g.title, blurb: g.blurb,
    section: 'Game', url: gamesUrl(g.slug),
    haystack: (g.title + ' ' + g.blurb + ' game ' + g.slug).toLowerCase(),
  })),
];

let searchOverlay, searchInput, searchResults, searchActive = -1, searchCurrent = [];

function buildSearchOverlay() {
  if (searchOverlay) return;
  searchOverlay = h('div', { id: 'search-overlay', role: 'dialog', 'aria-label': 'Search' }, [
    h('div', { id: 'search-panel' }, [
      h('div', { id: 'search-input-row' }, [
        h('span', { class: 'search-icon' }, '🔍'),
        (searchInput = h('input', { id: 'search-input', type: 'text', placeholder: 'Search 46 lessons + 13 games…', autocomplete: 'off', spellcheck: 'false' })),
        h('button', { id: 'search-close', 'aria-label': 'Close search', onclick: closeSearch }, 'Esc'),
      ]),
      (searchResults = h('div', { id: 'search-results' })),
      h('div', { id: 'search-footer' }, [
        h('span', {}, [h('kbd', {}, '↑'), h('kbd', {}, '↓'), ' navigate']),
        h('span', {}, [h('kbd', {}, '↵'), ' open']),
        h('span', {}, [h('kbd', {}, 'Esc'), ' close']),
      ]),
    ]),
  ]);
  document.body.appendChild(searchOverlay);
  searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });
  searchInput.addEventListener('input', renderSearch);
  searchInput.addEventListener('keydown', onSearchKey);
}

function openSearch() {
  buildSearchOverlay();
  searchOverlay.classList.add('open');
  searchInput.value = '';
  searchActive = 0;
  renderSearch();
  setTimeout(() => searchInput.focus(), 30);
}
function closeSearch() {
  if (searchOverlay) searchOverlay.classList.remove('open');
}

function highlightMatch(text, terms) {
  if (!terms.length) return text;
  const re = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function renderSearch() {
  const q = searchInput.value.trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  let results;
  if (!terms.length) {
    // default: show a few popular lessons + games
    results = SEARCH_INDEX.filter(x => ['neural-networks', 'llms', 'transformers', 'gradient-descent', 'ensemble-methods', 'rag'].some(id => x.url.includes('/' + id + '/'))).slice(0, 6);
  } else {
    results = SEARCH_INDEX
      .map(x => {
        let score = 0;
        for (const t of terms) {
          if (!x.haystack.includes(t)) return null;
          if (x.title.toLowerCase().includes(t)) score += 10;
          if (x.blurb.toLowerCase().includes(t)) score += 3;
          if (x.section.toLowerCase().includes(t)) score += 2;
          score += 1;
        }
        return { x, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map(r => r.x)
      .slice(0, 12);
  }
  searchCurrent = results;
  searchActive = Math.min(searchActive, Math.max(0, results.length - 1));
  if (!results.length) {
    searchResults.innerHTML = '<div class="search-empty">No matches for <b>' + q.replace(/[<>&]/g, '') + '</b>. Try a shorter or different word.</div>';
    return;
  }
  searchResults.innerHTML = results.map((r, i) => `
    <a class="search-result${i === searchActive ? ' active' : ''}" href="${r.url}" data-i="${i}">
      <div class="sr-top">
        <span class="sr-emoji">${r.emoji}</span>
        <span class="sr-title">${highlightMatch(r.title, terms)}</span>
        <span class="sr-badge${r.kind === 'game' ? ' game' : ''}">${r.kind === 'game' ? '🎮 Game' : r.section.replace(/^[^A-Za-z]+/, '')}</span>
      </div>
      <div class="sr-blurb">${highlightMatch(r.blurb, terms)}</div>
    </a>
  `).join('');
  // hover to activate
  searchResults.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('mouseenter', () => {
      searchActive = parseInt(el.dataset.i);
      searchResults.querySelectorAll('.search-result').forEach((r, i) => r.classList.toggle('active', i === searchActive));
    });
    el.addEventListener('click', e => {
      // Let the SPA click handler intercept for internal URLs; close overlay first
      closeSearch();
    });
  });
}

function onSearchKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchActive = Math.min(searchActive + 1, searchCurrent.length - 1);
    updateActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchActive = Math.max(searchActive - 1, 0);
    updateActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const target = searchCurrent[searchActive];
    if (target) {
      closeSearch();
      // navigate via the same path the SPA link interceptor uses
      const a = document.createElement('a');
      a.href = target.url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
}
function updateActive() {
  const nodes = searchResults.querySelectorAll('.search-result');
  nodes.forEach((n, i) => n.classList.toggle('active', i === searchActive));
  const el = nodes[searchActive];
  if (el) el.scrollIntoView({ block: 'nearest' });
}

// Global keyboard shortcut
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openSearch();
  } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
    e.preventDefault();
    openSearch();
  }
});
const fabSearch = document.getElementById('fab-search');
if (fabSearch) fabSearch.addEventListener('click', openSearch);

route();
