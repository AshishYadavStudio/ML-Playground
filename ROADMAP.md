# ML Playground — Roadmap

Living to-do list for mlplayground.co.in. Update as items ship or priorities shift.

## ⭐ Important — differentiators that make the site unique

These are the moves that make ML Playground *different*, not just bigger than
freeCodeCamp / Kaggle Learn / Google's ML Crash Course.

- [ ] **Python-in-the-browser (Pyodide)** ⭐ — replace the Python section's read-only code samples with a real interpreter running in WebAssembly. Users actually type and run Python + NumPy + pandas without any install. Nobody else in the visual-ML space does this. Biggest single differentiator.
- [ ] **"Bring your own CSV" sandbox** ⭐ — drop a real spreadsheet in, and existing lesson demos (linear regression, KNN, K-Means, PCA) train live on the user's own data. Turns toy demos into "screenshot and share" moments.
- [ ] **Daily streak + shareable completion badges** ⭐ — Duolingo-style streak counter and per-section certificates (all localStorage, no backend). Strong return-visit driver + free viral loop.
- [ ] **ELI5 ↔ Technical toggle per lesson** ⭐ — one switch flips every lesson between beginner and math-heavy explanations. Same content serves both audiences.
- [ ] **Game leaderboards + shareable score cards** ⭐ — canvas-generated "share my score" image for every game finish. Nearly-free social loop over the games infrastructure already built.

## Next up (quick wins)

- [ ] **Reading time + progress markers** — estimated read time per lesson, small polish
- [ ] **PWA install** — "Add to Home Screen" support on Android/iPhone
- [ ] **Glossary page** — hover-tooltips + a dedicated reference page for every technical term

## Bigger lifts

- [ ] **Next tier of lessons** (5–10 more): MLOps basics, Vision Transformers (ViT), DBSCAN & hierarchical clustering, Prompt Engineering, Graph Neural Networks, Time Series (ARIMA/seasonality), Hyperparameter tuning, Explainability (SHAP/LIME), Fairness & bias in ML

## Shipped

- [x] **Highlighted feedback button in footer + persistent top-right feedback button** on every page
- [x] **Copy-code button** on every code block
- [x] **Site-wide search (Ctrl-K)** — jump to any concept across all 45 lessons + 13 games
- [x] **Feedback form** — Google Form linked in footer for structured user feedback (separate from Giscus per-lesson comments)
- [x] 45 interactive lessons across 5 sections (Foundations → Python → Classical ML → Deep Learning → Advanced/GenAI)
- [x] 13 hands-on games (`/games/`), one per concept, linked from lessons + homepage
- [x] Light/dark theming with framed-dark demo islands
- [x] Real-world examples on every lesson (74 total)
- [x] Concept cross-linking (auto first-mention links between lessons)
- [x] Giscus comments (GitHub Discussions) per lesson
- [x] Google Analytics 4 with per-lesson pageview tracking
- [x] Newsletter signup (Formspree)
- [x] Full SEO overhaul — real per-lesson URLs, sitemap.xml, OG images, JSON-LD
- [x] 3D gradient descent visualization (Three.js)
- [x] Custom domain: mlplayground.co.in
