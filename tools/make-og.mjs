// Renders tools/og.html to site/og.png (the link-preview image). Run: node tools/make-og.mjs
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve('tools/og.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'site/og.png' });
await browser.close();
console.log('wrote site/og.png');
