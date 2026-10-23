// End-to-end check of the built app in a phone-sized browser.
// Usage: npm run build && npm run e2e   (screenshots go to ./screenshots)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const shots = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(shots, { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && resolve());
  server.on('exit', reject);
  setTimeout(() => reject(new Error('preview server did not start')), 15000);
});

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const stat = async (label) => (await page.locator('.stat', { hasText: label }).locator('.stat-value').first().textContent())?.trim();
const shot = (name) => page.screenshot({ path: `${shots}${name}.png`, fullPage: true });

try {
  await page.goto(BASE);
  await shot('01-empty');

  // 1. Add McDonald's $14.50 with two fields only.
  await page.getByRole('button', { name: 'Add Expense' }).first().click();
  await page.getByLabel('What did you spend money on?').fill("McDonald's");
  await page.getByLabel('Amount in dollars').fill('14.50');
  const selected = await page.locator('.chip.selected').first().textContent();
  check(selected?.includes('Eating Out'), `Eating Out suggested (got "${selected}")`);
  await shot('02-quick-add');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForSelector('.toast');

  // 2. Totals update.
  check((await stat('Today')) === '$14.50', 'Today total is $14.50');
  check((await stat('This month')) === '$14.50', 'Month total is $14.50');
  check(await page.locator('.txn', { hasText: "McDonald's" }).isVisible(), 'Shows in recent expenses');

  // 3. Edit to $12.50.
  await page.locator('.txn', { hasText: "McDonald's" }).click();
  await page.getByLabel('Amount in dollars').fill('12.50');
  await page.getByRole('button', { name: 'Save changes' }).click();
  check((await stat('Today')) === '$12.50', 'Edited total is $12.50');

  // 4. Delete with confirmation, then restore.
  await page.locator('.txn', { hasText: "McDonald's" }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  check((await stat('Today')) === '$0.00', 'Deleted entry removed from totals');
  await page.locator('.nav-btn', { hasText: 'History' }).click();
  await page.getByRole('radio', { name: /Deleted/ }).click();
  await page.getByRole('button', { name: 'Restore' }).click();
  await page.locator('.nav-btn', { hasText: 'Home' }).click();
  check((await stat('Today')) === '$12.50', 'Restored entry counts again');

  // More expenses for realistic screenshots.
  const add = async (desc, amt) => {
    await page.locator('.nav-add').click();
    await page.getByLabel('What did you spend money on?').fill(desc);
    await page.getByLabel('Amount in dollars').fill(amt);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const dup = page.getByRole('button', { name: 'Save anyway' });
    if (await dup.isVisible().catch(() => false)) await dup.click();
  };
  await add('Walmart groceries', '63.20');
  await add('Gas', '35');
  await add('Amazon', '24.99');
  await add('Coffee', '6.50');

  // 5. Refund $10 of Amazon.
  await page.locator('.txn', { hasText: 'Amazon' }).first().click();
  await page.getByRole('button', { name: /Refund/ }).click();
  await page.getByLabel('Amount in dollars').fill('10');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check((await stat('Today')) === '$132.19', `Refund reduces today's total (got ${await stat('Today')})`);

  // 6. Paycheck with reserved money.
  await page.locator('.nav-btn', { hasText: 'Budget' }).click();
  await page.getByRole('button', { name: '+ Add paycheck' }).click();
  await page.getByLabel('Paycheck amount (take-home)').fill('2000');
  await page.getByLabel('Bills').fill('900');
  await page.getByLabel('Debt payments').fill('200');
  await page.getByLabel('Savings').fill('250');
  await page.getByLabel('Investing').fill('150');
  check((await page.getByLabel('Spending allowance').inputValue()) === '500.00', 'Allowance excludes reserved money ($500)');
  await shot('03-paycheck');
  await page.getByRole('button', { name: 'Save paycheck' }).click();

  // 7. Category budget warning.
  await page.locator('.cat-row', { hasText: 'Eating Out' }).click();
  await page.getByLabel(/Spending limit/).fill('15');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.nav-btn', { hasText: 'Home' }).click();
  check(await page.locator('.notice.near', { hasText: 'Eating Out' }).isVisible(), 'Warns at 80% of Eating Out budget');
  await add('Taco Bell', '5');
  check(await page.locator('.notice.over', { hasText: 'Eating Out' }).isVisible(), 'Warns when over Eating Out budget');
  check((await page.locator('.hero-value').textContent()) === '$362.81', `Remaining budget = 500 − 137.19 (got ${await page.locator('.hero-value').textContent()})`);

  // 8. Credit card payment is not spending.
  await page.locator('.nav-add').click();
  await page.getByLabel('What did you spend money on?').fill('Credit card payment');
  await page.getByLabel('Amount in dollars').fill('137.19');
  check(await page.locator('.notice.info', { hasText: 'Credit card payment' }).isVisible(), 'Detects credit card payment');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check((await stat('Today')) === '$137.19', 'Credit card payment not double counted');
  await shot('04-dashboard');

  // 9. Export JSON, erase, import.
  await page.locator('[aria-label="Settings & backups"]').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup (JSON)' }).click()]);
  const backupPath = `${shots}backup.json`;
  await download.saveAs(backupPath);
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  check(backup.format === 'spend-smarter-backup' && backup.data.transactions.length === 8, `Backup has 8 transactions (got ${backup.data.transactions.length})`);
  const [csvDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  await csvDl.saveAs(`${shots}export.csv`);
  await page.getByRole('button', { name: 'Erase all data on this device' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Erase' }).click();
  await page.locator('input[type=file]').setInputFiles(backupPath);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Merge' }).click();
  await page.locator('.nav-btn', { hasText: 'Home' }).click();
  check((await stat('Today')) === '$137.19', 'Import restores totals');
  check(await page.locator('.notice.over', { hasText: 'Eating Out' }).isVisible(), 'Import restores category budgets');
  // Re-import must not duplicate.
  await page.locator('[aria-label="Settings & backups"]').click();
  await page.locator('input[type=file]').setInputFiles(backupPath);
  const msg = await page.getByRole('alertdialog').textContent();
  check(msg.includes('0 new'), 'Re-importing adds no duplicates');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();

  // 10. Restart the app.
  await page.close();
  const page2 = await context.newPage();
  await page2.goto(BASE);
  const today2 = (await page2.locator('.stat', { hasText: 'Today' }).locator('.stat-value').textContent())?.trim();
  check(today2 === '$137.19', 'Data persists after restart');

  await page2.locator('.nav-btn', { hasText: 'History' }).click();
  await page2.screenshot({ path: `${shots}05-history.png`, fullPage: true });
  await page2.locator('.nav-btn', { hasText: 'Reports' }).click();
  await page2.screenshot({ path: `${shots}06-reports.png`, fullPage: true });
  await page2.locator('.nav-btn', { hasText: 'Budget' }).click();
  await page2.screenshot({ path: `${shots}07-budget.png`, fullPage: true });
  await page2.goto(`${BASE}#/settings`);
  await page2.screenshot({ path: `${shots}08-settings.png`, fullPage: true });
  const overflow = await page2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, 'No horizontal overflow at phone width');
} catch (e) {
  failures++;
  console.error(e);
  await page.screenshot({ path: `${shots}failure.png`, fullPage: true }).catch(() => {});
} finally {
  check(errors.length === 0, `No console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  server.kill();
  writeFileSync(`${shots}result.txt`, failures ? `${failures} failed\n` : 'all passed\n');
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll e2e checks passed');
  process.exit(failures ? 1 : 0);
}
