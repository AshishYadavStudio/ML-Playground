// Lesson: Reinforcement Learning — live Q-learning grid-world with policy + value map
import {
  h, html, makeCanvas, demoPanel, button, statRow, legend, clamp, lerp,
} from '../utils.js';
import { onLeave } from '../app.js';

const ROWS = 6, COLS = 6;
// layout: G=goal(+1), P=pit(-1), #=wall, S=start, .=empty
const LAYOUT = [
  '....G',
  '..#.P',
  '.#...',
  '...#.',
  'P.#..',
  'S....',
].map(r => r.padEnd(COLS, '.'));

function cellType(r, c) {
  const ch = LAYOUT[r][c];
  return ch === 'G' ? 'goal' : ch === 'P' ? 'pit' : ch === '#' ? 'wall' : ch === 'S' ? 'start' : 'empty';
}

export default {
  id: 'reinforcement-learning',
  emoji: '🎮',
  title: 'Reinforcement Learning',
  level: 'Intermediate',
  blurb: 'Learn by trial and error. Watch an agent discover its way to the goal, guided only by rewards.',

  render(root) {
    root.appendChild(html(`
      <p>No labeled examples, no dataset to cluster — just an <strong>agent</strong> acting in a <strong>world</strong>, receiving <strong>rewards</strong>, and learning which actions pay off. This is how you'd teach a dog a trick, how AlphaGo mastered Go, and how robots learn to walk: <strong>reinforcement learning (RL)</strong>.</p>
      <div class="formula">agent takes action → world gives reward + new state → agent updates its strategy → repeat</div>
      <ul>
        <li><strong>State:</strong> the situation the agent is in (here, which grid cell).</li>
        <li><strong>Action:</strong> what it can do (move up/down/left/right).</li>
        <li><strong>Reward:</strong> the feedback signal (+1 reaching the goal ⭐, −1 falling in a pit ☠, a tiny −0.02 per step to encourage speed).</li>
        <li><strong>Policy:</strong> the learned strategy — which action to take in each state.</li>
      </ul>

      <h3>Watch an agent learn</h3>
      <p>The agent starts knowing <em>nothing</em>. Press <strong>Train</strong> and watch it explore by trial and error — the arrows (its learned policy) and the colored value map sharpen as it discovers the route to the goal. Then press <strong>Watch agent</strong> to see it run the route it learned.</p>
    `));

    const S = ROWS * COLS;
    const A = 4; // up, right, down, left
    const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
    let Q = new Float64Array(S * A);
    const alpha = 0.5, gamma = 0.92;
    let epsilon = 1.0;
    let episodes = 0;
    let successHist = [];
    let running = false, raf = null;
    let agentPos = null; // {r,c} during "watch"
    let watching = false, watchTimer = null;

    const startS = (() => { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (cellType(r, c) === 'start') return r * COLS + c; return (ROWS - 1) * COLS; })();

    const cv = makeCanvas(400);
    const stats = statRow(['Episodes', 'Exploration ε', 'Success (last 20)', 'Best path']);

    const idx = (r, c) => r * COLS + c;
    const rc = s => ({ r: Math.floor(s / COLS), c: s % COLS });
    function stepEnv(s, a) {
      const { r, c } = rc(s);
      let nr = r + DR[a], nc = c + DC[a];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || cellType(nr, nc) === 'wall') { nr = r; nc = c; }
      const t = cellType(nr, nc);
      let reward = -0.02, done = false;
      if (t === 'goal') { reward = 1; done = true; }
      else if (t === 'pit') { reward = -1; done = true; }
      return { ns: idx(nr, nc), reward, done };
    }
    const maxQ = s => { let m = -Infinity; for (let a = 0; a < A; a++) m = Math.max(m, Q[s * A + a]); return m; };
    const argmaxQ = s => { let bi = 0, bv = -Infinity; for (let a = 0; a < A; a++) if (Q[s * A + a] > bv) { bv = Q[s * A + a]; bi = a; } return bi; };

    function runEpisode() {
      let s = startS, steps = 0, reached = false;
      while (steps < 80) {
        const a = Math.random() < epsilon ? (Math.random() * A) | 0 : argmaxQ(s);
        const { ns, reward, done } = stepEnv(s, a);
        Q[s * A + a] += alpha * (reward + gamma * maxQ(ns) - Q[s * A + a]);
        s = ns; steps++;
        if (done) { reached = cellType(rc(s).r, rc(s).c) === 'goal'; break; }
      }
      episodes++;
      successHist.push(reached ? 1 : 0);
      if (successHist.length > 20) successHist.shift();
      epsilon = Math.max(0.05, epsilon * 0.985);
    }

    function greedyPath() {
      const path = [startS];
      let s = startS, guard = 0;
      const seen = new Set([s]);
      while (guard++ < 40) {
        const t = cellType(rc(s).r, rc(s).c);
        if (t === 'goal' || t === 'pit') break;
        const a = argmaxQ(s);
        const { ns, done } = stepEnv(s, a);
        if (seen.has(ns)) break;
        path.push(ns); seen.add(ns); s = ns;
        if (done) break;
      }
      return path;
    }

    function valColor(v) {
      // v roughly in [-1, 1]
      const t = clamp((v + 1) / 2, 0, 1);
      let r, g, b;
      if (t < 0.5) { const u = t / 0.5; r = lerp(200, 40, u); g = lerp(60, 55, u); b = lerp(70, 90, u); }
      else { const u = (t - 0.5) / 0.5; r = lerp(40, 63, u); g = lerp(55, 185, u); b = lerp(90, 90, u); }
      return `rgb(${r | 0},${g | 0},${b | 0})`;
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const cell = Math.min((W - 20) / COLS, (H - 20) / ROWS);
      const ox = (W - cell * COLS) / 2, oy = (H - cell * ROWS) / 2;
      const path = episodes > 5 ? greedyPath() : [];
      const pathSet = new Set(path);
      const learned = episodes > 0;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const s = idx(r, c), t = cellType(r, c);
          const x = ox + c * cell, y = oy + r * cell;
          // background
          if (t === 'wall') ctx.fillStyle = '#05070c';
          else if (t === 'goal') ctx.fillStyle = 'rgba(74,222,128,0.35)';
          else if (t === 'pit') ctx.fillStyle = 'rgba(248,113,113,0.35)';
          else ctx.fillStyle = learned ? valColor(maxQ(s)) : '#121729';
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          // path highlight
          if (pathSet.has(s) && t !== 'goal') { ctx.fillStyle = 'rgba(227,179,65,0.22)'; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); }
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
          // icons
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.font = (cell * 0.4) + 'px serif';
          if (t === 'goal') ctx.fillText('⭐', x + cell / 2, y + cell / 2);
          else if (t === 'pit') ctx.fillText('☠️', x + cell / 2, y + cell / 2);
          else if (t === 'wall') { /* nothing */ }
          else if (learned && t !== 'wall') {
            // policy arrow
            const a = argmaxQ(s);
            const cx = x + cell / 2, cy = y + cell / 2, len = cell * 0.26;
            const ex = cx + DC[a] * len, ey = cy + DR[a] * len;
            ctx.strokeStyle = maxQ(s) > 0 ? '#e6edf3' : 'rgba(230,237,243,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - DC[a] * len, cy - DR[a] * len); ctx.lineTo(ex, ey); ctx.stroke();
            const ang = Math.atan2(DR[a], DC[a]);
            ctx.beginPath(); ctx.moveTo(ex, ey);
            ctx.lineTo(ex - 7 * Math.cos(ang - 0.5), ey - 7 * Math.sin(ang - 0.5));
            ctx.lineTo(ex - 7 * Math.cos(ang + 0.5), ey - 7 * Math.sin(ang + 0.5));
            ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
          }
          if (t === 'start') { ctx.fillStyle = '#4fd6c5'; ctx.font = 'bold ' + (cell * 0.22) + 'px Inter, sans-serif'; ctx.fillText('START', x + cell / 2, y + cell * 0.8); }
        }
      }
      // agent
      if (agentPos) {
        const ax = ox + agentPos.c * cell + cell / 2, ay = oy + agentPos.r * cell + cell / 2;
        ctx.beginPath(); ctx.arc(ax, ay, cell * 0.22, 0, 7);
        ctx.fillStyle = '#e3b341'; ctx.fill(); ctx.strokeStyle = '#05070c'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = (cell * 0.28) + 'px serif'; ctx.fillText('🤖', ax, ay);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const succ = successHist.length ? Math.round(successHist.reduce((a, b) => a + b, 0) / successHist.length * 100) : 0;
      stats.set('Episodes', String(episodes));
      stats.set('Exploration ε', epsilon.toFixed(2));
      stats.set('Success (last 20)', succ + '%');
      stats.set('Best path', path.length && cellType(rc(path[path.length - 1]).r, rc(path[path.length - 1]).c) === 'goal' ? (path.length - 1) + ' steps' : '—');
    }
    cv.onResize(draw);

    function trainLoop() {
      if (!running) return;
      for (let i = 0; i < 6; i++) runEpisode();
      draw();
      if (episodes < 600) raf = requestAnimationFrame(trainLoop);
      else { running = false; trainBtn.textContent = '🎓 Train'; }
    }
    function stopAll() { running = false; watching = false; cancelAnimationFrame(raf); clearTimeout(watchTimer); agentPos = null; }
    onLeave(stopAll);

    const trainBtn = button('🎓 Train', () => {
      if (watching) return;
      running = !running;
      trainBtn.textContent = running ? '⏸ Pause' : '🎓 Train';
      if (running) trainLoop();
    });
    const watchBtn = button('▶ Watch agent', () => {
      if (running || watching) return;
      const path = greedyPath();
      watching = true; let i = 0;
      (function stepWatch() {
        if (!watching || i >= path.length) { watching = false; agentPos = null; draw(); return; }
        agentPos = rc(path[i]); i++; draw();
        watchTimer = setTimeout(stepWatch, 320);
      })();
    }, true);
    const resetBtn = button('↺ Reset brain', () => {
      stopAll(); Q = new Float64Array(S * A); epsilon = 1.0; episodes = 0; successHist = [];
      trainBtn.textContent = '🎓 Train'; draw();
    }, true);

    draw();
    root.appendChild(demoPanel(
      'Q-learning grid-world',
      'Arrows = the learned policy (best move per cell). Cell color = how good that cell is (green = close to reward, red = danger). The gold trail is the current best route from START to ⭐.',
      cv.canvas,
      h('div', { class: 'controls' }, [trainBtn, watchBtn, resetBtn]),
      legend([['#4ade80', 'high value / goal'], ['#f87171', 'low value / pit'], ['#e3b341', 'best route & agent 🤖']]),
      stats.el,
    ));

    root.appendChild(html(`
      <div class="callout callout-tip">
        <div class="callout-title">🎮 Play: GridWorld Quest</div>
        Steer an agent through a reward grid yourself with the arrow keys, then unleash a Q-learning agent and see who plans better. <a href="../games/gridworld-quest/" style="color:var(--accent);font-weight:700;">Play GridWorld Quest →</a>
      </div>

      <h3>What actually happened: Q-learning</h3>
      <p>The agent stores a table of <strong>Q-values</strong> — <code>Q(state, action)</code> = "how good is taking this action here?" Every step, it nudges that estimate toward the reward it got plus the value of where it landed:</p>
      <div class="formula">Q(s,a) ← Q(s,a) + α·[ r + γ·max Q(s',a') − Q(s,a) ]</div>
      <ul>
        <li><strong>α (learning rate):</strong> how big each update is.</li>
        <li><strong>γ (discount):</strong> how much future rewards matter vs. immediate ones — γ = 0.92 makes the agent plan several steps ahead, which is why value "flows backward" from the goal across the map.</li>
        <li><strong>Reward shaping:</strong> the tiny −0.02 per step is why it learns the <em>shortest</em> path, not just any path.</li>
      </ul>

      <h3>The explore–exploit dilemma</h3>
      <p>Watch <strong>ε</strong> shrink as training goes. Early on the agent acts almost randomly (<em>explore</em> — try everything, discover the pits and the goal). As it learns, it increasingly follows its best-known route (<em>exploit</em>). Balancing these two is the central challenge of RL: explore too little and you never find the goal; too much and you never cash in on what you know.</p>

      <h3>RL in the real world</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">🎯</div><h4>Game-playing</h4><p>AlphaGo, AlphaZero, and Atari/StarCraft agents — superhuman play learned from reward alone.</p></div>
        <div class="card"><div class="card-icon">🤖</div><h4>Robotics</h4><p>Teaching robots to walk, grasp, and fly — reward for staying upright or reaching a target.</p></div>
        <div class="card"><div class="card-icon">💬</div><h4>Aligning LLMs</h4><p>RLHF — the final training stage of ChatGPT and Claude — uses RL, with human preferences as the reward.</p></div>
        <div class="card"><div class="card-icon">📈</div><h4>Control & ops</h4><p>Data-center cooling, trading, recommendation, traffic lights — anywhere decisions compound over time.</p></div>
      </div>

      <div class="callout callout-info"><div class="callout-title">📌 The three paradigms, together</div>
      <strong>Supervised</strong>: learn from labeled answers. <strong>Unsupervised</strong>: find structure with no answers. <strong>Reinforcement</strong>: learn from rewards through trial and error. Modern systems blend all three — an LLM is pretrained self-supervised, then aligned with RL. You now have the full map of how machines learn.</div>
    `));
  },
};
