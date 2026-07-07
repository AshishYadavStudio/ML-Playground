// Lesson: Backpropagation — step through forward and backward passes on a tiny network
import {
  h, html, makeCanvas, demoPanel, button, slider, statRow,
} from '../utils.js';

export default {
  id: 'backprop',
  emoji: '🔗',
  title: 'Backpropagation',
  level: 'Advanced',
  blurb: 'The chain rule as a message-passing algorithm — step through every number by hand.',

  render(root) {
    root.appendChild(html(`
      <p>Backpropagation answers the only question training ever asks: <strong>"if I nudge this weight a tiny bit, how much does the loss change?"</strong> — for every weight at once, in a single backward sweep. It's just the chain rule from calculus, organized as message passing on the computation graph.</p>
      <div class="formula">∂L/∂w = ∂L/∂out · ∂out/∂w &nbsp;&nbsp; — gradients flow backward, multiplying local derivatives</div>
      <h3>Step through it: a 2-neuron network</h3>
      <p>Network: input <code>x</code> → hidden neuron <code>h = tanh(w₁·x)</code> → output <code>ŷ = w₂·h</code>, with loss <code>L = (ŷ − y)²</code>. Target: <code>y = 0.5</code>. Press <strong>Next step</strong> and watch values flow forward (blue), then gradients flow backward (pink).</p>
    `));

    // fixed example values
    let w1 = 0.8, w2 = -1.2;
    const x = 1.5, y = 0.5;
    let step = 0; // 0..8
    let lr = 0.3;

    const cv = makeCanvas(340);
    const stats = statRow(['Step', 'Loss', 'w₁', 'w₂']);

    function compute() {
      const z = w1 * x;
      const hAct = Math.tanh(z);
      const yhat = w2 * hAct;
      const L = (yhat - y) ** 2;
      // backward
      const dL_dyhat = 2 * (yhat - y);
      const dL_dw2 = dL_dyhat * hAct;
      const dL_dh = dL_dyhat * w2;
      const dL_dz = dL_dh * (1 - hAct * hAct);
      const dL_dw1 = dL_dz * x;
      return { z, hAct, yhat, L, dL_dyhat, dL_dw2, dL_dh, dL_dz, dL_dw1 };
    }

    const STEP_DESCR = [
      '⓪ Ready. The graph shows x → [×w₁] → tanh → [×w₂] → ŷ → loss. Press Next.',
      '① FORWARD: z = w₁·x — multiply input by the first weight.',
      '② FORWARD: h = tanh(z) — squash through the activation.',
      '③ FORWARD: ŷ = w₂·h — the network\'s prediction.',
      '④ FORWARD: L = (ŷ − y)² — how wrong are we vs target y = 0.5?',
      '⑤ BACKWARD: ∂L/∂ŷ = 2(ŷ − y). The loss tells the output how to change.',
      '⑥ BACKWARD: ∂L/∂w₂ = ∂L/∂ŷ · h  (local gradient of ŷ w.r.t. w₂ is just h). Also pass ∂L/∂h = ∂L/∂ŷ · w₂ upstream.',
      '⑦ BACKWARD: through tanh: ∂L/∂z = ∂L/∂h · (1 − h²). Then ∂L/∂w₁ = ∂L/∂z · x. Every weight now knows its gradient!',
      '⑧ UPDATE: w ← w − η·∂L/∂w. Both weights step downhill. Press "Next" to run another full pass — watch the loss shrink!',
    ];

    function nodeBox(ctx, cx, cy, w, hgt, label, value, active, isGrad) {
      ctx.fillStyle = active ? (isGrad ? 'rgba(255,123,156,0.18)' : 'rgba(88,166,255,0.18)') : 'rgba(28,34,48,1)';
      ctx.strokeStyle = active ? (isGrad ? '#ff7b9c' : '#58a6ff') : '#2d3548';
      ctx.lineWidth = active ? 2 : 1;
      roundRect(ctx, cx - w / 2, cy - hgt / 2, w, hgt, 8);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 12px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - 4);
      ctx.fillStyle = active ? (isGrad ? '#ff7b9c' : '#58a6ff') : '#8b96a8';
      ctx.font = '11px Consolas';
      ctx.fillText(value, cx, cy + 12);
      ctx.textAlign = 'left';
    }
    function roundRect(ctx, x0, y0, w, hgt, r) {
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x0 + w, y0, x0 + w, y0 + hgt, r);
      ctx.arcTo(x0 + w, y0 + hgt, x0, y0 + hgt, r);
      ctx.arcTo(x0, y0 + hgt, x0, y0, r);
      ctx.arcTo(x0, y0, x0 + w, y0, r);
      ctx.closePath();
    }
    function arrow(ctx, x1, y1, x2, y2, color, width = 1.5) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw() {
      const v = compute();
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const yMid = H / 2 - 20;
      const xs = [W * 0.09, W * 0.27, W * 0.45, W * 0.63, W * 0.84];
      const bw = Math.min(95, W * 0.16);

      // forward arrows
      for (let i = 0; i < 4; i++) {
        const on = step >= i + 1 && step <= 4;
        arrow(ctx, xs[i] + bw / 2, yMid, xs[i + 1] - bw / 2, yMid, on ? '#58a6ff' : '#2d3548', on ? 2.5 : 1.5);
      }
      // backward arrows (below)
      const yB = yMid + 52;
      const backOn = i => (step === 5 && i === 3) || (step === 6 && i >= 2) || (step >= 7);
      for (let i = 3; i >= 0; i--) {
        const on = backOn(i);
        arrow(ctx, xs[i + 1] - bw / 2, yB, xs[i] + bw / 2, yB, on ? '#ff7b9c' : '#2d3548', on ? 2.5 : 1.5);
      }

      nodeBox(ctx, xs[0], yMid, bw, 44, 'input x', x.toFixed(2), step >= 1, false);
      nodeBox(ctx, xs[1], yMid, bw, 44, 'z = w₁·x', step >= 1 ? v.z.toFixed(3) : '?', step >= 1, false);
      nodeBox(ctx, xs[2], yMid, bw, 44, 'h = tanh(z)', step >= 2 ? v.hAct.toFixed(3) : '?', step >= 2, false);
      nodeBox(ctx, xs[3], yMid, bw, 44, 'ŷ = w₂·h', step >= 3 ? v.yhat.toFixed(3) : '?', step >= 3, false);
      nodeBox(ctx, xs[4], yMid, bw, 44, 'L = (ŷ−y)²', step >= 4 ? v.L.toFixed(3) : '?', step >= 4, false);

      // gradient boxes
      nodeBox(ctx, xs[4], yB, bw, 40, '∂L/∂ŷ', step >= 5 ? v.dL_dyhat.toFixed(3) : '?', step >= 5, true);
      nodeBox(ctx, xs[3], yB, bw, 40, '∂L/∂w₂', step >= 6 ? v.dL_dw2.toFixed(3) : '?', step >= 6, true);
      nodeBox(ctx, xs[2], yB, bw, 40, '∂L/∂h', step >= 6 ? v.dL_dh.toFixed(3) : '?', step >= 6, true);
      nodeBox(ctx, xs[1], yB, bw, 40, '∂L/∂w₁', step >= 7 ? v.dL_dw1.toFixed(3) : '?', step >= 7, true);

      // weight labels
      ctx.fillStyle = '#e3b341';
      ctx.font = 'bold 11px Consolas';
      ctx.textAlign = 'center';
      ctx.fillText(`w₁ = ${w1.toFixed(3)}`, (xs[0] + xs[1]) / 2, yMid - 32);
      ctx.fillText(`w₂ = ${w2.toFixed(3)}`, (xs[2] + xs[3]) / 2, yMid - 32);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8b96a8';
      ctx.font = '11px Segoe UI';
      ctx.fillText('forward pass →', 14, 20);
      ctx.fillStyle = '#ff7b9c';
      ctx.fillText('← backward pass (gradients)', 14, H - 14);

      stats.set('Step', `${step} / 8`);
      stats.set('Loss', v.L.toFixed(4));
      stats.set('w₁', w1.toFixed(4));
      stats.set('w₂', w2.toFixed(4));
      descr.textContent = STEP_DESCR[step];
    }
    cv.onResize(draw);

    const descr = h('div', {
      class: 'callout callout-info',
      style: { marginTop: '14px', minHeight: '3.2em' },
    }, STEP_DESCR[0]);

    const nextBtn = button('Next step ▸', () => {
      if (step < 8) { step++; }
      else {
        // apply update and restart the cycle
        const v = compute();
        w1 -= lr * v.dL_dw1;
        w2 -= lr * v.dL_dw2;
        step = 1;
      }
      draw();
    });
    const resetBtn = button('Reset all', () => { w1 = 0.8; w2 = -1.2; step = 0; draw(); }, true);
    const lrS = slider('Learning rate η', { min: 0.05, max: 1, step: 0.05, value: 0.3, fmt: v => v.toFixed(2) }, v => { lr = v; });

    root.appendChild(demoPanel(
      'Backprop, one arrow at a time',
      'Top row: values flow forward. Bottom row: gradients flow backward. Loop through several passes and watch the loss decay toward 0.',
      cv.canvas,
      descr,
      h('div', { class: 'controls' }, [nextBtn, resetBtn, lrS.el]),
      stats.el,
    ));

    root.appendChild(html(`
      <h3>The two rules of the backward pass</h3>
      <ol>
        <li><strong>Local derivative:</strong> each operation only needs to know its own derivative — tanh contributes (1 − h²), a multiply node contributes the <em>other</em> factor, addition just passes gradients through.</li>
        <li><strong>Chain rule:</strong> multiply the incoming gradient by the local derivative and pass it on. If a value feeds multiple paths, <em>add</em> the gradients arriving from each.</li>
      </ol>
      <p>That's the entire algorithm. Frameworks like PyTorch build the computation graph automatically as your code runs, then execute exactly this backward sweep when you call <code>loss.backward()</code> — it's called <strong>automatic differentiation (autograd)</strong>.</p>
      <h3>Why one sweep is a miracle</h3>
      <p>The naive alternative — nudge each weight, re-run the network, measure the change — costs one forward pass <em>per weight</em>. For a billion-parameter model that's a billion forward passes. Backprop gets every gradient in roughly the cost of <strong>two</strong> passes (one forward, one backward), which is the only reason training giant networks is possible at all.</p>
      <div class="callout callout-warn"><div class="callout-title">⚠️ Connecting the dots</div>
      Look at step ⑦: the gradient reaching w₁ got multiplied by (1 − h²) — the tanh derivative, at most 1 and usually much less. Stack 50 such layers and you're multiplying 50 small numbers: the <strong>vanishing gradient</strong> from the Activations lesson, now visible in the arithmetic. Residual connections (skip paths that add x back in) give gradients a derivative-1 highway around the squashes — that innovation is what made 100+ layer networks trainable.</div>
    `));
  },
};
