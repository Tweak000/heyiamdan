// Writes site/badge.svg from a Playwright JSON report, so the page's badge is first-party.
// Usage: node tools/make-badge.mjs <report.json> <out.svg>
import { readFileSync, writeFileSync } from 'node:fs';

export function badge(label, value, color) {
  const w = t => Math.round(t.length * 6.6 + 12);
  const lw = w(label), vw = w(value), tw = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20" role="img" aria-label="${label}: ${value}">
  <rect width="${lw}" height="20" fill="#262f3a"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/>
  <g fill="#fff" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" text-anchor="middle">
    <text x="${lw / 2}" y="14">${label}</text><text x="${lw + vw / 2}" y="14" fill="#062a26">${value}</text>
  </g>
</svg>
`;
}

const [, , report, out = 'site/badge.svg'] = process.argv;
if (report) {
  const { stats } = JSON.parse(readFileSync(report, 'utf8'));
  const failed = stats.unexpected ?? 0;
  const passed = (stats.expected ?? 0) + (stats.flaky ?? 0);
  const value = failed ? `${failed} failed` : `${passed} passed`;
  writeFileSync(out, badge('playwright', value, failed ? '#f87171' : '#4ade80'));
  console.log(`badge: ${value}`);
} else {
  writeFileSync(out, badge('playwright', 'not run yet', '#8b98a8'));
  console.log('badge: placeholder');
}
