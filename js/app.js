// ============ ML Playground — app shell, router, navigation ============
import { h } from './utils.js';

import intro from './lessons/intro.js';
import dataFeatures from './lessons/data-features.js';
import linearRegression from './lessons/linear-regression.js';
import gradientDescent from './lessons/gradient-descent.js';
import overfitting from './lessons/overfitting.js';
import metrics from './lessons/metrics.js';
import pythonBasics from './lessons/python-basics.js';
import numpy from './lessons/numpy.js';
import mlCode from './lessons/ml-code.js';
import logisticRegression from './lessons/logistic-regression.js';
import knn from './lessons/knn.js';
import svm from './lessons/svm.js';
import naiveBayes from './lessons/naive-bayes.js';
import decisionTrees from './lessons/decision-trees.js';
import kmeans from './lessons/kmeans.js';
import pca from './lessons/pca.js';
import neuralNetworks from './lessons/neural-networks.js';
import activations from './lessons/activations.js';
import backprop from './lessons/backprop.js';
import optimizers from './lessons/optimizers.js';
import cnn from './lessons/cnn.js';
import rnn from './lessons/rnn.js';
import transformers from './lessons/transformers.js';
import embeddings from './lessons/embeddings.js';
import generative from './lessons/generative.js';
import llms from './lessons/llms.js';

export const SECTIONS = [
  { name: '🌱 Foundations', short: 'Foundations', lessons: [intro, dataFeatures, linearRegression, gradientDescent, overfitting, metrics] },
  { name: '🐍 Python for ML', short: 'Python for ML', lessons: [pythonBasics, numpy, mlCode] },
  { name: '📊 Classical ML', short: 'Classical ML', lessons: [logisticRegression, knn, svm, naiveBayes, decisionTrees, kmeans, pca] },
  { name: '🧠 Deep Learning', short: 'Deep Learning', lessons: [neuralNetworks, activations, backprop, optimizers] },
  { name: '🚀 Advanced', short: 'Advanced & GenAI', lessons: [cnn, rnn, transformers, embeddings, generative, llms] },
];

const ALL = SECTIONS.flatMap(s => s.lessons.map(l => ({ ...l, sectionName: s.name })));

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
  const current = location.hash.replace('#/', '') || 'home';
  navEl.innerHTML = '';
  navEl.appendChild(h('a', {
    class: 'nav-link' + (current === 'home' ? ' active' : ''),
    href: '#/home',
  }, [h('span', { class: 'nav-emoji' }, '🏠'), 'Home / Curriculum']));

  for (const sec of SECTIONS) {
    const box = h('div', { class: 'nav-section' }, [
      h('div', { class: 'nav-section-title' }, sec.name),
    ]);
    for (const l of sec.lessons) {
      box.appendChild(h('a', {
        class: 'nav-link' + (current === l.id ? ' active' : '') + (progress[l.id] ? ' done' : ''),
        href: '#/' + l.id,
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

// ---- footer ----
function buildFooter() {
  const colLinks = (title, links) => h('div', { class: 'foot-col' }, [
    h('h5', {}, title),
    ...links.map(([label, href]) => h('a', { href }, label)),
  ]);
  return h('footer', { class: 'site-footer' }, [
    h('div', { class: 'foot-grid' }, [
      h('div', { class: 'foot-brand' }, [
        h('h4', {}, '🧠 ML Playground'),
        h('p', {}, 'Machine learning explained the way brains actually learn — visually, interactively, one concept at a time. Built with zero dependencies: every demo runs live in your browser.'),
      ]),
      h('div', { class: 'foot-links' }, [
        colLinks('Start here', [
          ['What is ML?', '#/intro'],
          ['Python Essentials', '#/python-basics'],
          ['Linear Regression', '#/linear-regression'],
        ]),
        colLinks('Most popular', [
          ['Neural Net Playground', '#/neural-networks'],
          ['How LLMs Work', '#/llms'],
          ['Transformers', '#/transformers'],
          ['Generative AI', '#/generative'],
        ]),
        colLinks('Reference', [
          ['Full curriculum', '#/home'],
          ['Evaluation Metrics', '#/metrics'],
          ['Optimizers', '#/optimizers'],
        ]),
      ]),
    ]),
    h('div', { class: 'foot-bottom' }, [
      h('span', {}, '26 interactive lessons · beginner → expert · free forever'),
      h('span', {}, 'No frameworks, no tracking, no installs — just learning.'),
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
      h('div', { class: 'hero-badge' }, [h('span', { class: 'pulse-dot' }), '26 interactive lessons · 35+ live demos · 100% free']),
      h('h2', { html: 'See machine learning.<br><span class="grad-text">Actually understand it.</span>' }),
      h('p', { class: 'hero-sub' }, 'From your first regression line to the transformers inside ChatGPT and Claude — every concept is a living visualization you can drag, tune, and train right in your browser. No math prerequisites. No installs. No fluff.'),
      h('div', { class: 'hero-cta' }, [
        h('a', { class: 'cta-primary', href: '#/intro' }, ['Start learning free', h('span', {}, '→')]),
        h('a', { class: 'cta-ghost', href: '#/llms' }, ['🤖 How ChatGPT works']),
      ]),
      h('div', { class: 'hero-stats' }, [
        h('div', { class: 'hero-stat' }, [h('b', {}, '26'), h('span', {}, 'visual lessons')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '35+'), h('span', {}, 'interactive demos')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '5'), h('span', {}, 'skill levels')]),
        h('div', { class: 'hero-stat' }, [h('b', {}, '0'), h('span', {}, 'installs needed')]),
      ]),
    ]),
  ]);
  contentEl.appendChild(hero);
  startHeroAnimation(heroCanvas);

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
      grid.appendChild(reveal(h('a', { class: 'lesson-card', href: '#/' + l.id }, [
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

  // reveal-on-scroll for demo panels & headings
  body.querySelectorAll('.demo').forEach(d => reveal(d));

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
    ? h('a', { href: '#/' + prev.id }, [h('span', {}, '← Previous'), prev.emoji + ' ' + prev.title])
    : h('a', { href: '#/home' }, [h('span', {}, '← Back to'), '🏠 Curriculum']));
  if (next) nav.appendChild(h('a', { href: '#/' + next.id, style: { textAlign: 'right' } }, [h('span', {}, 'Next →'), next.emoji + ' ' + next.title]));
  contentEl.appendChild(nav);
  contentEl.appendChild(buildFooter());
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

  const id = location.hash.replace('#/', '') || 'home';
  renderNav();
  if (id === 'home') { renderHome(); updateReadProgress(); return; }
  const lesson = ALL.find(l => l.id === id);
  if (lesson) renderLesson(lesson);
  else { location.hash = '#/home'; }
  updateReadProgress();
}

window.addEventListener('hashchange', route);
document.getElementById('menu-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));
route();
