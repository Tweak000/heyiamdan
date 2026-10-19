import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { HomePage, type Check, type Leak } from './pages/home-page';

type Fixtures = {
  homePage: HomePage;
  siteChecks: { checks: Check[]; leaks: Leak[] };
  thirdPartyRequests: string[];
  failOnConsoleErrors: void;
};

export const test = base.extend<Fixtures>({
  // Auto fixture: any test that logs a console error or throws in the page fails.
  failOnConsoleErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await use();
    expect(errors, 'console errors').toEqual([]);
  }, { auto: true }],

  // Every request that leaves our own origin (fonts, badges, analytics...). Should always be empty.
  thirdPartyRequests: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    const seen: string[] = [];
    page.on('request', r => {
      const url = r.url();
      if (!url.startsWith(origin) && !url.startsWith('data:')) seen.push(url);
    });
    await use(seen);
  },

  // Depends on thirdPartyRequests so the request listener is attached before the first navigation.
  homePage: async ({ page, thirdPartyRequests: _ }, use) => {
    const home = new HomePage(page);
    await home.goto();
    await use(home);
  },

  siteChecks: async ({}, use) => {
    await use(JSON.parse(readFileSync('site/checks.json', 'utf8')));
  },
});

export { expect };
