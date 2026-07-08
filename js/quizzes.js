// ============ "Check your understanding" quizzes — 3 questions per lesson ============
// Format: { q, opts: [...], correct: index, why }

export const QUIZZES = {
  intro: [
    { q: 'What makes machine learning different from traditional programming?', opts: ['The computer runs faster', 'We give it data + answers and it finds the rules itself', 'It only works with images'], correct: 1, why: 'Traditional: rules + data → answers. ML flips it: data + answers → rules (the model).' },
    { q: 'In the demo, the points\' (x, y) positions were the…', opts: ['Labels', 'Features', 'Parameters'], correct: 1, why: 'Features are the inputs describing each example; the color (class) was the label; the line\'s slope/position were the parameters.' },
    { q: 'The core training recipe of almost all ML is…', opts: ['Guess → measure error → adjust → repeat', 'Memorize every example exactly', 'Ask a human to write better rules'], correct: 0, why: 'The machine starts with a random guess, measures how wrong it is (loss), and repeatedly nudges parameters to be less wrong.' },
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
};
