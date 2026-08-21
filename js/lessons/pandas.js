// Lesson: pandas — interactive DataFrame filtering, groupby animation, missing data
import {
  h, html, makeCanvas, demoPanel, button, selectBox, statRow,
} from '../utils.js';

// mini dataset: passengers (Titanic-flavoured, hand-made)
const DATA = [
  { name: 'Ava',    age: 24, city: 'Paris',  fare: 71,  survived: 1 },
  { name: 'Ben',    age: 45, city: 'London', fare: 26,  survived: 0 },
  { name: 'Chloe',  age: 8,  city: 'Paris',  fare: 21,  survived: 1 },
  { name: 'Dev',    age: 33, city: 'Mumbai', fare: 8,   survived: 0 },
  { name: 'Ella',   age: 61, city: 'London', fare: 80,  survived: 1 },
  { name: 'Farid',  age: 29, city: 'Mumbai', fare: 9,   survived: 1 },
  { name: 'Grace',  age: 17, city: 'Paris',  fare: 30,  survived: 1 },
  { name: 'Hugo',   age: 52, city: 'London', fare: 13,  survived: 0 },
  { name: 'Iris',   age: 38, city: 'Mumbai', fare: 12,  survived: 0 },
  { name: 'Jack',   age: 4,  city: 'London', fare: 17,  survived: 1 },
  { name: 'Kira',   age: 27, city: 'Paris',  fare: 55,  survived: 1 },
  { name: 'Leo',    age: 41, city: 'Mumbai', fare: 7,   survived: 0 },
];

const FILTERS = {
  none:      { label: 'df                       (all rows)', code: 'df', fn: () => true },
  age30:     { label: "df[df['age'] > 30]", code: "df[df['age'] > 30]", fn: r => r.age > 30 },
  paris:     { label: "df[df['city'] == 'Paris']", code: "df[df['city'] == 'Paris']", fn: r => r.city === 'Paris' },
  combo:     { label: "df[(df['age'] < 30) & (df['survived'] == 1)]", code: "df[(df['age'] < 30) & (df['survived'] == 1)]", fn: r => r.age < 30 && r.survived === 1 },
  fare:      { label: "df[df['fare'] > df['fare'].mean()]", code: "df[df['fare'] > df['fare'].mean()]  # mean ≈ 29.1", fn: r => r.fare > 29.08 },
};

export default {
  id: 'pandas',
  emoji: '🐼',
  title: 'pandas: Data Wrangling',
  level: 'Beginner',
  blurb: 'The tool every data scientist opens first. Filter, group, and clean a real table interactively.',

  render(root) {
    root.appendChild(html(`
      <p>Real-world data lives in tables — CSVs, spreadsheets, databases. <strong>pandas</strong> is Python's table toolkit, and data scientists spend more hours in it than in any ML library. Its core object is the <strong>DataFrame</strong>: rows of examples, named columns of features (exactly the X you feed into scikit-learn).</p>
      <div class="formula">import pandas as pd &nbsp;&nbsp;·&nbsp;&nbsp; df = pd.read_csv("data.csv") &nbsp;&nbsp;·&nbsp;&nbsp; df.head(), df.describe(), df.shape</div>

      <div class="how-it-works">
        <h3>⚙️ How it works — step by step</h3>
        <ol>
          <li><strong>Load data into a DataFrame:</strong> <code>pd.read_csv("file.csv")</code> creates a DataFrame — a 2D table with labeled rows (index) and columns. Under the hood, each column is a NumPy array, so math is fast.</li>
          <li><strong>Inspect before you model:</strong> <code>df.head()</code> shows the first 5 rows. <code>df.info()</code> shows column types and missing counts. <code>df.describe()</code> gives summary statistics. This 10-second ritual catches 90% of data problems.</li>
          <li><strong>Select and filter:</strong> <code>df['age']</code> selects a column (returns a Series). <code>df[df['age'] > 30]</code> filters rows using a boolean mask — the most-used pandas operation. Use <code>&</code> (not <code>and</code>) to combine conditions, with parentheses around each.</li>
          <li><strong>Group and aggregate:</strong> <code>df.groupby('city')['fare'].mean()</code> splits rows into groups, applies an aggregation to each, and combines the results. This is how you answer "average X per category Y" in one line.</li>
          <li><strong>Handle missing data:</strong> Real data has holes (<code>NaN</code>). <code>df.isna().sum()</code> counts them. <code>df.fillna(value)</code> fills them. <code>df.dropna()</code> removes rows with holes. Always compute fill values from the training set only to avoid data leakage.</li>
        </ol>
      </div>

      <h3>Try it: boolean filtering</h3>
      <p>The most-used pandas move: <code>df[condition]</code> keeps only the rows where the condition is true. Pick a filter and watch which rows survive — the highlighted code is real pandas syntax.</p>
    `));

    // ---- Demo 1: filter explorer ----
    let filterKey = 'none';
    const codeEl = h('div', {
      style: {
        fontFamily: 'var(--font-mono, Consolas)', fontSize: '0.88rem', color: '#4fd6c5',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '10px 14px', marginBottom: '12px',
      },
    });
    const tableWrap = h('div', { style: { overflowX: 'auto' } });
    const stats1 = statRow(['Rows kept', 'Rows hidden']);

    function renderTable() {
      const flt = FILTERS[filterKey];
      codeEl.textContent = '>>> ' + flt.code;
      const tbl = h('table', { class: 'info-table', style: { margin: 0, fontSize: '0.82rem' } });
      tbl.appendChild(h('tr', {}, ['name', 'age', 'city', 'fare', 'survived'].map(c => h('th', {}, c))));
      let kept = 0;
      for (const r of DATA) {
        const keep = flt.fn(r);
        if (keep) kept++;
        tbl.appendChild(h('tr', {
          style: {
            opacity: keep ? '1' : '0.22',
            background: keep && filterKey !== 'none' ? 'rgba(79,214,197,0.06)' : 'transparent',
            transition: 'opacity 0.4s',
          },
        }, [
          h('td', {}, r.name), h('td', {}, String(r.age)), h('td', {}, r.city),
          h('td', {}, '$' + r.fare), h('td', {}, r.survived ? '✅' : '❌'),
        ]));
      }
      tableWrap.innerHTML = '';
      tableWrap.appendChild(tbl);
      stats1.set('Rows kept', String(kept));
      stats1.set('Rows hidden', String(DATA.length - kept));
    }

    const fSel = selectBox('Filter', Object.entries(FILTERS).map(([v, f]) => ({ value: v, label: f.code.split('#')[0].trim() })), v => { filterKey = v; renderTable(); }, 'none');

    root.appendChild(demoPanel(
      'DataFrame filter explorer',
      'Faded rows are dropped by the filter. Note the & (not "and") and the parentheses in the combined condition — the #1 pandas beginner error.',
      codeEl,
      tableWrap,
      h('div', { class: 'controls' }, [fSel.el]),
      stats1.el,
    ));
    renderTable();

    // ---- Demo 2: groupby animation ----
    root.appendChild(html(`
      <h3>groupby: split → apply → combine</h3>
      <p>The second superpower. <code>df.groupby('city')['fare'].mean()</code> answers "average fare <em>per city</em>" in one line. Under the hood it's three steps: <strong>split</strong> rows into groups, <strong>apply</strong> an aggregation to each, <strong>combine</strong> the results. Watch it happen:</p>
    `));

    const cv = makeCanvas(340);
    let phase = 0; // 0 = table, 1 = split, 2 = aggregated
    let agg = 'mean';
    const CITY_COLORS = { Paris: '#6d8dff', London: '#fb923c', Mumbai: '#4fd6c5' };

    function aggregate(rows) {
      const vals = rows.map(r => r.fare);
      if (agg === 'mean') return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (agg === 'max') return Math.max(...vals);
      if (agg === 'count') return vals.length;
      return vals.reduce((a, b) => a + b, 0);
    }

    function drawGroupby() {
      const { ctx, W, H } = cv;
      ctx.clearRect(0, 0, W, H);
      const cities = ['Paris', 'London', 'Mumbai'];
      ctx.font = '12px Inter, Segoe UI';

      if (phase === 0) {
        ctx.fillStyle = '#8b96b2';
        ctx.fillText('one table, rows in original order — press "① Split"', 14, 22);
        DATA.forEach((r, i) => {
          const y = 40 + i * 22;
          ctx.fillStyle = CITY_COLORS[r.city] + '33';
          ctx.fillRect(14, y, W - 28, 18);
          ctx.fillStyle = CITY_COLORS[r.city];
          ctx.fillRect(14, y, 4, 18);
          ctx.fillStyle = '#eaf0fa';
          ctx.fillText(`${r.name}  ·  ${r.city}  ·  $${r.fare}`, 26, y + 13);
        });
      } else {
        const colW = (W - 40) / 3;
        cities.forEach((city, ci) => {
          const x = 20 + ci * colW;
          const rows = DATA.filter(r => r.city === city);
          ctx.fillStyle = CITY_COLORS[city];
          ctx.font = 'bold 13px Inter, Segoe UI';
          ctx.fillText(city, x, 24);
          ctx.font = '12px Inter, Segoe UI';
          if (phase === 1) {
            rows.forEach((r, i) => {
              const y = 40 + i * 24;
              ctx.fillStyle = CITY_COLORS[city] + '33';
              ctx.fillRect(x, y, colW - 20, 20);
              ctx.fillStyle = '#eaf0fa';
              ctx.fillText(`${r.name} $${r.fare}`, x + 8, y + 14);
            });
          } else {
            // aggregated bar
            const v = aggregate(rows);
            const maxV = agg === 'count' ? 5 : 60;
            const bh = Math.min(H - 110, Math.max(12, v / maxV * (H - 110)));
            ctx.fillStyle = CITY_COLORS[city];
            ctx.fillRect(x, H - 50 - bh, colW - 30, bh);
            ctx.fillStyle = '#eaf0fa';
            ctx.font = 'bold 14px JetBrains Mono, Consolas';
            ctx.fillText(agg === 'count' ? String(v) : '$' + v.toFixed(1), x, H - 56 - bh);
            ctx.font = '11px Inter, Segoe UI';
            ctx.fillStyle = '#8b96b2';
            ctx.fillText(agg + '(fare)', x, H - 32);
          }
        });
        ctx.fillStyle = '#8b96b2';
        ctx.font = '11px Inter, Segoe UI';
        ctx.fillText(phase === 1 ? '② rows split into one group per city — press "② Aggregate"' : `③ combined result: df.groupby('city')['fare'].${agg}()`, 14, H - 10);
      }
    }
    cv.onResize(drawGroupby);

    const splitBtn = button('① Split by city', () => { phase = 1; drawGroupby(); });
    const aggBtn = button('② Aggregate', () => { phase = 2; drawGroupby(); });
    const resetG = button('↺ Table', () => { phase = 0; drawGroupby(); }, true);
    const aggSel = selectBox('Aggregation', ['mean', 'sum', 'max', 'count'], v => { agg = v; if (phase === 2) drawGroupby(); }, 'mean');

    root.appendChild(demoPanel(
      'groupby, animated',
      'Split → apply → combine. Change the aggregation to see count, sum, and max — same machinery, one word of code changed.',
      cv.canvas,
      h('div', { class: 'controls' }, [splitBtn, aggBtn, resetG, aggSel.el]),
    ));

    root.appendChild(html(`
      <h3>Missing data: the everyday battle</h3>
      <p>Real datasets are full of holes (<code>NaN</code>). Models crash on them, so every project starts with a strategy:</p>
      <table class="info-table">
        <tr><th>Code</th><th>What it does</th><th>When to use</th></tr>
        <tr><td><code>df.dropna()</code></td><td>Delete rows containing any NaN</td><td>Few holes, plenty of data</td></tr>
        <tr><td><code>df['age'].fillna(df['age'].median())</code></td><td>Fill holes with the median</td><td>Numeric columns; robust default</td></tr>
        <tr><td><code>df['city'].fillna('unknown')</code></td><td>Fill with a placeholder category</td><td>Categorical columns</td></tr>
        <tr><td><code>df.isna().sum()</code></td><td>Count holes per column</td><td>Always — first thing you run</td></tr>
      </table>
      <div class="callout callout-warn"><div class="callout-title">⚠️ Leakage again!</div>
      Fill missing values with the median <em>of the training set only</em> — computing it over all data before the train/test split leaks test information, exactly like the scaling trap in the Data &amp; Features lesson.</div>
      <h3>The pandas ten that cover 90% of daily work</h3>
      <table class="info-table">
        <tr><th>Operation</th><th>Code</th></tr>
        <tr><td>Load / save</td><td><code>pd.read_csv("f.csv")</code> · <code>df.to_csv("out.csv")</code></td></tr>
        <tr><td>Peek</td><td><code>df.head()</code> · <code>df.info()</code> · <code>df.describe()</code></td></tr>
        <tr><td>Select columns</td><td><code>df['age']</code> · <code>df[['age','fare']]</code></td></tr>
        <tr><td>Filter rows</td><td><code>df[df['age'] > 30]</code></td></tr>
        <tr><td>New column</td><td><code>df['fare_per_year'] = df['fare'] / df['age']</code></td></tr>
        <tr><td>Group &amp; aggregate</td><td><code>df.groupby('city')['fare'].mean()</code></td></tr>
        <tr><td>Sort</td><td><code>df.sort_values('fare', ascending=False)</code></td></tr>
        <tr><td>Join tables</td><td><code>pd.merge(df1, df2, on='id')</code></td></tr>
        <tr><td>Missing data</td><td><code>df.isna().sum()</code> · <code>df.fillna(...)</code></td></tr>
        <tr><td>To NumPy for ML</td><td><code>X = df[features].values</code></td></tr>
      </table>
      <div class="callout callout-tip"><div class="callout-title">💡 The feature-engineering connection</div>
      Every trick from the Data &amp; Features lesson — scaling, one-hot encoding, train/test splitting — is a pandas (or pandas + sklearn) one-liner. <code>pd.get_dummies(df['city'])</code> is one-hot encoding. This lesson is where theory becomes daily practice.</div>

      <details class="deep-dive">
        <summary>🔬 Deep Dive — .loc vs .iloc, SettingWithCopyWarning, and performance</summary>
        <div class="deep-dive-body">
          <h4>.loc vs .iloc</h4>
          <p>The two ways to index a DataFrame:</p>
          <div class="formula">.loc[row_label, col_label]  — by NAME (string index, column name)
.iloc[row_int, col_int]    — by POSITION (integer index, 0-based)</div>
          <p><code>df.loc[3]</code> gets the row with index label 3. <code>df.iloc[3]</code> gets the 4th row regardless of labels. After filtering or sorting, row labels are not contiguous — <code>.loc</code> and <code>.iloc</code> will return different rows. When in doubt, use <code>.iloc</code> for position-based access and <code>.loc</code> when you know the index labels.</p>

          <h4>The SettingWithCopyWarning</h4>
          <p>The most confusing pandas warning. It fires when you chain indexing:</p>
          <div class="formula">df[df['age'] > 30]['fare'] = 99  ← might not actually modify df!</div>
          <p>The problem: the first index (<code>df[df['age'] > 30]</code>) might return a copy, so assigning to <code>['fare']</code> modifies the copy, not the original. The fix: always use <code>.loc</code>:</p>
          <div class="formula">df.loc[df['age'] > 30, 'fare'] = 99  ← guaranteed to modify df</div>

          <h4>Performance Tips</h4>
          <ul>
            <li><strong>Avoid iterating rows:</strong> <code>for _, row in df.iterrows()</code> is 100–1000× slower than vectorized operations. If you need a loop, use <code>.apply()</code> or convert to NumPy first.</li>
            <li><strong>Use categorical dtypes:</strong> <code>df['city'] = df['city'].astype('category')</code> can reduce memory 90% for string columns with few unique values (like city, country, status).</li>
            <li><strong>Read only what you need:</strong> <code>pd.read_csv('big.csv', usecols=['col1','col2'])</code> avoids loading 50 unused columns into memory.</li>
          </ul>

          <h4>Common Misconceptions</h4>
          <div class="misconception"><strong>❌ Misconception:</strong> "pandas is for small data only."</div>
          <p><strong>✅ Reality:</strong> pandas handles millions of rows comfortably (tens of GB with careful dtype choices). For truly large data (hundreds of GB+), use Polars (a faster DataFrame library) or Dask (lazy, distributed pandas). But most ML datasets fit in pandas — the bottleneck is usually the model, not the data loading.</p>
          <div class="misconception"><strong>❌ Misconception:</strong> "You should use <code>apply()</code> for everything."</div>
          <p><strong>✅ Reality:</strong> <code>.apply()</code> calls a Python function per row — it's barely faster than a loop. Always look for a vectorized alternative first: <code>df['bmi'] = df['weight'] / (df['height'] ** 2)</code> is orders of magnitude faster than <code>df.apply(lambda row: row['weight'] / row['height']**2, axis=1)</code>.</p>

          <h4>Historical Context</h4>
          <p>Wes McKinney created pandas in 2008 at AQR Capital Management, a quantitative finance firm, because R's data.frame was great but Python needed its own. The name comes from "panel data" (an econometrics term), not the animal. pandas 1.0 (2020) stabilized the API after years of rapid evolution. The biggest design regret McKinney has discussed publicly is the copy/view ambiguity — which pandas 2.0 (2023) addressed with copy-on-write semantics.</p>
        </div>
      </details>
    `));
  },
};
