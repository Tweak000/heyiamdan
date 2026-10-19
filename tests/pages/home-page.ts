import { expect, type Locator, type Page } from '@playwright/test';

export type Check = { title: string; selector: string; text?: string; attr?: [string, string]; count?: number; timeout?: number };
export type Leak = { title: string; pattern: string };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class HomePage {
  readonly heading: Locator;
  readonly linkedin: Locator;
  readonly github: Locator;
  readonly terminal: Locator;
  readonly runTests: Locator;
  readonly runner: Locator;
  readonly skipLink: Locator;
  readonly statusPill: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.linkedin = page.locator('.cta').getByRole('link', { name: /linkedin/ });
    this.github = page.locator('.cta').getByRole('link', { name: /github/ });
    this.terminal = page.locator('#term');
    this.runTests = page.getByRole('button', { name: /run tests/i });
    this.runner = page.locator('#runner');
    this.skipLink = page.getByRole('link', { name: /skip to content/i });
    this.statusPill = page.getByRole('button', { name: /status/i });
  }

  async goto() {
    await this.page.goto('./');
  }

  /** Runs one entry from site/checks.json. The in-page "▶ run tests" replay runs the same list. */
  async expectCheck(c: Check) {
    const loc = this.page.locator(c.selector);
    const timeout = c.timeout ?? 5000;
    if (c.count !== undefined) return expect(loc).toHaveCount(c.count, { timeout });
    await expect(loc.first()).toBeVisible({ timeout });
    if (c.text) await expect(loc.first()).toContainText(c.text, { timeout });
    if (c.attr) await expect(loc.first()).toHaveAttribute(c.attr[0], new RegExp(escapeRegExp(c.attr[1])));
  }

  meta(property: string) {
    return this.page.locator(`meta[property="${property}"], meta[name="${property}"]`);
  }

  async horizontalOverflow() {
    return this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  async runSelfTest() {
    await this.runTests.click();
    await expect(this.runner).toContainText(/\d+ passed/, { timeout: 30_000 });
  }
}
