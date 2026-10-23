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

  // 6. Paycheck → automatic 55/20/15/10 budget.
  await page.locator('.nav-btn', { hasText: 'Budget' }).click();
  await page.getByRole('button', { name: 'Add paycheck', exact: true }).click();
  check((await page.getByLabel('Net paycheck (take-home)').inputValue()) === '1482.00', 'Paycheck defaults to the $1,482 baseline');
  const preview = await page.locator('.sheet').textContent();
  check(['$815.10', '$296.40', '$222.30', '$148.20'].every((x) => preview.includes(x)), 'Paycheck preview shows 815.10 / 296.40 / 222.30 / 148.20');
  await shot('03-paycheck');
  await page.locator('.sheet').getByRole('button', { name: 'Add paycheck' }).click();
  const funBig = () => page.locator('.bucket-card', { hasText: 'Guilt-Free' }).locator('.bucket-big').textContent();
  // Guilt-Free so far: McDonald's 12.50 + Amazon 24.99 − 10 refund + Coffee 6.50 = 33.99
  check((await funBig()) === '$114.21', `Guilt-Free remaining 148.20 − 33.99 (got ${await funBig()})`);
  check(await page.locator('.notice', { hasText: 'planned Goals' }).isVisible(), 'Warns that planned Goals exceed the 15% target');

  // 7. Category budget warning.
  await page.getByRole('radio', { name: 'Plan' }).click();
  await page.locator('.cat-row', { hasText: 'Eating Out' }).click();
  await page.getByLabel(/Spending limit/).fill('15');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.nav-btn', { hasText: 'Home' }).click();
  check(await page.locator('.notice.near', { hasText: 'Eating Out' }).isVisible(), 'Warns at 80% of Eating Out budget');
  await add('Taco Bell', '5');
  check(await page.locator('.notice.over', { hasText: 'Eating Out' }).isVisible(), 'Warns when over Eating Out budget');
  // 1482 − 137.19 spent − 683.33 unpaid bills (rent, phone + Wi-Fi, car)
  check((await page.locator('.hero-value').textContent()) === '$661.48', `Paycheck budget remaining (got ${await page.locator('.hero-value').textContent()})`);

  // 8. Credit card payment is not spending.
  await page.locator('.nav-add').click();
  await page.getByLabel('What did you spend money on?').fill('Credit card payment');
  await page.getByLabel('Amount in dollars').fill('137.19');
  check(await page.locator('.notice.info', { hasText: 'Credit card payment' }).isVisible(), 'Detects credit card payment');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check((await stat('Today')) === '$137.19', 'Credit card payment not double counted');
  check((await page.locator('.hero-value').textContent()) === '$661.48', 'Card payment leaves the budget unchanged');
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
  await page2.getByRole('radio', { name: 'Dashboard' }).click();
  const hero2 = () => page2.locator('.hero-value').first().textContent();
  check((await hero2()) === '$661.48', `Budget dashboard after restart (got ${await hero2()})`);

  // Internal transfer with set-asides: not spending.
  const add2 = async (desc, amt) => {
    await page2.locator('.nav-add').click();
    await page2.getByLabel('What did you spend money on?').fill(desc);
    await page2.getByLabel('Amount in dollars').fill(amt);
  };
  await add2('Transfer to Bills Checking', '300');
  check(await page2.locator('.notice.info', { hasText: 'Transfer' }).isVisible(), 'Detects an internal transfer');
  await page2.getByLabel('From account').fill('Main Checking');
  await page2.getByLabel('To account').fill('Bills Checking');
  for (const [i, [label, amt]] of [['Capital One', '100'], ['Household bills', '100'], ['American Express', '100']].entries()) {
    await page2.getByRole('button', { name: '+ Add set-aside' }).click();
    await page2.getByLabel(`Set-aside ${i + 1} name`).fill(label);
    await page2.getByLabel(`Set-aside ${i + 1} amount`).fill(amt);
  }
  await page2.screenshot({ path: `${shots}09-transfer.png`, fullPage: true });
  await page2.getByRole('button', { name: 'Save', exact: true }).click();
  check((await hero2()) === '$661.48', 'A $300 transfer does not change the budget');

  // Confirm the rent payment: moves from reserved to spent, total unchanged.
  await page2.locator('.bucket-card', { hasText: 'Needs' }).locator('summary').click();
  await page2.getByRole('button', { name: 'Record payment for Rent' }).click();
  await page2.locator('.sheet').getByRole('button', { name: 'Save payment' }).click();
  const needsText = await page2.locator('.bucket-card', { hasText: 'Needs' }).first().textContent();
  check(needsText.includes('✓ Paid'), 'Rent shows as paid');
  check((await hero2()) === '$661.48', 'Paying a reserved bill is not counted twice');

  // McDonald's → Guilt-Free goes down by exactly 14.50, with a live preview.
  const funBefore = await page2.locator('.bucket-card', { hasText: 'Guilt-Free' }).locator('.bucket-big').textContent();
  await add2("McDonald's", '14.50');
  const hint = await page2.locator('.sheet').textContent();
  check(hint.includes('Guilt-Free: $94.71 left after this'), `Shows Guilt-Free left before saving (before ${funBefore})`);
  await page2.getByRole('button', { name: 'Save', exact: true }).click();
  const dup = page2.getByRole('button', { name: 'Save anyway' });
  if (await dup.isVisible().catch(() => false)) await dup.click();
  check((await page2.locator('.bucket-card', { hasText: 'Guilt-Free' }).locator('.bucket-big').textContent()) === '$94.71', 'Guilt-Free updates instantly (109.21 − 14.50)');
  await page2.screenshot({ path: `${shots}07-budget.png`, fullPage: true });

  // Debt Payoff Mode: redirects investing, records nothing.
  const countBefore = await page2.evaluate(() => JSON.parse(localStorage.getItem('spend-smarter:data:v1')).transactions.length);
  await page2.getByRole('radio', { name: 'Debt Payoff Mode' }).click();
  const inv = await page2.locator('.bucket-card', { hasText: 'Investing' }).first().textContent();
  check(inv.includes('Redirected to debt payoff') && inv.includes('−$296.40'), 'Debt Payoff Mode shows redirected investing');
  const countAfter = await page2.evaluate(() => JSON.parse(localStorage.getItem('spend-smarter:data:v1')).transactions.length);
  check(countBefore === countAfter, 'Debt Payoff Mode creates no transactions');
  await page2.screenshot({ path: `${shots}10-debt-mode.png`, fullPage: true });
  await page2.getByRole('radio', { name: 'Normal Budget' }).click();

  // Percentages must total 100%.
  await page2.getByRole('radio', { name: 'Plan' }).click();
  await page2.getByLabel('Needs percent').fill('50');
  check(await page2.locator('.notice.over', { hasText: '95%' }).isVisible(), 'Percentages not totaling 100% are flagged');
  check(await page2.getByRole('button', { name: 'Save split' }).isDisabled(), 'Cannot save a split that is not 100%');
  await page2.getByLabel('Needs percent').fill('55');
  await page2.screenshot({ path: `${shots}11-plan.png`, fullPage: true });

  // Reviews and export.
  await page2.getByRole('radio', { name: 'Review' }).click();
  await page2.screenshot({ path: `${shots}12-review.png`, fullPage: true });
  await page2.getByRole('radio', { name: 'Monthly summary' }).click();
  await page2.screenshot({ path: `${shots}13-monthly.png`, fullPage: true });
  const [rep] = await Promise.all([page2.waitForEvent('download'), page2.getByRole('button', { name: 'Export CSV' }).click()]);
  await rep.saveAs(`${shots}monthly.csv`);
  check(readFileSync(`${shots}monthly.csv`, 'utf8').includes('Remaining budget'), 'Monthly report exports as CSV');
  const overflowBudget = await page2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflowBudget, 'Budget pages fit the phone width');
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
