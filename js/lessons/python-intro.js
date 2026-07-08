// Lesson: Python Intro — what/why, installation, setup, first program, pip & venv
import { h, html, pyCode, demoPanel, button } from '../utils.js';

// fake-terminal command catalog
const TERMINAL = [
  { cmd: 'python --version', out: 'Python 3.12.4', note: 'Verifies the install. If you see "not recognized", Python isn\'t on your PATH — re-run the installer and tick "Add python.exe to PATH".' },
  { cmd: 'python', out: 'Python 3.12.4 (main) [MSC v.1938 64 bit]\nType "help" for more information.\n>>> 2 + 3\n5\n>>> exit()', note: 'No arguments opens the REPL — an interactive playground where each line runs instantly. Perfect for experiments; exit() leaves it.' },
  { cmd: 'python hello.py', out: 'Hello, ML Playground!', note: 'The normal way to run a program: point python at a .py file. Everything in the file runs top to bottom.' },
  { cmd: 'pip install numpy pandas', out: 'Successfully installed numpy-2.1.0 pandas-2.2.2', note: 'pip is Python\'s app store for libraries. One command pulls any of 500,000+ packages from PyPI.' },
  { cmd: 'python -m venv .venv', out: '(creates a .venv folder)', note: 'A virtual environment: an isolated copy of Python per project, so project A\'s packages never clash with project B\'s. Activate with .venv\\Scripts\\activate (Windows) or source .venv/bin/activate (Mac/Linux).' },
  { cmd: 'pip list', out: 'numpy   2.1.0\npandas  2.2.2\npip     24.0', note: 'Shows what\'s installed in the current environment.' },
];

export default {
  id: 'python-intro',
  emoji: '🚀',
  title: 'Python: Intro & Setup',
  level: 'Beginner',
  blurb: 'What Python is, why ML runs on it, and a working setup in 10 minutes — interpreter, editor, pip, venv.',

  render(root) {
    root.appendChild(html(`
      <p><strong>Python</strong> is a programming language designed (by Guido van Rossum, 1991) around one idea: <em>code should read like English</em>. Compare the same program in two languages:</p>
    `));

    root.appendChild(pyCode(
`# Python — reads almost like a sentence
numbers = [1, 2, 3, 4, 5]
total = sum(n * n for n in numbers)
print("sum of squares:", total)`,
      { title: 'python.py', output: 'sum of squares: 55' }));

    root.appendChild(html(`
      <div class="code-block"><div class="code-title"><span class="code-dots"><i></i><i></i><i></i></span>java_equivalent.java</div><pre class="code-body" style="color:#8b96b2">int total = 0;
for (int i = 0; i < numbers.length; i++) {
    total += numbers[i] * numbers[i];
}
System.out.println("sum of squares: " + total);</pre></div>
      <h3>Why is Python <em>the</em> ML language?</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">📖</div><h4>Readable</h4><p>Researchers prototype ideas daily — syntax that stays out of the way wins.</p></div>
        <div class="card"><div class="card-icon">📦</div><h4>The ecosystem</h4><p>NumPy, pandas, scikit-learn, PyTorch, Hugging Face — every major ML tool speaks Python first.</p></div>
        <div class="card"><div class="card-icon">🔌</div><h4>Glue language</h4><p>The heavy math runs in fast C/CUDA underneath; Python is the friendly steering wheel on top.</p></div>
        <div class="card"><div class="card-icon">👥</div><h4>Community</h4><p>The most-used language on GitHub — every error message you'll ever see has an answer online.</p></div>
      </div>

      <h3>Installation — 10 minutes, three steps</h3>
      <table class="info-table">
        <tr><th>Step</th><th>Windows</th><th>macOS / Linux</th></tr>
        <tr><td><b>1 · Install Python</b></td><td>Download from <code>python.org/downloads</code> → run installer → <strong>tick "Add python.exe to PATH"</strong> (the box everyone misses!)</td><td>macOS: <code>brew install python</code> · Ubuntu: <code>sudo apt install python3 python3-pip</code></td></tr>
        <tr><td><b>2 · Install an editor</b></td><td colspan="2">VS Code (<code>code.visualstudio.com</code>) + its official Python extension. Free, and what most professionals use.</td></tr>
        <tr><td><b>3 · Verify</b></td><td colspan="2">Open a terminal and run <code>python --version</code> — try it in the simulator below.</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Zero-install alternative</div>
      Don't want to install anything yet? <strong>Google Colab</strong> (colab.research.google.com) runs Python notebooks in your browser with free GPUs — the standard way to experiment with ML. Everything in this course works there too.</div>

      <h3>Try the terminal</h3>
      <p>These are the five commands that cover 95% of everyday Python setup work. Click each one to "run" it and read what it does:</p>
    `));

    // ---- interactive terminal simulator ----
    const screen = h('pre', {
      style: {
        margin: 0, padding: '14px 16px', minHeight: '9em', fontFamily: 'var(--font-mono, Consolas)',
        fontSize: '0.82rem', lineHeight: 1.65, color: '#dbe4f5', whiteSpace: 'pre-wrap',
        background: '#070a12', border: '1px solid var(--border)', borderRadius: '10px',
      },
    }, 'C:\\Users\\you>  ▍   (click a command below)');
    const note = h('div', { class: 'callout callout-info', style: { minHeight: '3.4em', marginTop: '12px' } }, 'Each command\'s explanation appears here.');
    const cmdRow = h('div', { class: 'controls' }, TERMINAL.map(t =>
      button(t.cmd, () => {
        screen.textContent = 'C:\\Users\\you> ' + t.cmd + '\n' + t.out + '\n\nC:\\Users\\you>  ▍';
        note.textContent = t.note;
      }, true)
    ));

    root.appendChild(demoPanel(
      'Terminal simulator',
      'A safe sandbox — click commands to see exactly what they print on a real machine.',
      screen, cmdRow, note,
    ));

    root.appendChild(html(`<h3>Your first program</h3>
      <p>Create a file called <code>hello.py</code> in VS Code, type this, save, and run it with <code>python hello.py</code>:</p>`));

    root.appendChild(pyCode(
`# hello.py — your first Python program
name = input("What's your name? ")
print(f"Hello, {name}! Welcome to Python.")
print("2 + 2 =", 2 + 2)`,
      { title: 'hello.py', output: "What's your name? Ada\nHello, Ada! Welcome to Python.\n2 + 2 = 4" }));

    root.appendChild(html(`
      <ul>
        <li><code>input()</code> pauses and reads a line you type.</li>
        <li><code>print()</code> writes to the screen; the <code>f"..."</code> string plugs variables into text (next lesson!).</li>
        <li>No semicolons, no braces, no boilerplate <code>main()</code> — the file itself is the program.</li>
      </ul>

      <h3>The toolbox at a glance</h3>
      <table class="info-table">
        <tr><th>Tool</th><th>What it is</th><th>You'll type</th></tr>
        <tr><td><b>python</b></td><td>The interpreter — runs your code</td><td><code>python script.py</code></td></tr>
        <tr><td><b>REPL</b></td><td>Interactive line-by-line mode</td><td><code>python</code> then <code>&gt;&gt;&gt;</code></td></tr>
        <tr><td><b>pip</b></td><td>Package installer</td><td><code>pip install requests</code></td></tr>
        <tr><td><b>venv</b></td><td>Isolated environment per project</td><td><code>python -m venv .venv</code></td></tr>
        <tr><td><b>Jupyter / Colab</b></td><td>Notebooks — code + text + charts in cells; the home of ML experimentation</td><td><code>pip install jupyter</code> · <code>jupyter notebook</code></td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ The two beginner traps</div>
      <b>1. PATH:</b> "python is not recognized" on Windows = the installer checkbox was missed. Re-run it and tick "Add to PATH".<br>
      <b>2. python vs python3:</b> on Mac/Linux the command is often <code>python3</code> and <code>pip3</code>. If <code>python</code> fails, add the 3.</div>
    `));
  },
};
