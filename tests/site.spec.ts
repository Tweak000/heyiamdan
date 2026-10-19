import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures';
import type { Check } from './pages/home-page';

// Read at collection time so each check becomes its own test.
const { checks } = JSON.parse(readFileSync('site/checks.json', 'utf8')) as { checks: Check[] };

test.describe('content (shared with the in-page replay)', () => {
  for (const check of checks) {
    test(check.title, async ({ homePage }) => {
      await homePage.expectCheck(check);
    });
  }
});

test.describe('privacy & security', () => {
  test('no leaks in the page source', async ({ homePage, siteChecks }) => {
    const html = await homePage.page.content();
    for (const leak of siteChecks.leaks) {
      expect(html.match(new RegExp(leak.pattern, 'g')) ?? [], leak.title).toEqual([]);
    }
    // Private terms (host names, usernames...) come from a CI secret, so the list itself stays private.
    const extra = (process.env.LEAK_TERMS ?? '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    for (const term of extra) {
      expect(html.toLowerCase().includes(term), 'page must not mention a private term').toBe(false);
    }
  });

  test('no third-party requests', async ({ homePage, thirdPartyRequests }) => {
    await homePage.page.waitForLoadState('networkidle');
    expect(thirdPartyRequests).toEqual([]);
  });
});

test.describe('quality', () => {
  test('link previews have a title, description and image', async ({ homePage, request }) => {
    await expect(homePage.meta('og:title')).toHaveAttribute('content', /hey, i am dan/);
    await expect(homePage.meta('og:description')).toHaveAttribute('content', /.+/);
    await expect(homePage.meta('twitter:card')).toHaveAttribute('content', 'summary_large_image');
    await expect(homePage.meta('og:image')).toHaveAttribute('content', 'https://heyiamdan.com/og.png');
    const image = await request.get('/og.png');
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toBe('image/png');
  });

  test('reduced motion shows the terminal without typing it out', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#term')).toContainText('integer overflow', { timeout: 500 });
  });
});

test('the page can test itself', async ({ homePage }) => {
  await homePage.runSelfTest();
  await expect(homePage.runner).not.toContainText('failed');
});
