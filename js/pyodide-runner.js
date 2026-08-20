// Pyodide runner — lazy-loads Python WebAssembly runtime from CDN.
// Provides runnable code cells for Python lessons on ML Playground.

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

let pyodideInstance = null;
let loadingPromise = null;
let loadState = 'idle'; // idle | loading | ready | error

const listeners = new Set();
function onStateChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notifyState() { listeners.forEach(fn => fn(loadState)); }

async function ensurePyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadState = 'loading';
  notifyState();

  loadingPromise = (async () => {
    const script = document.createElement('script');
    script.src = PYODIDE_CDN + 'pyodide.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Pyodide runtime'));
      document.head.appendChild(script);
    });

    // eslint-disable-next-line no-undef
    const pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
    await pyodide.loadPackage(['numpy']);

    pyodideInstance = pyodide;
    loadState = 'ready';
    notifyState();
    return pyodide;
  })();

  loadingPromise.catch(() => {
    loadState = 'error';
    loadingPromise = null;
    notifyState();
  });

  return loadingPromise;
}

export async function runPython(code) {
  const pyodide = await ensurePyodide();

  let stdout = '';
  pyodide.setStdout({ batched: msg => { stdout += msg + '\n'; } });
  pyodide.setStderr({ batched: msg => { stdout += '[stderr] ' + msg + '\n'; } });

  try {
    const result = await pyodide.runPythonAsync(code);
    const output = stdout.trimEnd();
    return { ok: true, output, result };
  } catch (err) {
    const output = stdout.trimEnd();
    const errMsg = String(err.message || err);
    const cleaned = errMsg.includes('PythonError')
      ? errMsg.split('\n').filter(l => !l.startsWith('    at ')).join('\n')
      : errMsg;
    return { ok: false, output: output ? output + '\n' + cleaned : cleaned };
  }
}

import { h } from './utils.js';

export function pyCell(initialCode, opts = {}) {
  const { height = 'auto', readonly = false, preload = '' } = opts;

  const wrapper = document.createElement('div');
  wrapper.className = 'pyodide-cell';

  const titleBar = h('div', { class: 'pyodide-title' }, [
    h('span', { class: 'pyodide-label' }, [
      h('span', { class: 'pyodide-dot' }),
      'Python (runs in browser)',
    ]),
    h('span', { class: 'pyodide-status', id: '' }, ''),
  ]);
  const statusEl = titleBar.querySelector('.pyodide-status');

  const textarea = document.createElement('textarea');
  textarea.className = 'pyodide-editor';
  textarea.value = initialCode.trim();
  textarea.spellcheck = false;
  textarea.autocapitalize = 'off';
  textarea.autocomplete = 'off';
  if (readonly) textarea.readOnly = true;
  if (height !== 'auto') textarea.style.height = height;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runBtn.click();
    }
  });

  const outputEl = h('div', { class: 'pyodide-output' });
  outputEl.style.display = 'none';

  let running = false;

  const runBtn = h('button', { class: 'pyodide-run', 'aria-label': 'Run Python code' }, [
    h('span', { class: 'pyodide-run-icon' }, '▶'),
    ' Run',
  ]);

  const resetBtn = h('button', { class: 'pyodide-reset', 'aria-label': 'Reset code' }, 'Reset');
  resetBtn.addEventListener('click', () => {
    textarea.value = initialCode.trim();
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    outputEl.style.display = 'none';
    outputEl.textContent = '';
  });

  async function run() {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    runBtn.querySelector('.pyodide-run-icon').textContent = '⏳';
    outputEl.style.display = 'block';
    outputEl.textContent = loadState === 'ready'
      ? 'Running...'
      : 'Loading Python engine (first run takes a few seconds)...';

    statusEl.textContent = loadState === 'ready' ? 'running...' : 'loading engine...';
    statusEl.className = 'pyodide-status loading';

    try {
      const fullCode = preload ? preload + '\n' + textarea.value : textarea.value;
      const result = await runPython(fullCode);
      outputEl.textContent = result.output || (result.ok ? '(no output)' : 'Error');
      outputEl.className = 'pyodide-output' + (result.ok ? '' : ' pyodide-error');
      statusEl.textContent = 'ready';
      statusEl.className = 'pyodide-status ready';
    } catch (err) {
      outputEl.textContent = 'Error: ' + err.message;
      outputEl.className = 'pyodide-output pyodide-error';
      statusEl.textContent = 'error';
      statusEl.className = 'pyodide-status error';
    }

    running = false;
    runBtn.disabled = false;
    runBtn.querySelector('.pyodide-run-icon').textContent = '▶';
  }

  runBtn.addEventListener('click', run);

  const btnRow = h('div', { class: 'pyodide-buttons' }, [runBtn, resetBtn]);

  wrapper.appendChild(titleBar);
  wrapper.appendChild(textarea);
  wrapper.appendChild(btnRow);
  wrapper.appendChild(outputEl);

  requestAnimationFrame(() => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });

  const unsub = onStateChange(state => {
    if (state === 'ready') statusEl.textContent = 'ready';
  });

  wrapper.cleanup = unsub;
  return wrapper;
}

export function pyPlayground(initialCode, opts = {}) {
  const wrapper = h('div', { class: 'pyodide-playground' }, [
    h('div', { class: 'pyodide-playground-header' }, [
      h('span', {}, '🐍 Python Sandbox'),
      h('span', { class: 'pyodide-playground-hint' }, 'Ctrl+Enter to run'),
    ]),
  ]);
  wrapper.appendChild(pyCell(initialCode, opts));
  return wrapper;
}
