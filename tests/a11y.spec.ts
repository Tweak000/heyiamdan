import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations.map(v => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
}

test.describe('accessibility: automated (axe, WCAG 2.2 AA)', () => {
  test('no violations on desktop', async ({ homePage }) => {
    expect(await axe(homePage.page)).toEqual([]);
  });

  test('no violations on a phone', async ({ homePage }) => {
    await homePage.page.setViewportSize({ width: 390, height: 844 });
    expect(await axe(homePage.page)).toEqual([]);
  });

  test('no violations with the test runner open', async ({ homePage }) => {
    await homePage.runSelfTest();
    expect(await axe(homePage.page)).toEqual([]);
  });
});

test.describe('accessibility: structure', () => {
  test('has nav, main and footer landmarks', async ({ homePage }) => {
    const { page } = homePage;
    await expect(page.getByRole('navigation')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
  });

  test('one h1, and heading levels never skip', async ({ homePage }) => {
    const levels = await homePage.page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(hs => hs.map(h => Number(h.tagName[1])));
    expect(levels.filter(l => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => { if (i) expect(l - levels[i - 1], `heading ${i} jumps a level`).toBeLessThanOrEqual(1); });
  });

  test('links that open a new tab say so', async ({ homePage }) => {
    const links = homePage.page.locator('a[target="_blank"]');
    for (const link of await links.all()) {
      await expect(link).toHaveAccessibleName(/new tab/i);
    }
  });

  test('screen readers get the hero in a sensible order', async ({ homePage }) => {
    await expect(homePage.page.locator('header.hero')).toMatchAriaSnapshot(`
      - heading "hey, i am dan" [level=1]
      - text: sdet by day · homelab by night
      - paragraph:
        - text: I break software
        - strong: on purpose
        - text: so it doesn't break by accident. After hours I run a
        - strong: server rack in my house
        - text: and build factories I never quite finish.
      - link "linkedin (opens in new tab)":
        - /url: https://www.linkedin.com/in/dan-gutwald-92b39080/
      - link "github (opens in new tab)":
        - /url: https://github.com/Tweak000
      - list "interests":
        - listitem: playwright
        - listitem: homelab
        - listitem: docker
        - listitem: wow
        - listitem: factory games
        - listitem: dungeon master
        - listitem: 3d printing
        - listitem: rc & fpv
        - listitem: linux (btw)
      - button "run tests"
      - paragraph: "Terminal: whoami, dan gutwald, sdet. make test: 5 passed, 1 flaky (drone landings). Focus: playwright, UI and API testing, CI/CD. /played: World of Warcraft, integer overflow; Satisfactory, 2,271 hours; No Man's Sky, 1,431 hours."
    `);
  });
});

test.describe('accessibility: keyboard', () => {
  test('first tab stop is a skip link that jumps to the content', async ({ homePage }) => {
    const { page } = homePage;
    await page.keyboard.press('Tab');
    await expect(homePage.skipLink).toBeFocused();
    await expect(homePage.skipLink).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('every interactive element is reachable and shows a focus ring', async ({ homePage }) => {
    const { page } = homePage;
    const total = await page.locator('a[href], button:not([disabled])').filter({ visible: true }).count();
    const seen = new Set<string>();
    for (let i = 0; i < total + 5 && seen.size < total; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return { key: el.outerHTML.slice(0, 120), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
      });
      if (!info) continue;
      expect(info.ring, `no visible focus ring on ${info.key}`).toBe(true);
      seen.add(info.key);
    }
    expect(seen.size).toBe(total);
  });

  test('the test runner works from the keyboard, and Escape gives focus back', async ({ homePage }) => {
    const { page } = homePage;
    await homePage.runTests.focus();
    await page.keyboard.press('Enter');
    await expect(homePage.runner).toBeVisible();
    await expect(homePage.runner).toContainText(/\d+ passed/, { timeout: 30_000 });
    await page.keyboard.press('Escape');
    await expect(homePage.runner).toBeHidden();
    await expect(homePage.runTests).toBeFocused();
  });

  test('the status pill can be changed on demand (it does not rotate by itself)', async ({ homePage }) => {
    const before = await homePage.statusPill.textContent();
    await homePage.statusPill.focus();
    await homePage.page.keyboard.press('Enter');
    await expect(homePage.statusPill).not.toHaveText(before!);
  });
});

test.describe('accessibility: reflow, spacing & motion', () => {
  test('reflows at 320px wide without sideways scrolling (WCAG 1.4.10)', async ({ homePage }) => {
    await homePage.page.setViewportSize({ width: 320, height: 640 });
    expect(await homePage.horizontalOverflow()).toBeLessThanOrEqual(0);
  });

  test('survives increased text spacing (WCAG 1.4.12)', async ({ homePage }) => {
    await homePage.page.addStyleTag({ content: `* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
      p { margin-bottom: 2em !important; }` });
    await homePage.page.setViewportSize({ width: 390, height: 844 });
    expect(await homePage.horizontalOverflow()).toBeLessThanOrEqual(0);
  });

  test('nothing blinks or moves forever (WCAG 2.2.2)', async ({ homePage }) => {
    await homePage.page.waitForTimeout(6_000);
    const endless = await homePage.page.evaluate(() =>
      document.getAnimations()
        .filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity)
        .map(a => `${(a as CSSAnimation).animationName} on ${(a.effect as KeyframeEffect).target?.className}`));
    expect(endless).toEqual([]);
  });
});
