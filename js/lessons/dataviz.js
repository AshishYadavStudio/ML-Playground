// Lesson: Data Visualization — Anscombe's quartet, chart chooser, histogram bins
import {
  h, html, makeCanvas, demoPanel, slider, button, selectBox, statRow,
  seed, randn, rand,
} from '../utils.js';

// Anscombe's quartet (the real, classic values)
const ANSCOMBE = [
  { name: 'I', pts: [[10,8.04],[8,6.95],[13,7.58],[9,8.81],[11,8.33],[14,9.96],[6,7.24],[4,4.26],[12,10.84],[7,4.82],[5,5.68]] },
  { name: 'II', pts: [[10,9.14],[8,8.14],[13,8.74],[9,8.77],[11,9.26],[14,8.10],[6,6.13],[4,3.10],[12,9.13],[7,7.26],[5,4.74]] },
  { name: 'III', pts: [[10,7.46],[8,6.77],[13,12.74],[9,7.11],[11,7.81],[14,8.84],[6,6.08],[4,5.39],[12,8.15],[7,6.42],[5,5.73]] },
  { name: 'IV', pts: [[8,6.58],[8,5.76],[8,7.71],[8,8.84],[8,8.47],[8,7.04],[8,5.25],[19,12.50],[8,5.56],[8,7.91],[8,6.89]] },
];

export default {
  id: 'dataviz',
  emoji: '📊',
  title: 'Data Visualization',
  level: 'Beginner',
  blurb: "Summary statistics lie — Anscombe's famous quartet proves it. Learn to see your data first.",

  render(root) {
    root.appendChild(html(`
      <p>Before any model, professionals do one thing: <strong>plot the data</strong>. Not because it's pretty — because summary numbers hide disasters that a two-second glance reveals. This lesson is the proof.</p>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Always plot first:</strong> Before computing any statistic or training any model, visualize the raw data. A 5-second scatter plot catches outliers, non-linear relationships, clusters, and data quality issues that no summary number reveals.</li>
          <li><strong>Match chart to question:</strong> Line charts show trends over time. Bar charts compare categories. Scatter plots reveal relationships between two variables. Histograms show distributions. The same data tells different stories depending on the chart type.</li>
          <li><strong>Choose bin widths carefully:</strong> Histograms and heatmaps depend on binning. Too few bins hide structure; too many bins create noise. There's no universally correct number — it requires judgment based on the data's sample size and expected distribution.</li>
          <li><strong>Distrust summary statistics alone:</strong> Anscombe's Quartet (1973) proved that datasets with identical mean, variance, correlation, and regression line can look completely different. Modern variants (the Datasaurus Dozen) hammer the point further.</li>
          <li><strong>Plot your errors too:</strong> After training a model, plot residuals (predicted − actual) against inputs. Patterns in residuals reveal systematic failures that aggregate metrics like RMSE average away.</li>
        </ol>
      </div>

      <h3>Anscombe's Quartet: four datasets, one statistical fingerprint</h3>
      <p>The four datasets below — constructed by statistician Francis Anscombe in 1973 — have <strong>identical</strong> means, variances, correlation (0.816), and even the identical best-fit line <code>y = 0.5x + 3</code>. If you only looked at statistics, they'd be indistinguishable. Look:</p>
    `));

    // ---- Demo 1: Anscombe ----
    const cv1 = makeCanvas(380);
    let showLine = true;

    function drawAnscombe() {
      const { ctx, W, H } = cv1;
      ctx.clearRect(0, 0, W, H);
      const cols = W > 560 ? 4 : 2;
      const rows = cols === 4 ? 1 : 2;
      const pw = (W - 20) / cols, ph = (H - 20) / rows;
      ANSCOMBE.forEach((ds, i) => {
        const cx = 10 + (i % cols) * pw, cy = 10 + Math.floor(i / cols) * ph;
        const toX = x => cx + 12 + (x - 2) / 18 * (pw - 24);
        const toY = y => cy + ph - 26 - (y - 2) / 12 * (ph - 48);
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.strokeRect(cx + 6, cy + 6, pw - 12, ph - 12);
        ctx.fillStyle = '#8b96b2';
        ctx.font = 'bold 12px Inter, Segoe UI';
        ctx.fillText('Dataset ' + ds.name, cx + 14, cy + 22);
        if (showLine) {
          ctx.strokeStyle = 'rgba(251,191,36,0.75)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(toX(2), toY(0.5 * 2 + 3));
          ctx.lineTo(toX(20), toY(0.5 * 20 + 3));
          ctx.stroke();
        }
        for (const [x, y] of ds.pts) {
          ctx.beginPath();
          ctx.arc(toX(x), toY(y), 4, 0, Math.PI * 2);
          ctx.fillStyle = '#6d8dff';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.stroke();
        }
      });
    }
    cv1.onResize(drawAnscombe);

    root.appendChild(demoPanel(
      "Anscombe's quartet",
      'All four: mean x = 9.0, mean y = 7.5, correlation = 0.816, best-fit line y = 0.5x + 3 (yellow). Yet: I is honest linear data, II is a curve (linear model wrong!), III is ruined by one outlier, IV is a vertical stack plus one point doing all the work.',
      cv1.canvas,
      h('div', { class: 'controls' }, [
        button('Toggle identical fit lines', () => { showLine = !showLine; drawAnscombe(); }, true),
      ]),
    ));

    // ---- Demo 2: chart chooser ----
    root.appendChild(html(`
      <h3>Choosing the right chart</h3>
      <p>Each chart type answers a different question. The same mini-dataset (monthly sales of two products) drawn four ways — notice how each view makes one question easy and others impossible:</p>
    `));

    seed(313);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const prodA = months.map((_, i) => 40 + i * 6 + randn() * 6);
    const prodB = months.map((_, i) => 70 - i * 3 + randn() * 6);

    const CHARTS = {
      line: { name: '📈 Line — trends over time', q: 'Question it answers: "how is this changing over time?" A is growing, B is declining — instantly visible.' },
      bar: { name: '📊 Bar — compare categories', q: 'Question: "which is bigger in each period?" Good for discrete comparisons; trends are harder to see.' },
      scatter: { name: '⚬ Scatter — relationship between two variables', q: 'Question: "are A and B related?" Each dot is one month. The downward drift shows they move in opposite directions (negative correlation).' },
      hist: { name: '▂▅▇ Histogram — distribution of one variable', q: 'Question: "what values are typical?" Shows the spread of product A\'s sales; time information is gone entirely.' },
    };
    let chartType = 'line';
    const cv2 = makeCanvas(320);
    const chartNote = h('div', { class: 'demo-hint', style: { marginTop: '12px', marginBottom: 0 } });

    function drawChart() {
      const { ctx, W, H } = cv2;
      ctx.clearRect(0, 0, W, H);
      const pad = 44;
      const n = months.length;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(pad, 16, W - pad - 16, H - 56);
      ctx.font = '11px Inter, Segoe UI';
      const maxV = 100;
      const toY = v => H - 40 - v / maxV * (H - 72);

      if (chartType === 'line' || chartType === 'bar') {
        const bx = i => pad + 14 + i * (W - pad - 44) / (n - (chartType === 'bar' ? 0 : 1));
        months.forEach((m, i) => { ctx.fillStyle = '#5a6480'; ctx.fillText(m, bx(i) - 8, H - 22); });
        if (chartType === 'line') {
          [[prodA, '#6d8dff'], [prodB, '#fb923c']].forEach(([data, col]) => {
            ctx.strokeStyle = col; ctx.lineWidth = 2.5;
            ctx.beginPath();
            data.forEach((v, i) => i === 0 ? ctx.moveTo(bx(i), toY(v)) : ctx.lineTo(bx(i), toY(v)));
            ctx.stroke();
            data.forEach((v, i) => { ctx.beginPath(); ctx.arc(bx(i), toY(v), 3.5, 0, 7); ctx.fillStyle = col; ctx.fill(); });
          });
        } else {
          const bw = (W - pad - 44) / n;
          months.forEach((_, i) => {
            ctx.fillStyle = '#6d8dff';
            ctx.fillRect(bx(i) - bw * 0.32, toY(prodA[i]), bw * 0.28, H - 40 - toY(prodA[i]));
            ctx.fillStyle = '#fb923c';
            ctx.fillRect(bx(i) + bw * 0.04, toY(prodB[i]), bw * 0.28, H - 40 - toY(prodB[i]));
          });
        }
        ctx.fillStyle = '#6d8dff'; ctx.fillText('■ product A', pad + 6, 30);
        ctx.fillStyle = '#fb923c'; ctx.fillText('■ product B', pad + 90, 30);
      } else if (chartType === 'scatter') {
        const toX = v => pad + 14 + v / maxV * (W - pad - 44);
        months.forEach((m, i) => {
          ctx.beginPath();
          ctx.arc(toX(prodA[i]), toY(prodB[i]), 5.5, 0, 7);
          ctx.fillStyle = '#b78cff'; ctx.fill();
          ctx.fillStyle = '#5a6480'; ctx.fillText(m, toX(prodA[i]) + 8, toY(prodB[i]) + 4);
        });
        ctx.fillStyle = '#8b96b2';
        ctx.fillText('product A sales →', W / 2 - 40, H - 22);
        ctx.save(); ctx.translate(24, H / 2 + 40); ctx.rotate(-Math.PI / 2);
        ctx.fillText('product B sales →', 0, 0); ctx.restore();
      } else { // histogram of A
        const bins = 6, lo = 30, hi = 100;
        const counts = new Array(bins).fill(0);
        prodA.forEach(v => counts[Math.min(bins - 1, Math.floor((v - lo) / (hi - lo) * bins))]++);
        const bw = (W - pad - 44) / bins;
        counts.forEach((c, i) => {
          ctx.fillStyle = '#4fd6c5';
          const bh = c / Math.max(...counts) * (H - 90);
          ctx.fillRect(pad + 14 + i * bw + 2, H - 40 - bh, bw - 6, bh);
          ctx.fillStyle = '#5a6480';
          ctx.fillText(Math.round(lo + i * (hi - lo) / bins) + '+', pad + 14 + i * bw + 4, H - 22);
        });
        ctx.fillStyle = '#8b96b2';
        ctx.fillText('product A sales value →', W / 2 - 50, H - 8);
      }
      chartNote.textContent = CHARTS[chartType].q;
    }
    cv2.onResize(drawChart);

    const cSel = selectBox('Chart type', Object.entries(CHARTS).map(([v, c]) => ({ value: v, label: c.name })), v => { chartType = v; drawChart(); }, 'line');

    root.appendChild(demoPanel(
      'One dataset, four questions',
      'Switch chart types and notice: the data never changes, but what you can learn from it does.',
      cv2.canvas,
      h('div', { class: 'controls' }, [cSel.el]),
      chartNote,
    ));

    // ---- Demo 3: histogram bins ----
    root.appendChild(html(`
      <h3>The bin-width trap</h3>
      <p>Histograms have a hidden knob: the number of bins. Too few and structure vanishes; too many and noise masquerades as structure. This dataset secretly has <strong>two groups</strong> (a bimodal distribution) — find the bin count that reveals it:</p>
    `));

    seed(77);
    const bimodal = [];
    for (let i = 0; i < 300; i++) bimodal.push(i % 2 ? 35 + randn() * 8 : 65 + randn() * 7);
    const cv3 = makeCanvas(280);
    let nBins = 4;

    function drawHist() {
      const { ctx, W, H } = cv3;
      ctx.clearRect(0, 0, W, H);
      const lo = 0, hi = 100, pad = 30;
      const counts = new Array(nBins).fill(0);
      bimodal.forEach(v => counts[Math.max(0, Math.min(nBins - 1, Math.floor((v - lo) / (hi - lo) * nBins)))]++);
      const bw = (W - 2 * pad) / nBins;
      const maxC = Math.max(...counts);
      counts.forEach((c, i) => {
        const bh = c / maxC * (H - 70);
        ctx.fillStyle = 'rgba(109,141,255,0.75)';
        ctx.fillRect(pad + i * bw + 1, H - 34 - bh, Math.max(1, bw - 2), bh);
      });
      ctx.fillStyle = '#8b96b2';
      ctx.font = '11px Inter, Segoe UI';
      ctx.fillText('value 0 → 100  ·  ' + nBins + ' bins', pad, H - 12);
      if (nBins >= 8 && nBins <= 30) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 12px Inter, Segoe UI';
        ctx.fillText('✓ two peaks visible — the two hidden groups!', pad, 20);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px Inter, Segoe UI';
        ctx.fillText(nBins < 8 ? 'structure hidden — the two groups blur into one' : 'too grainy — noise starts to look like structure', pad, 20);
      }
    }
    cv3.onResize(drawHist);

    const binS = slider('Number of bins', { min: 2, max: 80, step: 1, value: 4 }, v => { nBins = v; drawHist(); });

    root.appendChild(demoPanel(
      'Same data, different stories',
      'Slide from 2 to 80 bins. The honest range here is roughly 8–30 — histograms require judgment, not defaults.',
      cv3.canvas,
      h('div', { class: 'controls' }, [binS.el]),
    ));

    root.appendChild(html(`
      <h3>The practitioner's checklist</h3>
      <ul>
        <li><strong>Plot before you model.</strong> A scatter matrix (<code>pd.plotting.scatter_matrix(df)</code>) takes one line and catches curves, outliers, and duplicates that wreck models silently.</li>
        <li><strong>Distrust single numbers.</strong> Correlation, mean, R² — Anscombe showed each can hide four different realities.</li>
        <li><strong>Check distributions</strong> of every feature — skew and outliers dictate scaling choices (Data &amp; Features lesson).</li>
        <li><strong>Plot your errors too</strong>: a residual plot (prediction error vs input) exposes patterns your loss number averages away.</li>
      </ul>
      <h3>The Python plotting stack</h3>
      <table class="info-table">
        <tr><th>Library</th><th>One-liner</th><th>Use for</th></tr>
        <tr><td><b>matplotlib</b></td><td><code>plt.scatter(x, y)</code></td><td>The foundation — full control over everything</td></tr>
        <tr><td><b>seaborn</b></td><td><code>sns.histplot(df, x='age', hue='city')</code></td><td>Beautiful statistical plots in one line</td></tr>
        <tr><td><b>pandas built-in</b></td><td><code>df['fare'].hist()</code></td><td>Quick looks while exploring</td></tr>
        <tr><td><b>plotly</b></td><td><code>px.scatter(df, x, y, color)</code></td><td>Interactive, zoomable charts (like this site!)</td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 Full circle</div>
      Every visualization in this course — decision boundaries, loss curves, attention heatmaps — is this lesson's principle applied to <em>models</em> instead of data: if you can see it, you can debug it. The best ML practitioners are compulsive plotters.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — Anscombe's legacy, chart deception, and accessibility</summary>
        <div class="deep-dive-body">
          <h4>The Datasaurus Dozen</h4>
          <p>In 2017, Matejka and Fitzmaurice extended Anscombe's idea dramatically: they generated 13 datasets — including one shaped like a dinosaur — that share <em>identical</em> statistics (mean, standard deviation, and correlation to two decimal places). The technique uses simulated annealing to iteratively move points toward a target shape while preserving statistical properties. This is now the go-to demonstration that summary statistics are necessary but never sufficient.</p>

          <h4>How Charts Lie</h4>
          <p>Common deceptive practices to watch for (and avoid):</p>
          <ul>
            <li><strong>Truncated y-axis:</strong> Starting the y-axis at 95 instead of 0 makes a 2% change look dramatic.</li>
            <li><strong>Dual y-axes:</strong> Two different scales on left/right make unrelated trends look correlated.</li>
            <li><strong>Cherry-picked time range:</strong> Any stock looks good if you pick the right start date.</li>
            <li><strong>3D charts:</strong> Perspective distortion makes bars closer to the viewer look larger. Never use 3D for 2D data.</li>
          </ul>

          <h4>Accessibility in Visualization</h4>
          <p>~8% of males have some form of color blindness. Best practices: (1) don't rely on color alone — use shapes, patterns, or labels too; (2) use colorblind-safe palettes (viridis, cividis); (3) maintain sufficient contrast; (4) add alt text to images. Tools like ColorBrewer and the Viz Palette checker help pick accessible colors.</p>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "More data points need more complex charts."</div>
          <p><strong>✅ Reality:</strong> With large datasets, simple charts often work better. A scatter plot with 10 million points becomes an opaque blob — use hexbin plots, density contours, or random subsampling. A histogram with 10 million values needs fewer bins than you'd think, because the large sample size makes each bin's count reliable.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "Beautiful charts are good charts."</div>
          <p><strong>✅ Reality:</strong> The goal is <em>clarity</em>, not aesthetics. Edward Tufte's principle: maximize the data-ink ratio — every pixel should convey information. Remove gridlines, 3D effects, gradient fills, and decorations that don't help the reader understand the data. A plain scatter plot with good axis labels beats a fancy infographic that obscures the pattern.</p>

          <h4>Historical Context</h4>
          <p>William Playfair invented the line chart (1786) and bar chart (1801). Florence Nightingale's polar area diagrams (1858) convinced the British government to improve military hospital sanitation — one of the first examples of data visualization changing policy. John Tukey formalized exploratory data analysis (EDA) in 1977, arguing that looking at data should precede formal testing. Anscombe's quartet (1973) was created specifically to counter the argument that "numerical calculations are exact, whereas graphs are rough." The rise of ggplot2 (Wickham, 2005) and seaborn (Waskom, 2012) made it trivial to produce publication-quality plots in one line of code.</p>
        </div>
      </details>
    `));
  },
};
