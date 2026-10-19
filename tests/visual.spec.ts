import { existsSync } from 'node:fs';
import { test, expect } from './fixtures';

// Pixel baselines only match on the OS that made them, so these run in CI's Playwright container.
// Locally they're skipped unless VISUAL=1. Baselines are (re)made by the "update snapshots" workflow.
test.describe('visual regression', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one browser is enough for pixels');
  test.skip(!process.env.CI && !process.env.VISUAL, 'runs in CI only');

  for (const view of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'phone', width: 390, height: 844 }]) {
    test(`home page on ${view.name}`, async ({ page }, testInfo) => {
      const shot = `home-${view.name}.png`;
      const updating = ['all', 'changed'].includes(testInfo.config.updateSnapshots);
      test.skip(!existsSync(testInfo.snapshotPath(shot)) && !updating, 'no baseline yet');
      await page.setViewportSize(view);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('./');
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(shot, {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('.ci img')], // the badge changes with every run
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
