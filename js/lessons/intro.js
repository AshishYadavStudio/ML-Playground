// Lesson: What is Machine Learning?
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, pointerPos,
  seed, dataBlobs, makeScale, drawGrid, drawPoint, CLASS_COLORS,
} from '../utils.js';
import { onLeave } from '../app.js';

export default {
  id: 'intro',
  emoji: '👋',
  title: 'What is Machine Learning?',
  level: 'Beginner',
  blurb: 'Programs that learn rules from data instead of being told the rules. Race the machine!',

  render(root) {
    root.appendChild(html(`
      <p><strong>Traditional programming:</strong> a human writes the rules, the computer applies them to data to produce answers.</p>
      <p><strong>Machine learning flips this around:</strong> we give the computer data <em>and</em> the answers (examples), and it figures out the rules by itself.</p>
      <div class="formula">Traditional: &nbsp; Rules + Data → Answers &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; Machine Learning: &nbsp; Data + Answers → Rules</div>
      <p>Those learned "rules" are called a <strong>model</strong>. Once trained, the model can make predictions on data it has never seen before.</p>

      <h3>Try it: can you beat the machine?</h3>
      <p>Below are two groups of points (🟠 oranges and 🔵 blueberries, say). Your job — and the machine's job — is to find a line that separates them. <strong>Drag anywhere on the canvas to place and rotate your line</strong>, then hit <em>Let the machine learn</em> and watch it find its own line, step by step, purely from the data.</p>
    `));

    seed(7);
    const points = dataBlobs(90, 0.22);
    const cv = makeCanvas(400);
    const scale = makeScale(cv);

    // user line: defined by angle + offset; machine line: weights w1,w2,b (w1*x+w2*y+b=0)
    let user = { angle: Math.PI / 3, offset: 0.1 };
    let machine = null; // {w1,w2,b}
    let training = false;
    let raf = null;

    const stats = statRow(['Your accuracy', 'Machine accuracy', 'Training steps']);

    function userSide(p) {
      const nx = Math.cos(user.angle), ny = Math.sin(user.angle);
      return (p.x * nx + p.y * ny - user.offset) > 0 ? 1 : 0;
    }
    function machineSide(p) {
      return (machine.w1 * p.x + machine.w2 * p.y + machine.b) > 0 ? 1 : 0;
    }
    function accuracy(fn) {
      let correct = 0;
      for (const p of points) if (fn(p) === p.label) correct++;
      const acc = correct / points.length;
      return Math.max(acc, 1 - acc); // orientation-agnostic
    }

    function drawLineFromNormal(nx, ny, off, color, width) {
      // line: nx*x + ny*y = off  → draw across canvas
      const { ctx } = cv;
      const pts = [];
      for (const x of [-1.2, 1.2]) {
        if (Math.abs(ny) > 1e-6) pts.push({ x, y: (off - nx * x) / ny });
      }
      for (const y of [-1.2, 1.2]) {
        if (Math.abs(nx) > 1e-6) pts.push({ x: (off - ny * y) / nx, y });
      }
      const inside = pts.filter(p => p.x >= -1.25 && p.x <= 1.25 && p.y >= -1.25 && p.y <= 1.25);
      if (inside.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(scale.toX(inside[0].x), scale.toY(inside[0].y));
      ctx.lineTo(scale.toX(inside[1].x), scale.toY(inside[1].y));
      ctx.stroke();
    }

    let steps = 0;
    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      drawGrid(cv, scale);
      for (const p of points) drawPoint(ctx, scale.toX(p.x), scale.toY(p.y), CLASS_COLORS[p.label]);
      drawLineFromNormal(Math.cos(user.angle), Math.sin(user.angle), user.offset, '#e3b341', 2.5);
      if (machine) {
        const n = Math.hypot(machine.w1, machine.w2) || 1;
        drawLineFromNormal(machine.w1 / n, machine.w2 / n, -machine.b / n, '#39d2c0', 2.5);
      }
      stats.set('Your accuracy', (accuracy(userSide) * 100).toFixed(0) + '%');
      stats.set('Machine accuracy', machine ? (accuracy(machineSide) * 100).toFixed(0) + '%' : '—');
      stats.set('Training steps', String(steps));
    }
    cv.onResize(draw);

    // dragging: move offset with drag, rotate with drag near edges? Simpler: drag sets line through drag start, angle by drag direction.
    let dragStart = null;
    cv.canvas.addEventListener('pointerdown', e => {
      cv.canvas.setPointerCapture(e.pointerId);
      dragStart = pointerPos(cv.canvas, e);
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (!dragStart) return;
      const p = pointerPos(cv.canvas, e);
      const x0 = scale.fromX(dragStart.x), y0 = scale.fromY(dragStart.y);
      const x1 = scale.fromX(p.x), y1 = scale.fromY(p.y);
      const dx = x1 - x0, dy = y1 - y0;
      if (Math.hypot(dx, dy) > 0.03) {
        user.angle = Math.atan2(dx, -dy) + Math.PI / 2; // normal ⟂ drag direction
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        user.offset = mx * Math.cos(user.angle) + my * Math.sin(user.angle);
        draw();
      }
    });
    cv.canvas.addEventListener('pointerup', () => { dragStart = null; });

    function trainLoop() {
      if (!training) return;
      // a few perceptron-style logistic updates per frame
      for (let k = 0; k < 4; k++) {
        steps++;
        for (const p of points) {
          const z = machine.w1 * p.x + machine.w2 * p.y + machine.b;
          const pred = 1 / (1 + Math.exp(-z));
          const err = pred - p.label;
          const lr = 0.05;
          machine.w1 -= lr * err * p.x;
          machine.w2 -= lr * err * p.y;
          machine.b -= lr * err;
        }
      }
      draw();
      if (steps < 120) raf = requestAnimationFrame(trainLoop);
      else training = false;
    }

    const trainBtn = button('▶ Let the machine learn', () => {
      machine = { w1: (Math.random() - 0.5), w2: (Math.random() - 0.5), b: 0 };
      steps = 0;
      training = true;
      cancelAnimationFrame(raf);
      trainLoop();
    });
    const resetBtn = button('Reset', () => {
      machine = null; steps = 0; training = false;
      cancelAnimationFrame(raf);
      draw();
    }, true);
    onLeave(() => { training = false; cancelAnimationFrame(raf); });

    root.appendChild(demoPanel(
      'You vs. the machine',
      'Drag on the canvas to draw your separating line (yellow). Then press play — the teal line is learned from data.',
      cv.canvas,
      h('div', { class: 'controls' }, [trainBtn, resetBtn]),
      legend([[CLASS_COLORS[0], 'class 0 (orange)'], [CLASS_COLORS[1], 'class 1 (blue)'], ['#e3b341', 'your line'], ['#39d2c0', "machine's line"]]),
      stats.el,
    ));

    root.appendChild(html(`
      <p>What just happened? The machine started with a <em>random</em> line, measured how wrong it was on each point, and nudged the line to be a little less wrong — over and over. That simple recipe (<strong>guess → measure error → adjust</strong>) is the heart of almost all machine learning.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Collect examples:</strong> Gather data where you already know the right answers — e.g., photos labeled "cat" or "dog," emails marked "spam" or "not spam."</li>
          <li><strong>Choose a model family:</strong> Pick a flexible mathematical structure (a line, a tree, a neural network) that can represent many possible rules.</li>
          <li><strong>Initialize randomly:</strong> Start the model's internal numbers (parameters) at random values — its first "guess" is intentionally bad.</li>
          <li><strong>Measure the error:</strong> Compare the model's predictions to the known answers using a loss function — a single number that says "how wrong am I?"</li>
          <li><strong>Adjust and repeat:</strong> Nudge the parameters to reduce the error, then measure again. Repeat hundreds or thousands of times until the error is small and the model has "learned" a good rule from the data.</li>
        </ol>
      </div>

      <h3>The three flavors of machine learning</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🏷️</div><h4>Supervised learning</h4><p>Learn from labeled examples: spam / not-spam emails, house prices, cat photos with the answer attached. What you just watched above. Most of this course.</p></div>
        <div class="card"><div class="card-icon">🧩</div><h4>Unsupervised learning</h4><p>Find structure in data with no labels: grouping similar customers, compressing data, spotting anomalies. See the K-Means lesson.</p></div>
        <div class="card"><div class="card-icon">🎮</div><h4>Reinforcement learning</h4><p>Learn by trial and error with rewards: game-playing agents, robotics, recommendation loops. An agent acts, the world responds, the agent improves.</p></div>
      </div>
      <h3>Key vocabulary you'll see everywhere</h3>
      <table class="info-table">
        <tr><th>Term</th><th>Meaning</th><th>In the demo above</th></tr>
        <tr><td><b>Features</b></td><td>The inputs describing each example</td><td>The (x, y) position of a point</td></tr>
        <tr><td><b>Label</b></td><td>The answer we want to predict</td><td>Orange or blue</td></tr>
        <tr><td><b>Model</b></td><td>The learned rule mapping features → prediction</td><td>The teal line</td></tr>
        <tr><td><b>Training</b></td><td>The process of finding good model parameters</td><td>The animation you watched</td></tr>
        <tr><td><b>Parameters</b></td><td>The numbers inside the model that training adjusts</td><td>The line's slope and position</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Big idea</div>
      Machine learning = choosing a flexible family of rules, then using data to automatically pick the best rule from that family. Every lesson that follows is a variation on this theme.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Types of Learning & the No Free Lunch Theorem</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>At its core, machine learning is an optimization problem. Given a hypothesis space <em>H</em> (the set of all rules our model family can represent) and a loss function <em>L</em>, training finds:</p>
          <div class="formula">h* = argmin<sub>h∈H</sub> (1/n) Σ L(h(xᵢ), yᵢ)</div>
          <p>This is called <strong>Empirical Risk Minimization (ERM)</strong>. We minimize the average loss over our training examples as a proxy for minimizing loss on all possible future data (the true risk).</p>

          <h4>Intuition</h4>
          <p>Think of the model as a student cramming for an exam. The training data is the textbook, the loss function is the grade on practice problems, and the test set is the real exam. A good student doesn't just memorize practice answers — they learn the underlying patterns so they can handle new questions. That generalization gap — performing well on data you haven't seen — is what separates real learning from memorization (overfitting).</p>

          <h4>The Four Types of Machine Learning</h4>
          <p><strong>Supervised learning:</strong> learn from input-output pairs (x, y). <strong>Unsupervised learning:</strong> find structure in inputs x alone. <strong>Reinforcement learning:</strong> learn from delayed reward signals through trial and error. <strong>Self-supervised learning:</strong> a modern hybrid — the model generates its own labels from the data (e.g., "predict the next word"), unlocking massive unlabeled datasets. GPT and BERT are self-supervised.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> There is one "best" machine learning algorithm that works for all problems.</div>
          <p><strong>✅ Reality:</strong> The <strong>No Free Lunch Theorem</strong> (Wolpert & Macready, 1997) proves that no single algorithm outperforms all others across every possible problem. Averaged over all conceivable data distributions, every learner is equally good (or bad). The reason some algorithms work better in practice is that real-world data has structure — it isn't random noise — and different algorithms exploit different kinds of structure. Choosing the right algorithm means matching it to the structure in your data.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> More data always makes a model better.</div>
          <p><strong>✅ Reality:</strong> More data helps only if it's representative and correctly labeled. A million mislabeled examples will teach the model the wrong rule. Quality and diversity of data often matter more than sheer quantity.</p>

          <h4>Historical Context</h4>
          <p>The idea that machines could learn from data dates to Arthur Samuel's 1959 checkers program at IBM — one of the first programs to improve with experience. The term "machine learning" was coined by Samuel himself. The field went through multiple "AI winters" of reduced funding and interest, but the convergence of big data, powerful GPUs, and algorithmic breakthroughs (especially deep learning, ~2012) triggered the modern explosion. Today, ML powers search engines, voice assistants, medical imaging, autonomous vehicles, and the language models you interact with daily.</p>
        </div>
      </details>
    `));
  },
};
