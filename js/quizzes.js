// ============ "Check your understanding" quizzes — 3 questions per lesson ============
// Format: { q, opts: [...], correct: index, why }

export const QUIZZES = {
  intro: [
    { q: 'What makes machine learning different from traditional programming?', opts: ['The computer runs faster', 'We give it data + answers and it finds the rules itself', 'It only works with images'], correct: 1, why: 'Traditional: rules + data → answers. ML flips it: data + answers → rules (the model).' },
    { q: 'In the demo, the points\' (x, y) positions were the…', opts: ['Labels', 'Features', 'Parameters'], correct: 1, why: 'Features are the inputs describing each example; the color (class) was the label; the line\'s slope/position were the parameters.' },
    { q: 'The core training recipe of almost all ML is…', opts: ['Guess → measure error → adjust → repeat', 'Memorize every example exactly', 'Ask a human to write better rules'], correct: 0, why: 'The machine starts with a random guess, measures how wrong it is (loss), and repeatedly nudges parameters to be less wrong.' },
  ],
  'supervised-learning': [
    { q: 'What defines supervised learning?', opts: ['It needs a fast computer', 'It learns from examples where the correct answer (label) is known', 'It has no training phase'], correct: 1, why: 'A "teacher" provides the right y for each x; the model learns the mapping f(x) ≈ y.' },
    { q: 'Predicting a house\'s price is a… task; predicting spam-or-not is a… task.', opts: ['classification / regression', 'regression / classification', 'both are clustering'], correct: 1, why: 'Regression predicts a continuous number (price); classification predicts a category (spam vs not).' },
    { q: 'The biggest practical bottleneck of supervised learning is…', opts: ['Slow prediction', 'Getting enough correctly-labeled data', 'Too many algorithms'], correct: 1, why: 'Labeling (a doctor marking tumors, humans rating answers) is slow and costly — which is why unsupervised and RL matter.' },
  ],
  'unsupervised-learning': [
    { q: 'Unsupervised learning works with data that has…', opts: ['Labels for every example', 'No labels at all — just raw observations', 'Only numeric features'], correct: 1, why: 'It discovers structure (groups, patterns, oddballs) without anyone providing the answers.' },
    { q: 'Grouping customers into segments with no predefined categories is…', opts: ['Classification', 'Clustering', 'Regression'], correct: 1, why: 'Clustering finds natural groupings by similarity — K-Means, DBSCAN, hierarchical.' },
    { q: 'Why is unsupervised learning harder to evaluate than supervised?', opts: ['It runs slower', 'With no labels there is no simple "accuracy" — results need human judgment', 'It uses more memory'], correct: 1, why: 'Is 3 clusters better than 4? It depends on your goal, so interpretation is required.' },
  ],
  'reinforcement-learning': [
    { q: 'A reinforcement-learning agent learns from…', opts: ['Labeled examples', 'Rewards received by trial and error in an environment', 'Clustering raw data'], correct: 1, why: 'Act → get reward + new state → update strategy → repeat. No dataset of answers.' },
    { q: 'The "explore vs exploit" dilemma is about…', opts: ['CPU vs GPU', 'Trying new actions to discover rewards vs. using the best-known action', 'Training vs test sets'], correct: 1, why: 'Explore too little and you never find the goal; exploit too little and you never cash in on what you learned. ε balances them.' },
    { q: 'The discount factor γ controls…', opts: ['The learning speed', 'How much future rewards matter vs. immediate ones', 'The number of actions'], correct: 1, why: 'A high γ makes the agent plan ahead, which is why value "flows backward" from the goal across the map.' },
  ],
  'data-features': [
    { q: 'Why do we scale features before training?', opts: ['To make the dataset smaller', 'So no feature dominates just because its raw numbers are bigger', 'To remove outliers automatically'], correct: 1, why: 'Income (20,000–200,000) would otherwise drown out age (20–70) in any distance- or gradient-based method.' },
    { q: 'When should you split off the test set?', opts: ['After training, to save time', 'Before doing anything else — even before fitting the scaler', 'Only if the dataset is large'], correct: 1, why: 'Anything learned from test data — even a scaling mean — leaks information and inflates your score.' },
    { q: '"Data leakage" means…', opts: ['Losing rows while loading a CSV', 'Test-set information sneaking into training', 'The model forgetting old data'], correct: 1, why: 'Leakage makes test scores optimistically wrong — the #1 silent killer of real ML projects.' },
  ],
  'linear-regression': [
    { q: 'MSE measures…', opts: ['The average squared vertical gap between points and the line', 'The length of the line', 'How many points the line touches'], correct: 0, why: 'Each red residual bar gets squared and averaged — the best line minimizes that number.' },
    { q: 'In ŷ = wx + b, what does training adjust?', opts: ['The data points', 'w and b (the parameters)', 'The number of points'], correct: 1, why: 'The model family is fixed (a line); training turns the two knobs w and b to minimize the loss.' },
    { q: 'Why learn gradient descent when a closed-form solution exists?', opts: ['The formula is illegal to use', 'Gradient descent is the method that scales to billions of parameters', 'Closed form only works on Tuesdays'], correct: 1, why: 'The normal equation works for linear regression, but gradient descent is the engine that trains every neural network.' },
  ],
  'gradient-descent': [
    { q: 'A learning rate that is too large causes…', opts: ['Very slow convergence', 'Overshooting that can make the loss explode (divergence)', 'The gradient to become zero'], correct: 1, why: 'Each step jumps past the valley floor and lands higher than it started — you saw the ball bounce out.' },
    { q: 'The gradient points in the direction of…', opts: ['Steepest increase — so we step the opposite way', 'The nearest minimum', 'The starting point'], correct: 0, why: 'θ ← θ − η·∇L: the minus sign is what makes it descend.' },
    { q: 'Why does stochastic (minibatch) gradient descent help?', opts: ['It is cheaper per step and its noise can escape shallow local minima', 'It guarantees the global minimum', 'It removes the learning rate'], correct: 0, why: 'Computing gradients on small random batches is faster, and the randomness jiggles the ball out of small dips.' },
  ],
  overfitting: [
    { q: 'The classic signature of overfitting is…', opts: ['High error on both train and test', 'Very low training error but high test error', 'Slow training'], correct: 1, why: 'The model memorized noise: brilliant on data it saw, lost on data it didn\'t.' },
    { q: 'L2 regularization fights overfitting by…', opts: ['Deleting training data', 'Penalizing large weights so the curve stays smooth', 'Adding more layers'], correct: 1, why: 'Big weights are what let the curve swing wildly; the λ·Σw² penalty makes wiggles expensive.' },
    { q: 'The most reliable general fix for overfitting is…', opts: ['A bigger model', 'More training data', 'A higher learning rate'], correct: 1, why: 'Noise averages out with more data; real patterns don\'t. Everything else is a workaround for limited data.' },
  ],
  metrics: [
    { q: 'A disease affects 1% of patients. A model predicting "healthy" for everyone has 99% accuracy. It is…', opts: ['Excellent', 'Completely useless — it finds zero sick patients', 'Slightly overfit'], correct: 1, why: 'With imbalanced classes, accuracy hides everything. Recall here is 0%.' },
    { q: 'For cancer screening, missing a sick patient is the costly error. Optimize…', opts: ['Precision (raise the threshold)', 'Recall (lower the threshold)', 'Accuracy'], correct: 1, why: 'Lowering the threshold catches more true positives at the cost of more false alarms — the right trade for screening.' },
    { q: 'AUC is useful because it…', opts: ['Depends on the perfect threshold', 'Summarizes model quality across all thresholds', 'Only works for balanced data'], correct: 1, why: 'The ROC curve sweeps every threshold; its area gives one threshold-independent number (1.0 = perfect, 0.5 = coin flip).' },
  ],
  'python-intro': [
    { q: 'The #1 Windows installation mistake is…', opts: ['Downloading the wrong color installer', 'Forgetting to tick "Add python.exe to PATH"', 'Installing an editor first'], correct: 1, why: 'Without PATH, the terminal answers "python is not recognized". Re-running the installer with the box ticked fixes it.' },
    { q: 'pip is…', opts: ['A Python game', 'The package installer that downloads libraries like NumPy from PyPI', 'A code editor'], correct: 1, why: 'pip install numpy is how all 500,000+ community packages arrive on your machine.' },
    { q: 'A virtual environment (venv) exists so that…', opts: ['Python runs faster', 'Each project gets isolated packages that can\'t clash with other projects', 'Your code is encrypted'], correct: 1, why: 'Project A can use numpy 1.x and project B numpy 2.x without ever fighting.' },
  ],
  'python-variables': [
    { q: 'In x = 5, the = sign means…', opts: ['"Equals", as in math', '"Store": compute the right side, attach the name on the left', '"Approximately"'], correct: 1, why: 'That\'s why x = x + 1 makes sense: compute x+1, then re-point the name x at the result.' },
    { q: '"42" + "1" gives…', opts: ['43', '"421" — both are strings, so + concatenates', 'An error'], correct: 1, why: 'Quoted values are text. Cast first: int("42") + 1 → 43.' },
    { q: 'Why is 0.1 + 0.2 == 0.3 False?', opts: ['Python has a bug', 'Floats are binary approximations; the sum is 0.30000000000000004', 'The == operator is broken'], correct: 1, why: 'Compare floats with a tolerance: abs(a − b) < 1e-9. In ML everything is floats — this matters.' },
  ],
  'python-collections': [
    { q: 'letters[1:4] returns items at indices…', opts: ['1, 2, 3, 4', '1, 2, 3 — the stop index is excluded', '2, 3, 4'], correct: 1, why: 'Start included, stop excluded. That\'s why lst[:n] gives exactly n items.' },
    { q: 'lst[::-1] is the classic trick for…', opts: ['Sorting a list', 'Reversing a list', 'Emptying a list'], correct: 1, why: 'Step −1 walks the whole list backwards.' },
    { q: 'After b = a (where a is a list), b.append(9)…', opts: ['Changes only b', 'Changes a too — both names point at the same list', 'Raises an error'], correct: 1, why: 'Assignment copies the reference, not the list. Use b = a.copy() for an independent copy.' },
  ],
  'python-control': [
    { q: 'In an if/elif/elif/else chain…', opts: ['Every true branch runs', 'Only the FIRST true branch runs; the rest are skipped', 'The else always runs'], correct: 1, why: 'Checked top to bottom, first match wins — order your conditions accordingly.' },
    { q: 'break vs continue:', opts: ['break skips one item; continue ends the loop', 'break ends the whole loop; continue skips to the next item', 'They are synonyms'], correct: 1, why: 'In the tracer, break on 0 meant 5 was never visited; continue on −2 just skipped it.' },
    { q: 'Choose while over for when…', opts: ['You know when to stop but not how many iterations (e.g. "until converged")', 'You have a list to walk through', 'You want speed'], correct: 0, why: 'for = known collection/count; while = unknown count, known stopping condition.' },
  ],
  'python-functions': [
    { q: 'A function with no return statement returns…', opts: ['0', 'None', 'Its last computed value'], correct: 1, why: 'None is Python\'s "no value". Forgetting a return is a classic silent bug.' },
    { q: 'In def train(data, epochs=10), the =10 means…', opts: ['epochs must equal 10', 'epochs is optional and defaults to 10 if not passed', 'epochs is a global'], correct: 1, why: 'Keyword arguments with defaults are why 30-parameter library functions stay usable.' },
    { q: 'During recursion, each call gets…', opts: ['Its own frame of local variables on the call stack', 'Shared variables with all other calls', 'A new copy of Python'], correct: 0, why: 'You watched factorial(4)\'s frames stack up and pop off — each n lived in its own frame.' },
  ],
  'python-advanced': [
    { q: '[x * 2 for x in nums if x > 5] is…', opts: ['A dict', 'A list comprehension: filter nums by x > 5, then double the survivors', 'A syntax error'], correct: 1, why: 'Expression + loop + optional condition, in one readable line.' },
    { q: 'In a class, self refers to…', opts: ['The class name', 'This particular instance — its own private data', 'The parent class'], correct: 1, why: 'Two Perceptron() objects each carry their own self.w — data travels with the object.' },
    { q: 'A generator (yield) is ideal for huge datasets because…', opts: ['It compresses the data', 'It produces one item at a time on demand — nothing is stored in memory', 'It runs on the GPU'], correct: 1, why: 'Streaming 100 GB through 8 GB of RAM: exactly what PyTorch\'s DataLoader does.' },
  ],
  'python-basics': [
    { q: 'In Python, code blocks (loop bodies, functions) are defined by…', opts: ['Curly braces { }', 'Indentation', 'Semicolons'], correct: 1, why: 'The visual structure is the logic — that\'s why Python reads like pseudocode.' },
    { q: 'counts.get(w, 0) returns…', opts: ['Always 0', 'The count for w, or 0 if w isn\'t in the dict yet', 'An error if w is missing'], correct: 1, why: 'The second argument is the default — the trick that makes one-line counting work.' },
    { q: 'What does return do inside a function?', opts: ['Prints the value', 'Sends the value back to the caller and exits the function immediately', 'Saves the value to a file'], correct: 1, why: 'Execution jumps back to the call site with the value; any code after the executed return is skipped.' },
  ],
  numpy: [
    { q: 'Vectorization means…', opts: ['Drawing vectors', 'Replacing Python loops with whole-array operations that run in compiled code', 'Using more RAM'], correct: 1, why: 'Same math, 10–1000× faster — the habit that makes Python viable for ML.' },
    { q: 'Broadcasting (3, 1) + (1, 4) gives shape…', opts: ['(3, 4)', 'Error', '(4, 3)'], correct: 0, why: 'Size-1 dimensions stretch for free: the column of 3 and row of 4 combine into a 3×4 grid.' },
    { q: 'ReLU in NumPy is literally…', opts: ['np.relu(x)', 'np.maximum(0, x)', 'x.relu()'], correct: 1, why: 'One vectorized elementwise max — a whole activation function with zero loops.' },
  ],
  'ml-code': [
    { q: 'StandardScaler().fit(...) must be called on…', opts: ['All the data', 'The training set only', 'The test set only'], correct: 1, why: 'Fitting the scaler on all data leaks test statistics into training — the leakage trap again.' },
    { q: 'Why call opt.zero_grad() every step in PyTorch?', opts: ['To reset the model weights', 'Because gradients accumulate by default and old ones must be cleared', 'To free GPU memory'], correct: 1, why: 'Forgetting it silently adds each batch\'s gradients to the last — a classic hard-to-spot bug.' },
    { q: 'Swapping LogisticRegression() for RandomForestClassifier() in sklearn requires changing…', opts: ['The entire script', 'Just that one line — fit/predict stay identical', 'Your loss function code'], correct: 1, why: 'The uniform fit/predict/score contract is sklearn\'s superpower: concepts transfer, API stays the same.' },
  ],
  pandas: [
    { q: "df[df['age'] > 30] returns…", opts: ['The ages above 30', 'A new DataFrame with only the rows where the condition is true', 'An error'], correct: 1, why: 'Boolean filtering: the condition makes a True/False column, and df[...] keeps the True rows.' },
    { q: 'groupby works in three steps:', opts: ['Sort → filter → print', 'Split into groups → apply an aggregation → combine results', 'Load → clean → save'], correct: 1, why: 'Split-apply-combine — the pattern behind every "average X per Y" question.' },
    { q: 'Filling missing ages with the median — which median?', opts: ['Of the whole dataset', 'Of the training set only', 'Of the test set'], correct: 1, why: 'Same leakage rule as scaling: all preprocessing statistics come from training data only.' },
  ],
  dataviz: [
    { q: "Anscombe's quartet proves that…", opts: ['Statistics are always wrong', 'Datasets with identical summary statistics can be wildly different — so plot your data', 'Scatter plots are outdated'], correct: 1, why: 'Same means, variances, correlation and fit line — but a curve, an outlier disaster, and a vertical stack hide inside.' },
    { q: 'A histogram with too few bins…', opts: ['Shows too much noise', 'Hides real structure (like two groups blurring into one)', 'Is always preferred'], correct: 1, why: 'You saw the bimodal data\'s two peaks vanish below ~8 bins. Bin width is a judgment call.' },
    { q: 'To show how sales change over months, the best chart is a…', opts: ['Histogram', 'Line chart', 'Pie chart'], correct: 1, why: 'Lines encode trends over an ordered axis; histograms throw away time entirely.' },
  ],
  'logistic-regression': [
    { q: 'The sigmoid function turns any number into…', opts: ['A probability between 0 and 1', 'An integer', 'A positive number only'], correct: 0, why: 'σ(z) = 1/(1+e⁻ᶻ) squashes (−∞, ∞) into (0, 1) — the bridge from scores to probabilities.' },
    { q: 'The decision boundary sits where…', opts: ['p = 0.5 (i.e. z = 0) — a straight line in 2-D', 'The data is densest', 'p = 1'], correct: 0, why: 'On one side the model leans class 1, on the other class 0; the tie line is the boundary.' },
    { q: 'Logistic regression fails on spiral data because…', opts: ['It can only ever draw straight boundaries', 'The learning rate is wrong', 'Spirals have too many points'], correct: 0, why: 'No line separates intertwined spirals — the exact limitation neural networks were built to fix.' },
  ],
  knn: [
    { q: 'How long does KNN training take?', opts: ['Hours', 'Zero — it just stores the data', 'One epoch'], correct: 1, why: 'The "model" is the dataset; all the work happens at prediction time (finding neighbors).' },
    { q: 'k = 1 gives a very jagged boundary because…', opts: ['Every single point rules its own region — classic overfitting', 'The algorithm is broken', 'Distances are wrong'], correct: 0, why: 'One noisy point creates its own little island; larger k averages the vote and smooths it.' },
    { q: 'In very high dimensions KNN struggles because…', opts: ['Computers lack RAM', 'All distances become nearly equal, so "nearest" stops meaning anything', 'Labels disappear'], correct: 1, why: 'The curse of dimensionality — why KNN works best on low-dimensional or embedded representations.' },
  ],
  svm: [
    { q: 'The SVM boundary is determined by…', opts: ['All points equally', 'Only the support vectors touching the margin', 'The class means'], correct: 1, why: 'You dragged interior points and nothing moved — delete them and the street is unchanged.' },
    { q: 'Among all separating lines, the SVM picks…', opts: ['The one with the widest margin', 'A random one', 'The shortest one'], correct: 0, why: 'A wide safety margin makes new points near the boundary less likely to be misclassified.' },
    { q: 'The kernel trick lets an SVM…', opts: ['Train faster on GPUs', 'Use rich implicit feature spaces (even infinite-dimensional) without computing them', 'Skip regularization'], correct: 1, why: 'Like lifting 1-D points onto z = x²: suddenly a straight cut separates them — computed implicitly at scale.' },
  ],
  'naive-bayes': [
    { q: 'The "naive" assumption is that…', opts: ['The data is small', 'Words appear independently of each other given the class', 'All emails are spam'], correct: 1, why: 'Obviously false ("free" and "winner" co-occur) — but classification only needs the right class to win.' },
    { q: 'Laplace smoothing fixes the problem of…', opts: ['Slow training', 'A never-seen word having probability 0 and nuking the whole product', 'Too many features'], correct: 1, why: 'Add 1 to every count so no likelihood is exactly zero.' },
    { q: 'The prior P(spam) represents…', opts: ['How spammy each word is', 'Your belief before reading a single word', 'The test accuracy'], correct: 1, why: 'Bayes = prior belief × evidence. If 40% of mail is spam, you start at 40% before any words.' },
  ],
  'decision-trees': [
    { q: 'At each node, a tree picks the split that…', opts: ['Makes the two children as pure as possible (lowest Gini)', 'Is exactly in the middle', 'A human chose'], correct: 0, why: 'Greedy: try every cut on every feature, keep the one that best separates the classes.' },
    { q: 'Limiting max depth is the tree\'s version of…', opts: ['Regularization against overfitting', 'Feature scaling', 'Gradient descent'], correct: 0, why: 'Deep trees carve sliver-regions around individual noise points — you watched it happen.' },
    { q: 'A random forest is…', opts: ['One very deep tree', 'Many diverse trees (random data/features) that vote', 'A tree trained on GPUs'], correct: 1, why: 'Averaging many unstable trees cancels their individual mistakes — robust and hard to overfit.' },
  ],
  kmeans: [
    { q: 'K-Means is unsupervised, meaning…', opts: ['It uses no labels — it finds structure on its own', 'It never converges', 'It needs a teacher network'], correct: 0, why: 'Only raw points go in; the cluster assignments come out.' },
    { q: 'The two alternating steps are…', opts: ['Forward and backward', 'Assign points to nearest centroid, then move each centroid to its points\' mean', 'Split and prune'], correct: 1, why: 'Each step can only lower the total distance (inertia), which guarantees convergence.' },
    { q: 'Different random starts can give different clusterings because…', opts: ['The data changes', 'K-Means can settle in local optima — so run several restarts', 'k is random'], correct: 1, why: 'You saw two centroids land in one blob. k-means++ initialization and restarts are the standard fixes.' },
  ],
  pca: [
    { q: 'PC1 is the direction that…', opts: ['Points at the first data point', 'Captures the maximum variance of the data', 'Is always horizontal'], correct: 1, why: 'Projecting onto it keeps the most spread — i.e. the most information — of any single direction.' },
    { q: 'PCA is mainly used to…', opts: ['Label data automatically', 'Compress many correlated features into few, losing minimal information', 'Increase dimensionality'], correct: 1, why: '90%+ of variance in 1 of 2 dimensions here; 784-pixel digits → ~50 components in practice.' },
    { q: 'PC2 is always…', opts: ['Perpendicular to PC1, capturing the most remaining variance', 'Parallel to PC1', 'The least important feature'], correct: 0, why: 'The components form a new rotated coordinate system, ordered by explained variance.' },
  ],
  'neural-networks': [
    { q: 'Remove all activation functions and a deep network becomes…', opts: ['Twice as fast', 'Equivalent to a single linear layer', 'More accurate'], correct: 1, why: 'Linear composed with linear is still linear — the nonlinearity is where all the folding power lives.' },
    { q: 'Why did the spiral need more layers/neurons than the blobs?', opts: ['Spirals have more points', 'More capacity is needed to bend space enough to separate intertwined classes', 'The learning rate was different'], correct: 1, why: 'Depth buys expressive folding; a tiny network underfits shapes it cannot bend around.' },
    { q: 'One training step is…', opts: ['Forward pass → loss → backprop → weight update', 'Sort → filter → predict', 'Guess randomly until correct'], correct: 0, why: 'The same four-beat loop from a 67-parameter toy up to GPT-scale models.' },
  ],
  activations: [
    { q: 'ReLU largely solved the vanishing gradient problem because…', opts: ['It outputs probabilities', 'Its derivative is exactly 1 for active units, so gradients survive deep stacks', 'It is smooth everywhere'], correct: 1, why: 'Sigmoid\'s max slope is 0.25; multiply 10 of those and gradients die. ReLU\'s 1s pass gradients through.' },
    { q: 'For a binary classifier\'s final layer, use…', opts: ['ReLU', 'Sigmoid — it outputs a probability', 'No activation ever'], correct: 1, why: 'Hidden layers want ReLU/GELU; the output layer\'s job is a valid probability.' },
    { q: 'The vanishing gradient problem is caused by…', opts: ['Multiplying many small derivatives during backprop', 'Too much training data', 'Large learning rates'], correct: 0, why: '0.2¹⁰ ≈ one ten-millionth — early layers receive essentially no learning signal.' },
  ],
  backprop: [
    { q: 'Backpropagation computes…', opts: ['The best architecture', '∂loss/∂w for every weight in one backward sweep', 'The training data order'], correct: 1, why: 'It answers "how much does nudging this weight change the loss?" for all weights at once.' },
    { q: 'Compared to nudging each weight individually, backprop costs…', opts: ['About the same', 'Roughly two passes total instead of one pass per weight', 'More memory than possible'], correct: 1, why: 'A billion-parameter model would need a billion forward passes the naive way; backprop needs ~2.' },
    { q: 'Residual (skip) connections help because they…', opts: ['Add more parameters', 'Give gradients a derivative-1 highway around the squashing layers', 'Remove the need for loss functions'], correct: 1, why: 'Addition passes gradients through unchanged — the innovation that unlocked 100+ layer networks.' },
  ],
  optimizers: [
    { q: 'Momentum helps in narrow valleys by…', opts: ['Increasing the learning rate', 'Accumulating velocity so zigzag components cancel and progress compounds', 'Skipping the gradient'], correct: 1, why: 'Like a heavy ball: side-to-side bounces cancel out while downhill motion builds up.' },
    { q: 'Adam combines…', opts: ['Two learning rates', 'Momentum with per-parameter adaptive step sizes', 'SGD with bigger batches'], correct: 1, why: 'Direction memory + dividing by each parameter\'s typical gradient size = the default optimizer of deep learning.' },
    { q: 'Learning-rate warmup means…', opts: ['Heating the GPU first', 'Starting with a tiny LR and ramping up, because early gradients are chaotic', 'Doubling the LR every epoch'], correct: 1, why: 'Essential for transformers: the first steps on random weights produce wild gradients you don\'t want to follow at full speed.' },
  ],
  cnn: [
    { q: 'A convolution layer reuses the same small filter across the whole image, which gives…', opts: ['Translation invariance and massive parameter savings', 'Slower training', 'Color accuracy'], correct: 0, why: 'A cat detector works anywhere in the image, and 9 weights replace millions.' },
    { q: 'A feature map "lights up" where…', opts: ['The image is brightest', 'The filter\'s pattern occurs in the input', 'Pixels are missing'], correct: 1, why: 'Each output pixel is the dot product of the filter with one input patch — high when they match.' },
    { q: 'Deeper CNN layers respond to…', opts: ['Edges only', 'Increasingly abstract things: textures → parts → whole objects', 'Random noise'], correct: 1, why: 'The hierarchy: layer 1 edges, middle layers textures/parts, top layers faces and objects.' },
  ],
  rnn: [
    { q: 'The hidden state of an RNN acts as…', opts: ['A fixed-size running memory of everything read so far', 'A copy of the whole input', 'The output layer'], correct: 0, why: 'Each step mixes the new input into the same-size vector: hₜ = tanh(W·xₜ + U·hₜ₋₁).' },
    { q: 'Plain RNNs forget long-range information because…', opts: ['They run out of RAM', 'Gradients vanish across many repeated squashing steps through time', 'Words are too long'], correct: 1, why: 'The same vanishing-gradient math as deep networks, but across time steps instead of layers.' },
    { q: 'LSTMs fix forgetting with…', opts: ['Bigger hidden states', 'Learned gates controlling an additive memory conveyor belt', 'More training epochs'], correct: 1, why: 'Forget/input/output gates decide what to erase, write, and reveal — gradients ride the additive belt for hundreds of steps.' },
  ],
  transformers: [
    { q: 'Self-attention lets each token…', opts: ['Look directly at every other token and weigh their relevance', 'Only see the previous token', 'Skip the sentence'], correct: 0, why: 'No memory bottleneck, fully parallel — the two RNN weaknesses fixed in one mechanism.' },
    { q: 'In Q/K/V terms, a token\'s Query represents…', opts: ['The information it hands over', 'What it is looking for in other tokens', 'Its position'], correct: 1, why: 'Query = "what I\'m looking for", Key = "what I contain", Value = "what I\'ll give you if you attend to me".' },
    { q: 'The cost of full self-attention grows…', opts: ['Linearly with sequence length', 'Quadratically — every token attends to every other', 'Not at all'], correct: 1, why: 'n tokens → n² attention scores. Doubling context = 4× compute; a whole research field softens this.' },
  ],
  embeddings: [
    { q: 'An embedding space is arranged so that…', opts: ['Similar things sit close together', 'Words are alphabetical', 'Vectors are all unit length'], correct: 0, why: 'Learned from context: words used similarly end up geometrically near each other.' },
    { q: 'king − man + woman ≈ queen works because…', opts: ['It\'s hard-coded', 'Directions in the space carry meaning (a "royalty direction", a "gender direction")', 'The words rhyme'], correct: 1, why: 'Analogous relationships become parallel vectors — emergent, not programmed.' },
    { q: 'Semantic search finds documents by…', opts: ['Exact keyword matching', 'Nearest-neighbor lookup in embedding space', 'Alphabetical order'], correct: 1, why: 'Embed the query and documents; closest vectors = most relevant, even with zero shared words. This powers RAG.' },
  ],
  generative: [
    { q: 'An autoencoder\'s bottleneck forces the network to…', opts: ['Train faster', 'Discover a compressed latent representation of the data\'s true structure', 'Use fewer layers'], correct: 1, why: 'Reconstruction through a tiny code only works if the code captures what actually matters.' },
    { q: 'A GAN converges when the discriminator…', opts: ['Reaches 100% accuracy', 'Is reduced to 50% — it can no longer tell real from fake', 'Stops training'], correct: 1, why: 'The forger has matched the real distribution, so the detective is coin-flipping — you watched the curve flatten.' },
    { q: 'A diffusion model generates images by…', opts: ['Copying training images', 'Starting from pure noise and repeatedly applying a learned denoising step', 'Sorting pixels'], correct: 1, why: 'It learns to reverse gradual noising; generation runs that reversal from static to structure.' },
  ],
  llms: [
    { q: 'The single training objective behind GPT/Claude-style pretraining is…', opts: ['Predict the next token', 'Classify sentences as good or bad', 'Translate to English'], correct: 0, why: 'Winning that game at internet scale forces the model to absorb grammar, facts, style, and reasoning.' },
    { q: 'Raising the temperature makes generation…', opts: ['More random and creative', 'More accurate', 'Faster'], correct: 0, why: 'Temperature reshapes the probability distribution before sampling: low = greedy and repetitive, high = chaotic.' },
    { q: 'Hallucinations happen because…', opts: ['The GPU overheats', 'The model always samples some fluent token, with no built-in "I don\'t know" state', 'The context window is full'], correct: 1, why: 'Fluency is not truth — the sampling loop produces plausible text even where training data gives no support.' },
  ],
  'ensemble-methods': [
    { q: 'What is the core difference between bagging and boosting?', opts: ['Bagging is faster', 'Bagging trains models in parallel on random samples; boosting trains sequentially, each fixing prior mistakes', 'Bagging uses more memory'], correct: 1, why: 'Bagging reduces variance by averaging independent models; boosting reduces bias by chaining focused corrections.' },
    { q: 'Random Forest is bagging plus...', opts: ['deep networks', 'random subsets of features at each split', 'reinforcement learning'], correct: 1, why: 'Random feature subsets prevent all trees from copying the same dominant feature, giving true diversity.' },
    { q: 'For most tabular data problems, the strongest baseline is usually...', opts: ['A deep neural network', 'Gradient-boosted trees (XGBoost / LightGBM)', 'K-Means'], correct: 1, why: 'Neural nets dominate images/audio/text. On spreadsheets, boosted trees still routinely win.' },
  ],
  'cross-validation': [
    { q: 'Why is K-fold cross-validation better than a single train/test split?', opts: ['It trains a bigger model', 'You get an estimate from K different splits, so lucky/unlucky splits are averaged out', 'It removes the need for a test set'], correct: 1, why: 'One split gives one number that depends on which points landed in test. K rotations average that away and give a spread too.' },
    { q: 'You fit StandardScaler on the full dataset before running K-fold. What is wrong?', opts: ['Nothing', 'Data leakage - the scaler saw information from the test folds during their turns', 'It uses too much memory'], correct: 1, why: 'The scaler statistics were computed with test-fold data included, inflating scores. Fit the scaler inside the fold (or inside a Pipeline).' },
    { q: 'Nested cross-validation is used to...', opts: ['Speed up training', 'Tune hyperparameters without leaking test-fold information into that tuning', 'Handle imbalanced classes'], correct: 1, why: 'Outer loop evaluates; inner loop (on each outer training set) picks hyperparameters - no cheating.' },
  ],
  'bayes-theorem': [
    { q: 'A test is 99% accurate for a disease affecting 1% of people. You test positive. Your rough chance of having the disease is...', opts: ['~99%', '~50%', '~9%'], correct: 1, why: 'False positives from the huge healthy population roughly equal true positives from the tiny sick population.' },
    { q: 'The prior probability P(H) represents...', opts: ['The probability of the evidence', 'What you believed about H before seeing the new evidence', 'The likelihood the evidence is wrong'], correct: 1, why: 'Bayes turns prior belief into posterior belief using the evidence likelihood.' },
    { q: 'Two identical positive tests for a rare disease. Compared to one positive test, your posterior belief should...', opts: ['Stay the same', 'Roughly multiply the odds again (compound evidence)', 'Reset to the prior'], correct: 1, why: 'Independent pieces of evidence each multiply the odds - that is why multiple independent tests are so much stronger than one.' },
  ],
  'feature-engineering': [
    { q: 'On the XOR demo, adding the feature x*y made a linear model jump from ~50% to ~99% accuracy because...', opts: ['The model became nonlinear', 'The new feature is directly predictive; the linear model just had to weight it', 'The dataset shrank'], correct: 1, why: 'The algorithm did not change; the input features did. Encoding domain knowledge as features is the essence of feature engineering.' },
    { q: 'One-hot encoding is a bad choice when the categorical variable has...', opts: ['Only 3 categories', 'Millions of unique values (like user IDs)', 'A natural order'], correct: 1, why: 'Millions of columns is infeasible; use embeddings or target encoding instead.' },
    { q: 'The #1 leakage trap in feature engineering is...', opts: ['Using too few features', 'Building features (aggregates, target encodings) using data from the future or the test set', 'Using too many features'], correct: 1, why: 'A feature that could not have been known at inference time will inflate CV scores and destroy production performance.' },
  ],
  autoencoders: [
    { q: 'Why does an autoencoder need a bottleneck narrower than its input?', opts: ['It runs faster', 'Without a bottleneck it would just copy input to output and learn nothing useful', 'It uses less memory'], correct: 1, why: 'The narrow middle forces the network to discover a compressed code that captures what matters.' },
    { q: 'A denoising autoencoder is trained by...', opts: ['Making the bottleneck bigger', 'Feeding corrupted inputs and asking the network to reconstruct the clean original', 'Removing the decoder'], correct: 1, why: 'The corruption/reconstruction game forces the network to learn what parts of the input are signal vs noise.' },
    { q: 'Stable Diffusion runs its expensive diffusion process in a compressed latent space produced by a VAE. Why?', opts: ['To improve accuracy', 'Because diffusing a small 64x64 latent is much cheaper than a 512x512 pixel image, at similar quality', 'To reduce hallucinations'], correct: 1, why: 'A pretrained VAE shrinks the tensor ~48x, so all downstream compute is much cheaper.' },
  ],
  diffusion: [
    { q: 'What does a diffusion model actually learn to predict?', opts: ['The pixel values of the final image', 'The noise that was added at each step', 'A label for the image'], correct: 1, why: 'Predicting noise gives a stable, mean-zero target; the reverse process subtracts predicted noise step by step.' },
    { q: 'Classifier-free guidance controls...', opts: ['The image resolution', 'How strongly the model steers toward the text prompt vs producing a generic sample', 'The number of training steps'], correct: 1, why: 'Higher guidance = more literal, less creative output. It is the prompt weight every UI exposes.' },
    { q: 'Why did diffusion mostly replace GANs for text-to-image generation?', opts: ['Diffusion is faster to sample', 'Diffusion trains stably with a simple MSE loss - no adversarial min-max collapse', 'GANs need bigger networks'], correct: 1, why: 'GAN training is notoriously flaky; diffusion stable MSE loss scaled up cleanly to billions of images.' },
  ],
  'fine-tuning': [
    { q: 'LoRA adds trainable low-rank matrices A and B such that...', opts: ['B dot A is added to a frozen base weight matrix W', 'W is replaced entirely by A dot B', 'The optimizer is changed'], correct: 0, why: 'The base weights stay frozen; only the tiny A and B get gradients. Total trainable params drop to ~1% of the base.' },
    { q: 'QLoRA extends LoRA by...', opts: ['Adding more layers', 'Quantizing the frozen base weights to 4 bits, letting a 65B model fit on one 48GB GPU', 'Removing the decoder'], correct: 1, why: 'The base does not need gradients so its precision can be dropped; the LoRA adapters stay in bf16 for training stability.' },
    { q: 'You need the LLM to answer questions about last night news. Which should you reach for first?', opts: ['LoRA fine-tune', 'RAG (retrieval-augmented generation)', 'QLoRA'], correct: 1, why: 'RAG handles fresh, changing facts. Fine-tuning is for style, format, or narrow-domain skills.' },
  ],
  rag: [
    { q: 'What are the three steps of a RAG pipeline?', opts: ['Train, validate, deploy', 'Retrieve, augment, generate', 'Encode, decode, compare'], correct: 1, why: 'Embed and retrieve top-k chunks -> augment the prompt with them -> generate the grounded answer.' },
    { q: 'A key advantage of RAG over fine-tuning for factual QA is...', opts: ['RAG models are smaller', 'Updates are instant (re-embed the doc) and answers can cite specific sources', 'RAG uses less GPU'], correct: 1, why: 'Fine-tuned knowledge is baked into weights, uncitable, and expensive to update. RAG updates in seconds.' },
    { q: 'Hybrid search in RAG combines...', opts: ['Text and image models', 'Keyword (BM25) and dense semantic embeddings, often via reciprocal-rank fusion', 'GPUs and CPUs'], correct: 1, why: 'Keyword search catches exact terms; semantic search catches meaning. Combining them beats either alone.' },
  ],
};
