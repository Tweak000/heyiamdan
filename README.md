# heyiamdan.com

My personal landing page. Hand-written HTML and CSS, no framework, no build step.

## This page tests itself

- `site/checks.json` is a list of checks: what should be on the page and what must never be.
- `tests/site.spec.ts` runs those checks with Playwright in Chromium and Firefox. It also checks
  for console errors, accessibility (axe), sideways scrolling on a phone, and leaked emails or private IPs.
- The **▶ run tests** button on the page replays the same `checks.json` in your browser, with a
  ghost cursor, so you can watch it happen.
- GitHub Actions runs the suite on every push. The site only deploys to GitHub Pages if everything passes.

```sh
npm ci
npx playwright install chromium firefox
npm test
```
