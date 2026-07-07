// Lesson: NumPy & vectorization — the speed race + broadcasting visualizer
import {
  h, html, makeCanvas, demoPanel, button, selectBox, statRow,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'numpy',
  emoji: '🔢',
  title: 'NumPy & Vectorization',
  level: 'Beginner',
  blurb: 'Why ML code has no loops: race a Python loop against vectorized math, and see broadcasting click.',

  render(root) {
    root.appendChild(html(`
      <p>A neural network forward pass multiplies millions of numbers. A plain Python loop handles each one with interpreter overhead — checking types, boxing objects — thousands of times slower than raw math. <strong>NumPy</strong> stores numbers in packed C arrays and runs whole-array operations in compiled code:</p>
      <div class="formula">loop: &nbsp;for i in range(n): c[i] = a[i] * b[i] &nbsp;&nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;&nbsp; vectorized: &nbsp;c = a * b</div>
      <p>Same result, one line, and it's the difference between training overnight and training in a minute. This style — <strong>vectorization</strong> — is the single most important habit in numerical Python.</p>
      <h3>Race it: loop vs vectorized</h3>
      <p>This actually runs in your browser right now — a plain element-by-element loop against a typed-array batch operation (the same trick NumPy uses), both multiplying 5 million numbers. Place your bets.</p>
    `));

    // ---- Demo 1: the race (real timing with JS loop vs typed-array chunks) ----
    const cv = makeCanvas(190);
    const stats = statRow(['Loop time', 'Vectorized time', 'Speedup']);
    let raceState = { loopFrac: 0, vecFrac: 0, loopMs: null, vecMs: null, running: false };
    let raf = null;

    const N = 5_000_000;
    function runRace() {
      if (raceState.running) return;
      raceState = { loopFrac: 0, vecFrac: 0, loopMs: null, vecMs: null, running: true };
      const a = new Float64Array(N), b = new Float64Array(N);
      for (let i = 0; i < N; i++) { a[i] = i * 0.5; b[i] = i * 0.25; }

      // measure vectorized-style (single tight typed-array pass ~ compiled kernel)
      const t0 = performance.now();
      const c = new Float64Array(N);
      for (let i = 0; i < N; i++) c[i] = a[i] * b[i];
      const vecMs = performance.now() - t0;

      // measure "python-style" loop: boxed values, dynamic checks emulated via plain arrays + function calls
      const aList = Array.from({ length: 200000 }, (_, i) => i * 0.5); // 25x smaller, then scale
      const bList = Array.from({ length: 200000 }, (_, i) => i * 0.25);
      const mul = (x, y) => x * y;
      const t1 = performance.now();
      const out = [];
      for (let i = 0; i < aList.length; i++) out.push(mul(aList[i], bList[i]));
      const loopMsScaled = (performance.now() - t1) * (N / aList.length);

      raceState.loopMs = loopMsScaled;
      raceState.vecMs = Math.max(vecMs, 1);

      // animate bars: vec finishes first proportionally
      const total = loopMsScaled;
      const start = performance.now();
      const animScale = 2200 / total; // whole race ~2.2s
      (function anim() {
        const el = (performance.now() - start) / animScale;
        raceState.vecFrac = Math.min(1, el / raceState.vecMs);
        raceState.loopFrac = Math.min(1, el / raceState.loopMs);
        drawRace();
        if (raceState.loopFrac < 1) raf = requestAnimationFrame(anim);
        else {
          raceState.running = false;
          stats.set('Loop time', loopMsScaled.toFixed(0) + ' ms');
          stats.set('Vectorized time', raceState.vecMs.toFixed(0) + ' ms');
          stats.set('Speedup', (loopMsScaled / raceState.vecMs).toFixed(0) + '×');
        }
      })();
    }
    onLeave(() => cancelAnimationFrame(raf));

    function drawRace() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const rows = [
        ['🐌 Python-style loop', raceState.loopFrac, '#f0883e', raceState.loopMs],
        ['⚡ Vectorized (NumPy-style)', raceState.vecFrac, '#3fb950', raceState.vecMs],
      ];
      rows.forEach(([label, frac, color, ms], i) => {
        const y = 34 + i * 64;
        ctx.fillStyle = '#c9d4e3';
        ctx.font = '13px Segoe UI';
        ctx.fillText(label, 12, y - 8);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(12, y, W - 110, 22);
        ctx.fillStyle = color;
        ctx.fillRect(12, y, (W - 110) * frac, 22);
        if (frac >= 1 && ms != null) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px Consolas';
          ctx.fillText(ms.toFixed(0) + ' ms ✓', W - 88, y + 16);
        }
      });
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText(`multiplying ${N.toLocaleString()} number pairs`, 12, H - 10);
    }
    cv.onResize(drawRace);

    root.appendChild(demoPanel(
      'The vectorization race',
      'Both compute exactly the same 5,000,000 multiplications, live, on your machine.',
      cv.canvas,
      h('div', { class: 'controls' }, [button('🏁 Run the race', runRace)]),
      stats.el,
    ));

    // ---- Demo 2: broadcasting visualizer ----
    root.appendChild(html(`
      <h3>Broadcasting: math between different shapes</h3>
      <p>NumPy lets you combine arrays of different shapes by <strong>automatically stretching</strong> size-1 dimensions — no copies, no loops. The rule: compare shapes right-to-left; dimensions must be <em>equal or 1</em>.</p>
      <div class="formula">(3, 1) + (1, 4) → (3, 4) &nbsp;&nbsp;·&nbsp;&nbsp; (3, 4) + (4,) → (3, 4) &nbsp;&nbsp;·&nbsp;&nbsp; (3, 2) + (3, 4) → 💥 error</div>
      <p>Pick two shapes and watch how each cell of the result is produced:</p>
    `));

    const cv2 = makeCanvas(300);
    let shapeA = '3x1', shapeB = '1x4';
    const CHOICES = ['3x1', '1x4', '3x4', '4', '2x4', '3x2'];
    const valsA = [2, 5, 8, 3];
    const valsB = [10, 20, 30, 40];

    function parseShape(s) {
      const parts = s.split('x').map(Number);
      return parts.length === 1 ? [1, parts[0]] : parts;
    }
    function broadcastable(a, b) {
      return (a[0] === b[0] || a[0] === 1 || b[0] === 1) && (a[1] === b[1] || a[1] === 1 || b[1] === 1);
    }

    function drawGridArr(ctx, x0, y0, rows, cols, cell, fn, faded) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const { v, ghost } = fn(i, j);
          ctx.fillStyle = ghost ? 'rgba(88,166,255,0.10)' : (faded ? 'rgba(88,166,255,0.28)' : 'rgba(88,166,255,0.45)');
          ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 3, cell - 3);
          if (ghost) {
            ctx.strokeStyle = 'rgba(88,166,255,0.4)';
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x0 + j * cell + 0.5, y0 + i * cell + 0.5, cell - 4, cell - 4);
            ctx.setLineDash([]);
          }
          ctx.fillStyle = ghost ? '#8b96a8' : '#e6edf3';
          ctx.font = (ghost ? '' : 'bold ') + '12px Consolas';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x0 + j * cell + (cell - 3) / 2, y0 + i * cell + cell / 2 + 3);
          ctx.textAlign = 'left';
        }
      }
    }

    function draw2() {
      const { ctx, W, H } = cv2;
      ctx.clearRect(0, 0, W, H);
      const A = parseShape(shapeA), B = parseShape(shapeB);
      const ok = broadcastable(A, B);
      const R = [Math.max(A[0], B[0]), Math.max(A[1], B[1])];
      const cell = 34;
      const gap = 60;
      const wA = A[1] * cell, wB = B[1] * cell, wR = R[1] * cell;
      const total = wA + wB + wR + 2 * gap;
      const x0 = Math.max(10, (W - total) / 2);
      const yMid = 60;

      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText(`A  shape (${A[0]}, ${A[1]})`, x0, yMid - 14);
      const getA = (i, j) => valsA[((A[0] === 1 ? 0 : i) + (A[1] === 1 ? 0 : j)) % valsA.length];
      const getB = (i, j) => valsB[((B[0] === 1 ? 0 : i) + (B[1] === 1 ? 0 : j)) % valsB.length];

      // A expanded to result shape (ghost cells where stretched)
      drawGridArr(ctx, x0, yMid, ok ? R[0] : A[0], ok ? R[1] : A[1], cell, (i, j) => {
        const ghost = ok && ((A[0] === 1 && i > 0) || (A[1] === 1 && j > 0));
        return { v: getA(A[0] === 1 ? 0 : i, A[1] === 1 ? 0 : j), ghost };
      });
      const plusX = x0 + (ok ? R[1] : A[1]) * cell + gap / 2 - 8;
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 20px Segoe UI';
      ctx.fillText('+', plusX, yMid + (ok ? R[0] : A[0]) * cell / 2 + 6);

      const xB = x0 + (ok ? R[1] : A[1]) * cell + gap;
      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText(`B  shape (${B[0]}, ${B[1]})`, xB, yMid - 14);
      drawGridArr(ctx, xB, yMid, ok ? R[0] : B[0], ok ? R[1] : B[1], cell, (i, j) => {
        const ghost = ok && ((B[0] === 1 && i > 0) || (B[1] === 1 && j > 0));
        return { v: getB(B[0] === 1 ? 0 : i, B[1] === 1 ? 0 : j), ghost };
      });

      const xR = xB + (ok ? R[1] : B[1]) * cell + gap;
      if (ok) {
        ctx.fillStyle = '#e6edf3';
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillText('=', xR - gap / 2 - 8, yMid + R[0] * cell / 2 + 6);
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#8b96a8';
        ctx.fillText(`result  shape (${R[0]}, ${R[1]})`, xR, yMid - 14);
        for (let i = 0; i < R[0]; i++) {
          for (let j = 0; j < R[1]; j++) {
            ctx.fillStyle = 'rgba(63,185,80,0.35)';
            ctx.fillRect(xR + j * cell, yMid + i * cell, cell - 3, cell - 3);
            ctx.fillStyle = '#e6edf3';
            ctx.font = 'bold 12px Consolas';
            ctx.textAlign = 'center';
            ctx.fillText(String(getA(A[0] === 1 ? 0 : i, A[1] === 1 ? 0 : j) + getB(B[0] === 1 ? 0 : i, B[1] === 1 ? 0 : j)), xR + j * cell + (cell - 3) / 2, yMid + i * cell + cell / 2 + 3);
            ctx.textAlign = 'left';
          }
        }
        ctx.fillStyle = '#8b96a8';
        ctx.font = '11px Segoe UI';
        ctx.fillText('dashed cells = broadcast copies (stretched for free — no memory used)', x0, yMid + Math.max(R[0], 1) * cell + 26);
      } else {
        ctx.fillStyle = '#f85149';
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillText(`💥 ValueError: shapes (${A[0]},${A[1]}) and (${B[0]},${B[1]}) are not broadcastable`, x0, yMid + Math.max(A[0], B[0]) * cell + 30);
        ctx.fillStyle = '#8b96a8';
        ctx.font = '11px Segoe UI';
        ctx.fillText('right-to-left rule: each dimension pair must be equal, or one of them must be 1', x0, yMid + Math.max(A[0], B[0]) * cell + 50);
      }
    }
    cv2.onResize(draw2);

    const selA = selectBox('Shape A', CHOICES.map(c => ({ value: c, label: '(' + c.replace('x', ', ') + ')' })), v => { shapeA = v; draw2(); }, '3x1');
    const selB = selectBox('Shape B', CHOICES.map(c => ({ value: c, label: '(' + c.replace('x', ', ') + ')' })), v => { shapeB = v; draw2(); }, '1x4');

    root.appendChild(demoPanel(
      'Broadcasting visualizer',
      'Solid cells are real data; dashed cells are the free "stretched" copies NumPy pretends exist. Try (3,2) + (3,4) to trigger the error every beginner meets.',
      cv2.canvas,
      h('div', { class: 'controls' }, [selA.el, selB.el]),
    ));

    root.appendChild(html(`
      <h3>The NumPy vocabulary you'll use daily</h3>
      <table class="info-table">
        <tr><th>Operation</th><th>Code</th><th>ML use</th></tr>
        <tr><td>Create</td><td><code>np.zeros((3,4))</code>, <code>np.random.randn(n, d)</code></td><td>Weight initialization</td></tr>
        <tr><td>Shape juggling</td><td><code>x.reshape(-1, 28*28)</code>, <code>x.T</code></td><td>Flattening images for a dense layer</td></tr>
        <tr><td>Matrix multiply</td><td><code>X @ W</code></td><td>Every single layer of every network</td></tr>
        <tr><td>Reductions</td><td><code>x.mean(axis=0)</code>, <code>x.sum()</code>, <code>x.argmax()</code></td><td>Loss averaging, picking the predicted class</td></tr>
        <tr><td>Masking</td><td><code>x[x > 0]</code>, <code>np.where(m, a, b)</code></td><td>ReLU is literally <code>np.maximum(0, x)</code></td></tr>
      </table>
      <div class="callout callout-info"><div class="callout-title">📌 The family tree</div>
      <strong>pandas</strong> wraps NumPy arrays with labeled rows/columns for data wrangling (<code>df.groupby</code>, <code>df.fillna</code>). <strong>PyTorch tensors</strong> are NumPy arrays that remember gradients and run on GPUs — <code>torch.tensor</code> code reads almost identically. Master NumPy and you've mastered the grammar of all of them.</div>
      <div class="callout callout-tip"><div class="callout-title">💡 The vectorization reflex</div>
      Whenever you catch yourself writing <code>for i in range(len(data))</code> around math — stop and look for the array operation. It exists 95% of the time, it's 10–1000× faster, and it's usually <em>more</em> readable.</div>
    `));
  },
};
