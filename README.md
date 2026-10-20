# heyiamdan.com

My personal landing page. Hand-written HTML and CSS, no framework, no build step, no third-party requests.

## This page tests itself

- `site/checks.json` lists what should be on the page and what must never be.
- `tests/` runs those checks with Playwright in Chromium and Firefox, written the way I write
  tests at work: a page object (`tests/pages/home-page.ts`) and custom fixtures (`tests/fixtures.ts`).
  An auto fixture fails any test that logs a console error.
- `tests/a11y.spec.ts` is an accessibility suite: axe against WCAG 2.2 AA (desktop, phone, and with
  the test runner open), landmarks, heading order, new-tab links that say so, a skip link, keyboard-only
  use with visible focus, Escape returning focus, reflow at 320px (1.4.10), text spacing (1.4.12),
  nothing animating forever (2.2.2), and an ARIA snapshot of what a screen reader gets.
- On top of that: no third-party requests, no leaked emails or
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

Upgrading Playwright: `@playwright/test` is pinned in `package.json`, and CI's container image
(`mcr.microsoft.com/playwright:vX.Y.Z-noble` in `.github/workflows/ci.yml`, both jobs) must match it.
Bump both together, then regenerate the visual baselines, since a new browser build shifts pixels.

Fonts: Space Grotesk and JetBrains Mono, self-hosted under the SIL Open Font License (see `site/fonts/`).
