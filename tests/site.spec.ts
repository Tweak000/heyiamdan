import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

type Check = { title: string; selector: string; text?: string; attr?: [string, string]; count?: number; timeout?: number };
type Leak = { title: string; pattern: string };

// The same list drives the "▶ run tests" replay on the page itself.
const { checks, leaks } = JSON.parse(readFileSync('site/checks.json', 'utf8')) as { checks: Check[]; leaks: Leak[] };

test.describe('heyiamdan.com', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const c of checks) {
    test(c.title, async ({ page }) => {
      const loc = page.locator(c.selector);
      const timeout = c.timeout ?? 5000;
      if (c.count !== undefined) {
        await expect(loc).toHaveCount(c.count, { timeout });
        return;
      }
      await expect(loc.first()).toBeVisible({ timeout });
      if (c.text) await expect(loc.first()).toContainText(c.text, { timeout });
      if (c.attr) await expect(loc.first()).toHaveAttribute(c.attr[0], new RegExp(c.attr[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  }

  test('no leaks in the page source', async ({ page }) => {
    const html = await page.content();
    for (const l of leaks) {
      expect(html.match(new RegExp(l.pattern, 'g')) ?? [], l.title).toEqual([]);
    }
    // Extra terms (host names, usernames...) come from a CI secret so the list itself stays private.
    const extra = (process.env.LEAK_TERMS ?? '').split(',').map(t => t.trim()).filter(Boolean);
    for (const term of extra) {
      expect(html.toLowerCase().includes(term.toLowerCase()), `page must not mention a private term`).toBe(false);
    }
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('no serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map(v => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('no sideways scrolling on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.reload();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the page can test itself', async ({ page }) => {
    await page.getByRole('button', { name: /run tests/i }).click();
    await expect(page.locator('#runner')).toContainText(/\d+ passed/, { timeout: 30000 });
    await expect(page.locator('#runner')).not.toContainText('failed');
  });
});
