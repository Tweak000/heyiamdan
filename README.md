# heyiamdan.com

My personal landing page. Hand-written HTML and CSS, no framework, no build step, no third-party requests.

## This page tests itself

- `site/checks.json` lists what should be on the page and what must never be.
- `tests/` runs those checks with Playwright in Chromium and Firefox, written the way I write
  tests at work: a page object (`tests/pages/home-page.ts`) and custom fixtures (`tests/fixtures.ts`).
  An auto fixture fails any test that logs a console error.
- On top of the shared checks: accessibility (axe), no third-party requests, no leaked emails or
  private IPs, no sideways scrolling on a phone, link-preview tags, reduced motion, and visual
  regression screenshots.
- The **▶ run tests** button on the page replays the same `checks.json` in your browser, with a
  ghost cursor, so you can watch it happen.
- GitHub Actions runs everything in the official Playwright container on every push. The site only
  deploys to GitHub Pages if it all passes, and the badge on the page is generated from that run.

```sh
npm ci
npx playwright install chromium firefox
npm test            # functional suite (visual tests run in CI)
npm run serve       # http://127.0.0.1:4173
npm run og          # re-render the link-preview image
```

Visual baselines: run the workflow manually with **update-snapshots** ticked.

Fonts: Space Grotesk and JetBrains Mono, self-hosted under the SIL Open Font License (see `site/fonts/`).
