// Lesson: CNNs — draw on a grid, slide kernels over it, see feature maps live
import {
  h, html, makeCanvas, demoPanel, button, selectBox, legend, pointerPos,
} from '../utils.js';

const KERNELS = {
  'edge-h': { name: 'Horizontal edges', k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
  'edge-v': { name: 'Vertical edges', k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
  sharpen: { name: 'Sharpen', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
  blur: { name: 'Blur (average)', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]] },
  emboss: { name: 'Emboss', k: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]] },
};

const SIZE = 16; // input grid

export default {
  id: 'cnn',
  emoji: '👁️',
  title: 'Convolutional Networks',
  level: 'Advanced',
  blurb: 'How machines see: draw a picture, slide a filter over it, watch feature maps light up.',

  render(root) {
    root.appendChild(html(`
      <p>Feed a 1000×1000 image into a plain dense network and the first layer alone needs ~10⁹ weights. Worse — it has no idea that a cat in the top-left corner is the same cat as one in the bottom-right. <strong>Convolutional networks (CNNs)</strong> fix both problems with one idea:</p>
      <div class="callout callout-info"><div class="callout-title">The convolution idea</div>
      Learn one <strong>tiny filter</strong> (e.g. 3×3 = 9 weights), and <strong>slide it across the whole image</strong>, computing a dot product at every position. The output — a <em>feature map</em> — lights up wherever the pattern occurs, no matter where. Same weights everywhere = <em>translation invariance</em> + massive parameter savings.</div>
      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Tile the image with a small filter:</strong> A tiny weight matrix (typically 3×3 or 5×5) is placed at the top-left corner of the input image. This filter is the same for every position — the network learns what pattern to look for, not where to look.</li>
          <li><strong>Compute a dot product at each position:</strong> At every location, the filter values are multiplied element-wise with the underlying image patch and summed into a single number. High output means "this patch matches the filter's pattern."</li>
          <li><strong>Slide across the entire image:</strong> The filter moves one pixel at a time (the "stride"), producing a 2-D output called a <em>feature map</em>. Each pixel in the feature map tells you how strongly that pattern was detected at that location.</li>
          <li><strong>Apply ReLU, then pool:</strong> Negative responses are zeroed out (ReLU). Then a pooling layer (e.g. 2×2 max-pool) shrinks the map by keeping only the strongest activation in each small block — adding tolerance to small shifts.</li>
          <li><strong>Stack layers and classify:</strong> Multiple conv-pool rounds build a hierarchy: edges → textures → parts → objects. The final small feature maps are flattened into a vector and fed to dense layers that output class probabilities (e.g. "cat: 94%").</li>
        </ol>
      </div>

      <h3>Try it: be the convolution</h3>
      <p><strong>Draw on the left grid</strong> (drag to paint, right-click or toggle to erase). Pick a filter and <strong>hover over the output</strong> to see exactly which input patch × kernel produced each output pixel. Notice how the "vertical edges" filter ignores horizontal strokes entirely.</p>
    `));

    // input grid with a default drawing (a simple "7")
    let grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
    function drawDefault() {
      grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
      for (let x = 3; x <= 12; x++) grid[3][x] = 1;   // top bar
      for (let i = 0; i <= 8; i++) grid[4 + i][Math.round(12 - i * 0.9)] = 1; // diagonal
      for (let x = 5; x <= 10; x++) grid[8][x] = 0.6; // cross stroke
    }
    drawDefault();

    let kernelName = 'edge-v';
    let erasing = false;
    let hover = null; // {i,j} in output coords

    const cv = makeCanvas(360);

    function convolve() {
      const k = KERNELS[kernelName].k;
      const out = [];
      for (let i = 0; i < SIZE - 2; i++) {
        out.push([]);
        for (let j = 0; j < SIZE - 2; j++) {
          let s = 0;
          for (let di = 0; di < 3; di++)
            for (let dj = 0; dj < 3; dj++)
              s += grid[i + di][j + dj] * k[di][dj];
          out[i].push(s);
        }
      }
      return out;
    }

    // layout: input grid | kernel | output grid
    function layout() {
      const W = cv.W;
      const cell = Math.min(19, (W - 200) / (2 * SIZE));
      const gridW = cell * SIZE;
      const outCell = cell * SIZE / (SIZE - 2);
      const kx = gridW + 30;
      const ox = gridW + 130;
      return { cell, gridW, outCell, kx, ox, oy: 30, gy: 30 };
    }

    function valColor(v) {
      // map value to color: negative red, positive blue-white
      if (v >= 0) {
        const t = Math.min(1, v / 3);
        return `rgb(${Math.round(30 + 200 * t)},${Math.round(40 + 190 * t)},${Math.round(60 + 195 * t)})`;
      }
      const t = Math.min(1, -v / 3);
      return `rgb(${Math.round(30 + 210 * t)},${Math.round(40 + 40 * t)},${Math.round(60 + 20 * t)})`;
    }

    function draw() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const L = layout();
      const out = convolve();
      const k = KERNELS[kernelName].k;

      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#8b96a8';
      ctx.fillText(`input ${SIZE}×${SIZE} (draw here)`, 4, 18);
      ctx.fillText('kernel 3×3', L.kx, 18);
      ctx.fillText(`feature map ${SIZE - 2}×${SIZE - 2}`, L.ox, 18);

      // input
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
          const v = grid[i][j];
          ctx.fillStyle = `rgb(${Math.round(13 + v * 220)},${Math.round(17 + v * 210)},${Math.round(23 + v * 200)})`;
          ctx.fillRect(4 + j * L.cell, L.gy + i * L.cell, L.cell - 1, L.cell - 1);
        }
      }
      // highlight receptive field for hovered output pixel
      if (hover) {
        ctx.strokeStyle = '#e3b341';
        ctx.lineWidth = 2;
        ctx.strokeRect(4 + hover.j * L.cell - 1, L.gy + hover.i * L.cell - 1, L.cell * 3 + 1, L.cell * 3 + 1);
      }
      // kernel
      const kc = 26;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = valColor(k[i][j] * 2.2);
          ctx.fillRect(L.kx + j * kc, L.gy + 30 + i * kc, kc - 2, kc - 2);
          ctx.fillStyle = '#e6edf3';
          ctx.font = '10px Consolas';
          const label = Math.abs(k[i][j]) < 1 && k[i][j] !== 0 ? k[i][j].toFixed(1) : String(k[i][j]);
          ctx.fillText(label, L.kx + j * kc + 3, L.gy + 30 + i * kc + 16);
        }
      }
      // output
      for (let i = 0; i < SIZE - 2; i++) {
        for (let j = 0; j < SIZE - 2; j++) {
          ctx.fillStyle = valColor(out[i][j]);
          ctx.fillRect(L.ox + j * L.outCell, L.oy + i * L.outCell, L.outCell - 1, L.outCell - 1);
        }
      }
      if (hover) {
        ctx.strokeStyle = '#e3b341';
        ctx.lineWidth = 2;
        ctx.strokeRect(L.ox + hover.j * L.outCell - 1, L.oy + hover.i * L.outCell - 1, L.outCell + 1, L.outCell + 1);
        ctx.fillStyle = '#e3b341';
        ctx.font = 'bold 12px Consolas';
        ctx.fillText(`dot product = ${out[hover.i][hover.j].toFixed(2)}`, L.ox, L.oy + (SIZE - 2) * L.outCell + 18);
      }
    }
    cv.onResize(draw);

    let painting = false;
    function handlePaint(e) {
      const p = pointerPos(cv.canvas, e);
      const L = layout();
      const j = Math.floor((p.x - 4) / L.cell);
      const i = Math.floor((p.y - L.gy) / L.cell);
      if (i >= 0 && i < SIZE && j >= 0 && j < SIZE) {
        grid[i][j] = erasing ? 0 : 1;
        draw();
        return true;
      }
      // hover on output?
      const oj = Math.floor((p.x - L.ox) / L.outCell);
      const oi = Math.floor((p.y - L.oy) / L.outCell);
      if (oi >= 0 && oi < SIZE - 2 && oj >= 0 && oj < SIZE - 2) {
        hover = { i: oi, j: oj };
        draw();
      }
      return false;
    }
    cv.canvas.addEventListener('pointerdown', e => {
      painting = true;
      cv.canvas.setPointerCapture(e.pointerId);
      handlePaint(e);
    });
    cv.canvas.addEventListener('pointermove', e => {
      if (painting) handlePaint(e);
      else {
        const p = pointerPos(cv.canvas, e);
        const L = layout();
        const oj = Math.floor((p.x - L.ox) / L.outCell);
        const oi = Math.floor((p.y - L.oy) / L.outCell);
        const nh = (oi >= 0 && oi < SIZE - 2 && oj >= 0 && oj < SIZE - 2) ? { i: oi, j: oj } : null;
        if (JSON.stringify(nh) !== JSON.stringify(hover)) { hover = nh; draw(); }
      }
    });
    cv.canvas.addEventListener('pointerup', () => { painting = false; });

    const kSel = selectBox('Filter', Object.entries(KERNELS).map(([v, o]) => ({ value: v, label: o.name })), v => { kernelName = v; draw(); }, 'edge-v');
    const eraseBtn = button('✏️ Draw', () => {
      erasing = !erasing;
      eraseBtn.textContent = erasing ? '🧽 Erase' : '✏️ Draw';
    }, true);
    const clearBtn = button('Clear', () => { grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0)); draw(); }, true);
    const defaultBtn = button('Load "7"', () => { drawDefault(); draw(); }, true);

    root.appendChild(demoPanel(
      'Convolution studio',
      'Drag on the left grid to draw. Hover the feature map (right) to see which 3×3 input patch produced each value.',
      cv.canvas,
      h('div', { class: 'controls' }, [kSel.el, eraseBtn, clearBtn, defaultBtn]),
      legend([['#3a4a6b', 'positive response'], ['#c04a3c', 'negative response'], ['#e3b341', 'receptive field (hover)']]),
    ));

    root.appendChild(html(`
      <h3>From one filter to a full CNN</h3>
      <p>A real CNN layer learns <em>dozens</em> of filters in parallel — and crucially, the filter weights are <strong>learned by backprop</strong>, not hand-designed like the menu above. Early layers discover edge detectors on their own; deeper layers combine edges into textures, textures into parts, parts into objects:</p>
      <div class="formula">image → [conv → ReLU → pool] × N → flatten → dense → "cat: 94%"</div>
      <div class="cards">
        <div class="card"><div class="card-icon">🔍</div><h4>Convolution layer</h4><p>Slides k learned filters; outputs k feature maps. Parameters: only k × 3×3 × channels.</p></div>
        <div class="card"><div class="card-icon">⚡</div><h4>ReLU</h4><p>Zero out negative responses — keep only "pattern found here" signals.</p></div>
        <div class="card"><div class="card-icon">🗜️</div><h4>Pooling</h4><p>Downsample (e.g. keep the max of each 2×2 block). Builds tolerance to small shifts and shrinks computation.</p></div>
        <div class="card"><div class="card-icon">🧠</div><h4>Dense head</h4><p>After several conv/pool rounds the map is tiny; ordinary layers make the final call.</p></div>
      </div>
      <h3>The hierarchy of vision</h3>
      <table class="info-table">
        <tr><th>Layer depth</th><th>What its filters respond to</th></tr>
        <tr><td>Layer 1</td><td>Edges, color gradients (like the filters you just played with)</td></tr>
        <tr><td>Layer 2–3</td><td>Corners, curves, textures (fur, brick, grass)</td></tr>
        <tr><td>Layer 4–5</td><td>Object parts: eyes, wheels, windows</td></tr>
        <tr><td>Final layers</td><td>Whole concepts: faces, dogs, stop signs</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Historical moment</div>
      In 2012, AlexNet — a CNN trained on GPUs — cut the ImageNet error rate nearly in half overnight and single-handedly ignited the deep-learning era. Every phone camera, medical scanner, and self-driving car today runs descendants of that architecture (increasingly hybridized with the transformers you'll meet two lessons from now).</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Receptive Fields, Parameter Sharing & Landmark Architectures</summary>
        <div class="deep-dive-body">
          <h4>Mathematical Foundation</h4>
          <p>A 2-D discrete convolution between input <em>I</em> and kernel <em>K</em> of size <em>k×k</em> produces feature map <em>F</em>:</p>
          <div class="formula">F(i, j) = ∑<sub>m=0</sub><sup>k−1</sup> ∑<sub>n=0</sub><sup>k−1</sup> I(i+m, j+n) · K(m, n) + b</div>
          <p>With <em>C<sub>in</sub></em> input channels and <em>C<sub>out</sub></em> filters, the total parameter count per conv layer is <code>C<sub>out</sub> × C<sub>in</sub> × k × k + C<sub>out</sub></code> (weights + biases). A 3×3 conv layer with 64→128 channels has only 73,856 parameters — compare to the ~10<sup>9</sup> a fully connected layer on the same input would need.</p>

          <h4>Receptive Fields</h4>
          <p>Each neuron in a deeper layer "sees" a larger region of the original input — its <em>receptive field</em>. After <em>L</em> layers of 3×3 convolutions (no pooling), the receptive field grows to <code>(2L + 1) × (2L + 1)</code>. Two 3×3 layers have the same receptive field as one 5×5 layer (5×5 pixels) but use fewer parameters (2×9 = 18 vs. 25) and apply two non-linearities, making the function space richer. This is why modern architectures stack many small filters rather than using large ones.</p>

          <h4>Transposed Convolutions</h4>
          <p>Standard convolution shrinks spatial dimensions. A <em>transposed convolution</em> (sometimes called "deconvolution") does the reverse — it upsamples by inserting zeros between input elements and then convolving, producing a larger output. This is essential in encoder-decoder architectures like U-Net (medical image segmentation) and in the generator half of image GANs.</p>

          <h4>Intuition</h4>
          <p>Think of each convolutional filter as a rubber stamp that the network stamps across the whole image. Early stamps detect simple marks (edges, gradients); later stamps combine those marks into complex patterns (eyes, wheels). The key insight is <em>parameter sharing</em>: the same stamp is used everywhere, so a cat-ear detector learned in the top-left works equally in the bottom-right. This is why CNNs need far less data than fully connected networks and generalize across spatial positions.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "Convolution in CNNs is the same as mathematical convolution."</div>
          <p><strong>✅ Reality:</strong> Strictly, CNNs compute <em>cross-correlation</em>, not convolution — the kernel is not flipped. In pure math, convolution flips the kernel: <code>F(i,j) = ∑ I(i−m, j−n) · K(m,n)</code>. Since the kernels are learned, flipping makes no difference to the result, but the terminology is a historical misnomer.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Pooling layers are always necessary."</div>
          <p><strong>✅ Reality:</strong> Modern architectures like ResNets and ConvNeXt often replace pooling with strided convolutions (stride=2), which learn how to downsample rather than using a fixed max/average rule. This can improve accuracy at negligible extra cost.</p>

          <h4>Historical Context</h4>
          <p>The CNN idea traces to Kunihiko Fukushima's <em>Neocognitron</em> (1980), inspired by Hubel and Wiesel's Nobel-winning discovery that cat visual cortex neurons respond to oriented edges. Yann LeCun's <em>LeNet-5</em> (1998) was the first practical CNN, reading handwritten ZIP codes for the US Postal Service. The field then stalled for over a decade until Alex Krizhevsky's <em>AlexNet</em> (2012) proved that GPUs could train deep CNNs on massive data. The lineage continued: VGGNet (2014, deeper stacks of 3×3), GoogLeNet/Inception (2014, parallel multi-scale filters), and <em>ResNet</em> (2015, skip connections enabling 152+ layers — the residual idea you'll see again in transformers). Today, Vision Transformers (ViT) challenge pure CNNs, but hybrid architectures (ConvNeXt, EfficientNet) remain state-of-the-art for many vision tasks.</p>
        </div>
      </details>
    `));
  },
};
