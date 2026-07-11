// ============ Comments (Giscus) configuration ============
// One-time setup — 3 steps, ~5 minutes total:
//
// 1. Enable Discussions on your repo
//    → https://github.com/AshishYadavStudio/ML-Playground/settings
//    → General tab → scroll to "Features" → tick "Discussions" → Save
//
// 2. Install the Giscus GitHub App on your repo
//    → https://github.com/apps/giscus → Install → pick "ML-Playground"
//
// 3. Get your repo IDs from https://giscus.app
//    → In the "Repository" field type: AshishYadavStudio/ML-Playground
//    → In the "Discussion Category" section pick "General" (or any category)
//    → Scroll to "Enable giscus" section — you'll see a script snippet
//    → Copy the values of data-repo-id and data-category-id below
//
// Until you fill these in, lessons show a friendly "comments coming soon" note.

export const GISCUS = {
  repo: 'AshishYadavStudio/ML-Playground',
  repoId: 'R_kgDOTQtXaA',
  category: 'General',
  categoryId: 'DIC_kwDOTQtXaM4DA-IR',
};

// ============ Newsletter signup (Formspree) ============
// Setup — 5 minutes, one-time:
// 1. Go to https://formspree.io → sign up (free tier: 50 submissions/month)
// 2. Create a new form named "ML Playground newsletter"
// 3. Copy the form endpoint (looks like https://formspree.io/f/xyzabcde)
// 4. Paste it into `endpoint` below and push
//
// Until then, the signup box shows a friendly "Coming soon" state so
// visitors still see the offer.
export const NEWSLETTER = {
  endpoint: 'REPLACE_WITH_FORMSPREE_URL',   // e.g. https://formspree.io/f/xyzabcde
  headline: 'Get one visual ML concept per week',
  subtext: 'A short, hand-picked demo or insight every Sunday. No spam, unsubscribe anytime.',
};
