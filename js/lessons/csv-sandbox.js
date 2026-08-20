import { h, html, makeCanvas, makeScale, drawPoint, drawGrid, button, selectBox, statRow, clamp, CLASS_COLORS } from '../utils.js';

export default {
  id: 'csv-sandbox',
  emoji: '📂',
  title: 'Bring Your Own Data',
  level: 'Beginner',
  blurb: 'Drop a CSV file and watch linear regression, KNN, or K-Means train live on your data — no uploads, everything stays in your browser.',

  render(root) {
    root.appendChild(html(`
      <p>Every lesson on this site trains on toy datasets we built for you. Now it's your turn: <strong>drag in your own CSV</strong> and watch the same algorithms run on real data. Nothing leaves your machine — the file is parsed entirely in JavaScript.</p>
      <h3>How it works</h3>
      <div class="cards">
        <div class="card"><div class="card-icon">📂</div><h4>1. Drop a CSV</h4><p>Any CSV with numeric columns. Pick which column is X and which is Y (or the label for classification).</p></div>
        <div class="card"><div class="card-icon">🧠</div><h4>2. Choose an algorithm</h4><p>Linear Regression (fit a line), KNN (classify by neighbors), or K-Means (find clusters).</p></div>
        <div class="card"><div class="card-icon">📊</div><h4>3. See results live</h4><p>The model trains instantly and the results appear on the scatter plot — drag, zoom, learn.</p></div>
      </div>
    `));

    let csvData = null;
    let headers = [];
    let numericCols = [];
    let xCol = 0, yCol = 1;
    let algo = 'linear';
    let kValue = 3;

    const dropzone = h('div', { class: 'csv-dropzone' }, [
      h('div', { class: 'csv-dropzone-icon' }, '📂'),
      h('div', { class: 'csv-dropzone-text' }, 'Drop a CSV file here or click to browse'),
      h('div', { class: 'csv-dropzone-hint' }, 'Stays 100% in your browser — nothing uploaded'),
    ]);
    const fileInput = h('input', { type: 'file', accept: '.csv,.tsv,.txt', style: { display: 'none' } });
    root.appendChild(dropzone);
    root.appendChild(fileInput);

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

    const previewEl = h('div', {});
    root.appendChild(previewEl);

    const controlsWrap = h('div', { style: { display: 'none' } });
    root.appendChild(controlsWrap);

    const cv = makeCanvas(380);
    const cvWrap = h('div', { style: { display: 'none' } });
    cvWrap.appendChild(cv.canvas);
    root.appendChild(cvWrap);

    const stats = statRow(['Points', 'Algorithm', 'Result']);
    const statsWrap = h('div', { style: { display: 'none' } });
    statsWrap.appendChild(stats.el);
    root.appendChild(statsWrap);

    const resultEl = h('div', {});
    root.appendChild(resultEl);

    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return null;
      const sep = lines[0].includes('\t') ? '\t' : ',';
      const hdr = lines[0].split(sep).map(s => s.trim().replace(/^["']|["']$/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (vals.length === hdr.length) rows.push(vals);
      }
      return { headers: hdr, rows };
    }

    function handleFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseCSV(reader.result);
        if (!parsed || parsed.rows.length < 3) {
          previewEl.innerHTML = '<div class="callout callout-warn"><div class="callout-title">Could not parse</div>Need at least 3 data rows with a header. Check that the file is a valid CSV.</div>';
          return;
        }
        headers = parsed.headers;
        numericCols = [];
        for (let c = 0; c < headers.length; c++) {
          const vals = parsed.rows.map(r => parseFloat(r[c]));
          if (vals.filter(v => !isNaN(v)).length >= parsed.rows.length * 0.8) {
            numericCols.push(c);
          }
        }
        if (numericCols.length < 2) {
          previewEl.innerHTML = '<div class="callout callout-warn"><div class="callout-title">Not enough numeric columns</div>Need at least 2 numeric columns. Columns detected: ' + headers.join(', ') + '</div>';
          return;
        }
        csvData = parsed.rows.map(r => r.map(v => parseFloat(v)));
        xCol = numericCols[0];
        yCol = numericCols.length > 1 ? numericCols[1] : numericCols[0];

        dropzone.style.display = 'none';

        showPreview(parsed);
        showControls();
        cvWrap.style.display = '';
        statsWrap.style.display = '';
        runAlgorithm();
      };
      reader.readAsText(file);
    }

    function showPreview(parsed) {
      const maxRows = Math.min(5, parsed.rows.length);
      let tableHtml = '<table><tr>' + headers.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>';
      for (let i = 0; i < maxRows; i++) {
        tableHtml += '<tr>' + parsed.rows[i].map(v => `<td>${esc(v)}</td>`).join('') + '</tr>';
      }
      if (parsed.rows.length > 5) tableHtml += `<tr>${headers.map(() => '<td>...</td>').join('')}</tr>`;
      tableHtml += '</table>';
      previewEl.innerHTML = `<div class="csv-preview-table">${tableHtml}</div>
        <p style="font-size:0.82rem;color:var(--text-dim)">${parsed.rows.length} rows · ${headers.length} columns · ${numericCols.length} numeric</p>`;
    }

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function showControls() {
      controlsWrap.style.display = '';
      controlsWrap.innerHTML = '';

      const colOpts = numericCols.map(c => ({ value: String(c), label: headers[c] }));
      const xSel = selectBox('X column', colOpts, v => { xCol = parseInt(v); runAlgorithm(); }, String(xCol));
      const ySel = selectBox('Y column', colOpts, v => { yCol = parseInt(v); runAlgorithm(); }, String(yCol));
      const algoSel = selectBox('Algorithm', [
        { value: 'linear', label: 'Linear Regression' },
        { value: 'knn', label: 'KNN Classification' },
        { value: 'kmeans', label: 'K-Means Clustering' },
      ], v => { algo = v; runAlgorithm(); }, algo);

      controlsWrap.appendChild(h('div', { class: 'controls' }, [xSel.el, ySel.el, algoSel.el]));

      const changeFile = button('📂 Change file', () => {
        csvData = null;
        dropzone.style.display = '';
        previewEl.innerHTML = '';
        controlsWrap.style.display = 'none';
        cvWrap.style.display = 'none';
        statsWrap.style.display = 'none';
        resultEl.innerHTML = '';
        fileInput.value = '';
      }, true);
      controlsWrap.appendChild(h('div', { class: 'controls', style: { marginTop: '8px' } }, [changeFile]));
    }

    function getXY() {
      if (!csvData) return [];
      return csvData
        .map(r => ({ x: r[xCol], y: r[yCol] }))
        .filter(p => isFinite(p.x) && isFinite(p.y));
    }

    function normalize(pts) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of pts) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      }
      const rx = maxX - minX || 1, ry = maxY - minY || 1;
      const pad = 0.05;
      return {
        norm: pts.map(p => ({
          ...p,
          nx: -1 + 2 * pad + (p.x - minX) / rx * (2 - 4 * pad),
          ny: -1 + 2 * pad + (p.y - minY) / ry * (2 - 4 * pad),
        })),
        minX, maxX, minY, maxY,
      };
    }

    function runAlgorithm() {
      const raw = getXY();
      if (raw.length < 3) return;

      const { norm, minX, maxX, minY, maxY } = normalize(raw);
      stats.set('Points', String(raw.length));
      stats.set('Algorithm', algo === 'linear' ? 'Linear Regression' : algo === 'knn' ? `KNN (K=${kValue})` : `K-Means (K=${kValue})`);

      const scale = makeScale(cv, 30);

      if (algo === 'linear') {
        const n = raw.length;
        let sx = 0, sy = 0, sxy = 0, sx2 = 0;
        for (const p of raw) { sx += p.x; sy += p.y; sxy += p.x * p.y; sx2 += p.x * p.x; }
        const denom = n * sx2 - sx * sx;
        const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
        const intercept = (sy - slope * sx) / n;
        let ss_res = 0, ss_tot = 0;
        const mean_y = sy / n;
        for (const p of raw) { ss_res += (p.y - (slope * p.x + intercept)) ** 2; ss_tot += (p.y - mean_y) ** 2; }
        const r2 = ss_tot > 0 ? 1 - ss_res / ss_tot : 0;

        stats.set('Result', `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}  R² = ${r2.toFixed(3)}`);

        const drawFn = () => {
          const { ctx } = cv;
          ctx.clearRect(0, 0, cv.W, cv.H);
          drawGrid(cv, scale);
          const lx1 = -1, lx2 = 1;
          const toDataX = nx => minX + (nx - (-1)) / 2 * (maxX - minX);
          const toNormY = dy => -1 + 0.1 + (dy - minY) / ((maxY - minY) || 1) * 1.8;
          ctx.strokeStyle = '#e3b341';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(scale.toX(lx1), scale.toY(toNormY(slope * toDataX(lx1) + intercept)));
          ctx.lineTo(scale.toX(lx2), scale.toY(toNormY(slope * toDataX(lx2) + intercept)));
          ctx.stroke();
          for (const p of norm) drawPoint(ctx, scale.toX(p.nx), scale.toY(p.ny), '#58a6ff', 5);
        };
        drawFn();
        cv.onResize(drawFn);

        resultEl.innerHTML = '';
        resultEl.appendChild(h('div', { class: 'callout callout-tip' }, [
          h('div', { class: 'callout-title' }, 'Linear Regression Result'),
          `Equation: y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)} | R² = ${r2.toFixed(4)} (${r2 > 0.7 ? 'good fit' : r2 > 0.3 ? 'moderate fit' : 'weak fit'})`,
        ]));
      }
      else if (algo === 'kmeans') {
        const K = Math.min(kValue, raw.length);
        let centroids = norm.slice(0, K).map(p => ({ x: p.nx, y: p.ny }));
        let labels = new Array(norm.length).fill(0);

        for (let iter = 0; iter < 50; iter++) {
          for (let i = 0; i < norm.length; i++) {
            let best = 0, bestD = Infinity;
            for (let k = 0; k < K; k++) {
              const d = (norm[i].nx - centroids[k].x) ** 2 + (norm[i].ny - centroids[k].y) ** 2;
              if (d < bestD) { bestD = d; best = k; }
            }
            labels[i] = best;
          }
          const newC = centroids.map(() => ({ sx: 0, sy: 0, n: 0 }));
          for (let i = 0; i < norm.length; i++) {
            newC[labels[i]].sx += norm[i].nx;
            newC[labels[i]].sy += norm[i].ny;
            newC[labels[i]].n++;
          }
          let moved = false;
          for (let k = 0; k < K; k++) {
            if (newC[k].n === 0) continue;
            const nx = newC[k].sx / newC[k].n, ny = newC[k].sy / newC[k].n;
            if (Math.abs(nx - centroids[k].x) > 1e-6 || Math.abs(ny - centroids[k].y) > 1e-6) moved = true;
            centroids[k] = { x: nx, y: ny };
          }
          if (!moved) break;
        }

        let inertia = 0;
        for (let i = 0; i < norm.length; i++) {
          inertia += (norm[i].nx - centroids[labels[i]].x) ** 2 + (norm[i].ny - centroids[labels[i]].y) ** 2;
        }

        stats.set('Result', `${K} clusters · inertia = ${inertia.toFixed(3)}`);

        const drawFn = () => {
          const { ctx } = cv;
          ctx.clearRect(0, 0, cv.W, cv.H);
          drawGrid(cv, scale);
          for (let i = 0; i < norm.length; i++) {
            drawPoint(ctx, scale.toX(norm[i].nx), scale.toY(norm[i].ny), CLASS_COLORS[labels[i] % CLASS_COLORS.length], 5);
          }
          for (let k = 0; k < K; k++) {
            ctx.beginPath();
            ctx.arc(scale.toX(centroids[k].x), scale.toY(centroids[k].y), 9, 0, 2 * Math.PI);
            ctx.fillStyle = CLASS_COLORS[k % CLASS_COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
          }
        };
        drawFn();
        cv.onResize(drawFn);

        resultEl.innerHTML = '';
        resultEl.appendChild(h('div', { class: 'callout callout-tip' }, [
          h('div', { class: 'callout-title' }, 'K-Means Result'),
          `Found ${K} clusters with total inertia ${inertia.toFixed(4)}. Large outlined dots are centroids.`,
        ]));
      }
      else if (algo === 'knn') {
        const median = [...raw.map(p => p.y)].sort((a, b) => a - b)[Math.floor(raw.length / 2)];
        const labeled = norm.map((p, i) => ({ ...p, label: raw[i].y >= median ? 1 : 0 }));

        function knnPredict(px, py, k) {
          const dists = labeled.map(p => ({ d: (p.nx - px) ** 2 + (p.ny - py) ** 2, label: p.label }));
          dists.sort((a, b) => a.d - b.d);
          let votes = [0, 0];
          for (let i = 0; i < Math.min(k, dists.length); i++) votes[dists[i].label]++;
          return votes[1] >= votes[0] ? 1 : 0;
        }

        let correct = 0;
        for (const p of labeled) {
          if (knnPredict(p.nx, p.ny, kValue + 1) === p.label) correct++;
        }
        const acc = (correct / labeled.length * 100).toFixed(1);
        stats.set('Result', `accuracy = ${acc}% (median split)`);

        const drawFn = () => {
          const { ctx } = cv;
          ctx.clearRect(0, 0, cv.W, cv.H);
          drawGrid(cv, scale);
          const res = 30;
          const x0 = scale.toX(-1), x1 = scale.toX(1);
          const y0 = scale.toY(1), y1 = scale.toY(-1);
          const cw = (x1 - x0) / res, ch = (y1 - y0) / res;
          for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
              const dx = -1 + (i + 0.5) / res * 2;
              const dy = 1 - (j + 0.5) / res * 2;
              const pred = knnPredict(dx, dy, kValue);
              ctx.fillStyle = pred === 1 ? 'rgba(88,166,255,0.12)' : 'rgba(240,136,62,0.12)';
              ctx.fillRect(x0 + i * cw, y0 + j * ch, cw + 0.5, ch + 0.5);
            }
          }
          for (const p of labeled) {
            drawPoint(ctx, scale.toX(p.nx), scale.toY(p.ny), CLASS_COLORS[p.label], 5);
          }
        };
        drawFn();
        cv.onResize(drawFn);

        resultEl.innerHTML = '';
        resultEl.appendChild(h('div', { class: 'callout callout-tip' }, [
          h('div', { class: 'callout-title' }, 'KNN Classification Result'),
          `Split ${headers[yCol]} at median (${median.toFixed(2)}): below = class 0 (orange), above = class 1 (blue). Training accuracy: ${acc}% with K=${kValue}.`,
        ]));
      }
    }

    root.appendChild(html(`
      <h3>Tips for best results</h3>
      <div class="callout callout-info"><div class="callout-title">📌 CSV format</div>
      <ul style="margin:4px 0 0; padding-left:18px; font-size:0.88rem;">
        <li>First row should be column headers</li>
        <li>At least 2 numeric columns and 3+ data rows</li>
        <li>Comma or tab separated</li>
        <li>Try datasets from <a href="https://www.kaggle.com/datasets" target="_blank" rel="noopener" style="color:var(--accent)">Kaggle</a> — download as CSV, drop it here</li>
      </ul></div>
      <h3>Try a sample</h3>
      <p>Don't have a CSV handy? Click below to load a built-in dataset:</p>
    `));

    const sampleBtn = button('🎲 Load sample: Iris dataset', () => {
      const irisCSV = `sepal_length,sepal_width,petal_length,petal_width
5.1,3.5,1.4,0.2
4.9,3.0,1.4,0.2
4.7,3.2,1.3,0.2
4.6,3.1,1.5,0.2
5.0,3.6,1.4,0.2
5.4,3.9,1.7,0.4
4.6,3.4,1.4,0.3
5.0,3.4,1.5,0.2
4.4,2.9,1.4,0.2
4.9,3.1,1.5,0.1
7.0,3.2,4.7,1.4
6.4,3.2,4.5,1.5
6.9,3.1,4.9,1.5
5.5,2.3,4.0,1.3
6.5,2.8,4.6,1.5
5.7,2.8,4.5,1.3
6.3,3.3,4.7,1.6
4.9,2.4,3.3,1.0
6.6,2.9,4.6,1.3
5.2,2.7,3.9,1.4
6.3,3.3,6.0,2.5
5.8,2.7,5.1,1.9
7.1,3.0,5.9,2.1
6.3,2.9,5.6,1.8
6.5,3.0,5.8,2.2
7.6,3.0,6.6,2.1
4.9,2.5,4.5,1.7
7.3,2.9,6.3,1.8
6.7,2.5,5.8,1.8
7.2,3.6,6.1,2.5`;
      const blob = new Blob([irisCSV], { type: 'text/csv' });
      const file = new File([blob], 'iris_sample.csv', { type: 'text/csv' });
      handleFile(file);
    });
    root.appendChild(h('div', { class: 'controls' }, [sampleBtn]));
  }
};
