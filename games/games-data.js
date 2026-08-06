// Shared catalog of all games — used by every game page's "more games" footer,
// the games hub (games/index.html), and the homepage highlight (js/app.js).
export const GAMES = [
  { slug: 'gradient-descent-golf', emoji: '⛳', title: 'Gradient Descent Golf', level: 'Beginner',
    lessons: ['gradient-descent', 'optimizers'],
    blurb: 'Pick the right learning rate to sink the ball in as few strokes as possible.' },
  { slug: 'fit-the-line', emoji: '📈', title: 'Fit the Line', level: 'Beginner',
    lessons: ['linear-regression'],
    blurb: 'Drag a line to minimize error against a noisy scatter — beat the least-squares solution.' },
  { slug: 'cluster-quest', emoji: '🧩', title: 'Cluster Quest', level: 'Beginner',
    lessons: ['unsupervised-learning', 'kmeans'],
    blurb: 'Place centroids by eye to group the data, then see how close you got to real K-Means.' },
  { slug: 'gridworld-quest', emoji: '🧭', title: 'GridWorld Quest', level: 'Intermediate',
    lessons: ['reinforcement-learning'],
    blurb: 'Steer an agent through a reward grid yourself, then watch Q-learning beat your score.' },
  { slug: 'overfit-or-not', emoji: '🎯', title: 'Overfit or Not?', level: 'Intermediate',
    lessons: ['overfitting'],
    blurb: 'Guess whether a model underfits, fits well, or overfits — before you see the test error.' },
  { slug: 'knn-detective', emoji: '🔍', title: 'KNN Detective', level: 'Beginner',
    lessons: ['knn'],
    blurb: 'Guess the class of a mystery point before K-Nearest Neighbors reveals its verdict.' },
  { slug: 'draw-the-boundary', emoji: '✏️', title: 'Draw the Boundary', level: 'Intermediate',
    lessons: ['logistic-regression', 'svm'],
    blurb: 'Draw the line that separates two classes — scored on accuracy and margin width.' },
  { slug: 'decision-tree-20-questions', emoji: '🌳', title: 'Decision Tree: 20 Questions', level: 'Intermediate',
    lessons: ['decision-trees'],
    blurb: 'Pick the best splits to classify everything with the fewest questions asked.' },
  { slug: 'neuron-wiring', emoji: '🧠', title: 'Neuron Wiring: Solve XOR', level: 'Advanced',
    lessons: ['neural-networks', 'backprop', 'activations'],
    blurb: 'Hand-tune the weights of a tiny neural net until it solves what a single line never could.' },
  { slug: 'rotate-to-compress', emoji: '🌀', title: 'Rotate to Compress', level: 'Intermediate',
    lessons: ['pca'],
    blurb: 'Rotate the axis by hand to capture the most variance — race the true principal component.' },
  { slug: 'attention-spotlight', emoji: '💡', title: 'Attention Spotlight', level: 'Advanced',
    lessons: ['transformers'],
    blurb: "Guess which words a transformer's self-attention would focus on to resolve meaning." },
  { slug: 'word-analogy', emoji: '🔤', title: 'Word Vector Analogies', level: 'Intermediate',
    lessons: ['embeddings'],
    blurb: 'king − man + woman = ? Solve analogies by navigating a toy embedding space.' },
  { slug: 'confusion-matrix-blitz', emoji: '🚨', title: 'Confusion Matrix Blitz', level: 'Beginner',
    lessons: ['metrics'],
    blurb: 'Classify rapid-fire, then compute precision, recall and F1 from your own results.' },
];

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** HTML for a "more games" strip on an individual game page. basePath: relative prefix to games/ dir (e.g. '../'). */
export function OTHER_GAMES_HTML(currentSlug, basePath = '../', limit = 3) {
  const pool = GAMES.filter(g => g.slug !== currentSlug);
  const others = pool.sort(() => Math.random() - 0.5).slice(0, limit);
  return `<div class="home-section-block" style="margin-top:44px">
    <div class="section-head"><h3>🎮 More games</h3><span class="sec-line"></span></div>
    <div class="lesson-grid">${others.map(g => `
      <a class="lesson-card" href="${basePath}${g.slug}/">
        <div class="lc-top"><div class="lc-emoji">${g.emoji}</div></div>
        <h4>${esc(g.title)}</h4>
        <p>${esc(g.blurb)}</p>
        <div class="lc-foot"><span class="level-badge level-${g.level}">${g.level}</span><span class="lc-arrow">Play →</span></div>
      </a>`).join('')}
    </div>
  </div>`;
}

/** Full grid of every game — used by the games hub page. basePath relative prefix (e.g. './'). */
export function ALL_GAMES_GRID_HTML(basePath = './') {
  return `<div class="lesson-grid">${GAMES.map(g => `
    <a class="lesson-card" href="${basePath}${g.slug}/">
      <div class="lc-top"><div class="lc-emoji">${g.emoji}</div></div>
      <h4>${esc(g.title)}</h4>
      <p>${esc(g.blurb)}</p>
      <div class="lc-foot"><span class="level-badge level-${g.level}">${g.level}</span><span class="lc-arrow">Play →</span></div>
    </a>`).join('')}
  </div>`;
}
