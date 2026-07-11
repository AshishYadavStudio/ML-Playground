"""Generate one static HTML file per lesson (for SEO + real URLs),
plus sitemap.xml and robots.txt.

Regenerate whenever you add/rename/reorder lessons:
    python scripts/build-seo.py
"""

import os
import re
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LESSONS_DIR = os.path.join(ROOT, "js", "lessons")
SITE_URL = "https://ashishyadavstudio.github.io/ML-Playground"

# ---------- lesson order (mirrors js/app.js SECTIONS) ----------
SECTIONS = [
    ("🌱 Foundations", [
        "intro", "supervised-learning", "unsupervised-learning",
        "reinforcement-learning", "data-features", "linear-regression",
        "gradient-descent", "overfitting", "metrics",
    ]),
    ("🐍 Python for ML", [
        "python-intro", "python-variables", "python-collections",
        "python-control", "python-functions", "python-basics",
        "python-advanced", "numpy", "pandas", "dataviz", "ml-code",
    ]),
    ("📊 Classical ML", [
        "logistic-regression", "knn", "svm", "naive-bayes",
        "decision-trees", "kmeans", "pca",
    ]),
    ("🧠 Deep Learning", [
        "neural-networks", "activations", "backprop", "optimizers",
    ]),
    ("🚀 Advanced", [
        "cnn", "rnn", "transformers", "embeddings", "generative", "llms",
    ]),
]

# ---------- extract metadata from each lesson module ----------
META_RE_STR = r"id:\s*['\"]([^'\"]+)['\"][\s\S]{0,400}?" \
              r"emoji:\s*['\"]([^'\"]+)['\"][\s\S]{0,400}?" \
              r"title:\s*['\"]([^'\"]+)['\"][\s\S]{0,400}?" \
              r"level:\s*['\"]([^'\"]+)['\"][\s\S]{0,400}?" \
              r"blurb:\s*['\"]((?:[^'\"\\]|\\.)*)['\"]"


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def read_lesson_meta(lesson_id):
    """Parse id/emoji/title/level/blurb out of a lesson module."""
    file_id = lesson_id  # file names match ids one-to-one
    path = os.path.join(LESSONS_DIR, file_id + ".js")
    with open(path, encoding="utf-8") as f:
        src = f.read()
    m = re.search(META_RE_STR, src)
    if not m:
        raise SystemExit("could not parse metadata from " + path)
    return {
        "id": m.group(1),
        "emoji": m.group(2),
        "title": m.group(3),
        "level": m.group(4),
        "blurb": m.group(5).replace("\\'", "'").replace('\\"', '"'),
    }


# ---------- HTML template ----------
def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title_full}</title>
  <meta name="description" content="{desc}" />
  <meta name="author" content="Ashish Yadav" />
  <link rel="canonical" href="{canonical}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ML Playground" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:title" content="{og_title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:image" content="{og_image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{og_title}" />
  <meta name="twitter:description" content="{desc}" />
  <meta name="twitter:image" content="{og_image}" />

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": {json_title},
    "description": {json_desc},
    "url": "{canonical}",
    "image": "{og_image}",
    "inLanguage": "en",
    "isAccessibleForFree": true,
    "learningResourceType": "Interactive Lesson",
    "educationalLevel": "{level}",
    "isPartOf": {{
      "@type": "Course",
      "name": "ML Playground",
      "url": "{site_url}/"
    }},
    "author": {{ "@type": "Person", "name": "Ashish Yadav" }}
  }}
  </script>

  <script>
    // The router in app.js reads this to know which lesson to render on
    // a fresh page load at /lesson-id/.
    window.__initialLesson = "{lesson_id}";
    (function () {{
      try {{
        var t = localStorage.getItem('mlplayground-theme') || 'light';
        document.documentElement.setAttribute('data-theme', t);
      }} catch (e) {{ document.documentElement.setAttribute('data-theme', 'light'); }}
    }})();
  </script>

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-BNNG588WK9"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{ dataLayer.push(arguments); }}
    gtag('js', new Date());
    gtag('config', 'G-BNNG588WK9', {{ send_page_view: false }});
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{css_url}" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>" />
</head>
<body>
  <div id="read-progress"></div>
  <div id="app">
    <aside id="sidebar">
      <div class="brand">
        <span class="brand-icon">🧠</span>
        <div>
          <h1>ML Playground</h1>
          <p>Learn ML &amp; DL visually</p>
        </div>
      </div>
      <nav id="nav"></nav>
      <div class="sidebar-footer">
        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle light and dark theme">
          <span class="tt-icon">🎨</span>
          <span class="tt-label">Theme</span>
          <span class="tt-track" style="margin-left:auto"><span class="tt-thumb"></span></span>
        </button>
        <div id="progress-bar"><div id="progress-fill"></div></div>
        <p id="progress-text">0 / 0 lessons completed</p>
      </div>
    </aside>
    <button id="menu-toggle" aria-label="Toggle menu">☰</button>
    <main id="content">
      <!-- Static crawlable content for SEO — replaced by the SPA once JS loads. -->
      <noscript>
        <div class="lesson-header">
          <div class="lesson-breadcrumb">{section_name}</div>
          <h2>{h1_title}</h2>
        </div>
        <div class="lesson-body">
          <p>{desc}</p>
          <p><strong>This lesson is fully interactive.</strong> Please enable JavaScript to see the live demos, diagrams and quiz.</p>
        </div>
      </noscript>
    </main>
  </div>
  <script type="module" src="{js_url}"></script>
</body>
</html>
"""


def build_pages(sections):
    """Emit <lesson-id>/index.html for every lesson and collect metadata."""
    all_meta = []
    for section_name, ids in sections:
        for lesson_id in ids:
            meta = read_lesson_meta(lesson_id)
            meta["section"] = section_name
            all_meta.append(meta)

            title_full = "{emoji} {title} — ML Playground".format(**meta)
            og_title = "{emoji} {title} — Learn ML Visually".format(**meta)
            desc = meta["blurb"]
            canonical = SITE_URL + "/" + lesson_id + "/"
            og_image = SITE_URL + "/og-image.png"

            html_out = PAGE_TEMPLATE.format(
                title_full=esc(title_full),
                og_title=esc(og_title),
                desc=esc(desc),
                canonical=canonical,
                og_image=og_image,
                level=esc(meta["level"]),
                lesson_id=lesson_id,
                site_url=SITE_URL,
                # JSON string literals (must include quotes)
                json_title='"' + meta["title"].replace('"', '\\"') + '"',
                json_desc='"' + desc.replace('"', '\\"') + '"',
                section_name=esc(strip_html(section_name)),
                h1_title=esc("{emoji} {title}".format(**meta)),
                css_url="../css/style.css?v=11",
                js_url="../js/app.js",
            )

            out_dir = os.path.join(ROOT, lesson_id)
            os.makedirs(out_dir, exist_ok=True)
            with open(os.path.join(out_dir, "index.html"),
                      "w", encoding="utf-8", newline="\n") as f:
                f.write(html_out)
    return all_meta


def build_sitemap(all_meta):
    """Emit sitemap.xml + robots.txt at the repo root."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    urls = [(SITE_URL + "/", "1.0", "weekly")]
    for m in all_meta:
        urls.append((SITE_URL + "/" + m["id"] + "/", "0.8", "monthly"))

    body = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, prio, freq in urls:
        body.append("  <url>")
        body.append("    <loc>" + u + "</loc>")
        body.append("    <lastmod>" + today + "</lastmod>")
        body.append("    <changefreq>" + freq + "</changefreq>")
        body.append("    <priority>" + prio + "</priority>")
        body.append("  </url>")
    body.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"),
              "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(body))

    robots = "User-agent: *\nAllow: /\n\nSitemap: " + SITE_URL + "/sitemap.xml\n"
    with open(os.path.join(ROOT, "robots.txt"),
              "w", encoding="utf-8", newline="\n") as f:
        f.write(robots)


if __name__ == "__main__":
    meta = build_pages(SECTIONS)
    build_sitemap(meta)
    print("built", len(meta), "lesson pages + sitemap.xml + robots.txt")
