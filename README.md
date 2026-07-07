# 🧠 ML Playground — Learn Machine Learning Visually

An interactive website that teaches machine learning and deep learning **visually**, from complete beginner to expert. Every lesson pairs plain-language explanations with hands-on demos you can poke, drag, and train live in the browser — no installs, no math prerequisites, no frameworks.

## Running it

The site is pure static HTML/CSS/JS (ES modules), so it just needs any static file server:

```
python serve.py 8317
```

then open http://localhost:8317. (`serve.py` is a stdlib-only static server with caching disabled so edits show up immediately; ES modules are blocked on `file://`, so a server is required.)

## Curriculum (26 interactive lessons)

**🌱 Foundations**
1. **What is Machine Learning?** — race a perceptron: draw your own separating line vs. the machine's learned one
2. **Data, Features & Splits** — feature scaling toggle, interactive train/test split
3. **Linear Regression** — drag the line handles to minimize MSE, then watch gradient descent fit it
4. **Gradient Descent** — drop a ball on a loss curve; crank the learning rate until it diverges
5. **Overfitting & Regularization** — polynomial degree slider with live train/test error curves + ridge λ
6. **Evaluation Metrics** — drag a decision threshold; confusion matrix, precision/recall, and ROC/AUC update live

**🐍 Python for ML**
7. **Python Essentials** — step through code line by line with a live variable panel and console (4 programs)
8. **NumPy & Vectorization** — a real in-browser speed race (loop vs vectorized, 5M ops) + broadcasting visualizer
9. **From Concepts to Code** — annotated scikit-learn workflow and PyTorch training loop with an animated pipeline

**📊 Classical ML**
10. **Logistic Regression** — sigmoid explorer + a decision boundary trained live with cross-entropy
11. **K-Nearest Neighbors** — drag the mystery point, tune k, toggle the full decision map
12. **Support Vector Machines** — draggable points with live max-margin retraining + animated kernel trick lift
13. **Naive Bayes** — build a spam email word by word; evidence bars and a verdict gauge update live
14. **Decision Trees & Forests** — grow a tree one greedy split at a time on XOR data
15. **K-Means Clustering** — step through assign/update by hand, add your own points, find local optima
16. **PCA & Dimensionality Reduction** — rotate the projection axis by hand, then watch it snap to PC1

**🧠 Deep Learning**
17. **Neural Networks** — a full playground: 5 datasets (moons/circle/XOR/spiral/blobs), configurable layers, live in-browser training with decision-surface heatmap
18. **Activation Functions** — function/derivative explorer (sigmoid → GELU) + vanishing-gradient visualizer
19. **Backpropagation** — step through forward and backward passes number-by-number on a tiny network
20. **Optimizers** — SGD vs Momentum vs RMSProp vs Adam racing on a curved-valley loss surface

**🚀 Advanced**
21. **Convolutional Networks** — draw on a pixel grid, slide edge/blur/sharpen kernels, hover feature-map outputs
22. **Recurrent Networks & Memory** — watch a hidden state read a sentence word by word; LSTM gates
23. **Attention & Transformers** — interactive attention-matrix explorer with pronoun-resolution examples
24. **Embeddings & Vector Spaces** — word map with nearest-neighbor search and king−man+woman=queen arithmetic
25. **Generative AI** — autoencoder latent-space walk, GAN forger-vs-detective duel, diffusion noising/denoising
26. **How LLMs Work (ChatGPT & Claude)** — live mini-tokenizer, a real tiny language model generating token by token with a temperature slider, and the pretrain → SFT → RLHF pipeline

## Features

- Progress tracking (mark lessons complete; stored in `localStorage`)
- Fully responsive (sidebar collapses on mobile; canvases resize)
- Zero dependencies — the tiny neural-net engine, datasets, and all visualizations are hand-rolled in `js/utils.js`

## Structure

```
index.html          app shell
css/style.css       theme (dark)
js/app.js           router, sidebar nav, home page, progress
js/utils.js         DOM helpers, hi-DPI canvas, datasets, MLP engine, chart painters
js/lessons/*.js     one module per lesson (content + interactive demos)
```

Adding a lesson: create `js/lessons/my-topic.js` exporting `{ id, emoji, title, level, blurb, render(root) }`, then import and register it in a section in `js/app.js`.
