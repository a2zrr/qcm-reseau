// Upgrade test: a browser that saved progress on the OLD build must still have it on the NEW build.
//
// Steps:
//   1. Build OLD_REF (default origin/main) in a temporary git worktree, and the working tree (NEW).
//   2. Serve OLD on PORT, answer some questions (no submit) and submit a second attempt in another profile.
//   3. Serve NEW on the SAME port (same origin = same localStorage), reload, and check everything.
//
// Usage:  npm run test:upgrade
// Env:    OLD_REF (default origin/main), PORT (default 4173), CHROME_PATH (optional: a Chrome/Chromium binary).
//         Without CHROME_PATH, install a browser once: npx playwright-core install chromium
//
// Only clicks are made: no answer is read from the question data, and no answer key appears here.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLD_REF = process.env.OLD_REF ?? 'origin/main';
const PORT = Number(process.env.PORT ?? 4173);
const BASE = `http://localhost:${PORT}/`;

// The live quiz (OLD) and the quiz being added (NEW). Labels must match the home screen.
// Update these three values when the next quiz is added.
const OLD = { label: 'QCM Réseau 2021', key: 'qcm-reseau:attempt', count: 31 };
const NEW = { label: 'QCM Réseau 2019', key: 'qcm-reseau:attempt-2019', count: 18 };

const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
};

// ---------- builds ----------
function buildOld(tmp) {
  const wt = path.join(tmp, 'old-src');
  execFileSync('git', ['-C', ROOT, 'worktree', 'add', '--detach', wt, OLD_REF], { stdio: 'inherit' });
  try {
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(wt, 'node_modules'));
    execFileSync(path.join(ROOT, 'node_modules/.bin/vite'), ['build', '--outDir', path.join(tmp, 'old-dist'), '--emptyOutDir'], { cwd: wt, stdio: 'inherit' });
  } finally {
    execFileSync('git', ['-C', ROOT, 'worktree', 'remove', '--force', wt], { stdio: 'inherit' });
  }
  return path.join(tmp, 'old-dist');
}

function buildNew(tmp) {
  const out = path.join(tmp, 'new-dist');
  execFileSync(path.join(ROOT, 'node_modules/.bin/vite'), ['build', '--outDir', out, '--emptyOutDir'], { cwd: ROOT, stdio: 'inherit' });
  return out;
}

// ---------- static server (switchable root, same port) ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
let root = '';
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, path.normalize(rel));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// ---------- browser helpers ----------
const CHROME = process.env.CHROME_PATH || undefined;
const visible = (page) => page.locator('section.swipe-page[aria-hidden="false"]');
async function answerVisible(page, n) {
  const cards = visible(page).locator('article.card');
  for (let i = 0; i < Math.min(n, await cards.count()); i++) {
    const card = cards.nth(i);
    if (await card.locator('input[type="radio"]').count()) await card.locator('label.option').first().click();
    else if (await card.locator('input[type="checkbox"]').count()) await card.locator('label.option').nth(1).click();
    else if (await card.locator('select').count()) await card.locator('select').selectOption({ index: 1 });
    else await card.locator('button[data-dir="1"]').first().click();
  }
}
const raw = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const heading = (page) => page.locator('h1').first().textContent();
const currentPill = (page) => page.locator('[aria-current="page"]').first().textContent();
const progressText = (page) => page.locator('.progress-text').first().textContent();
/** Same stored data, ignoring `view` (which legitimately moves between results and review). */
const sameData = (a, b, ignoreView = false) => {
  if (a === null || b === null) return a === b;
  const norm = (x) => {
    const o = JSON.parse(x);
    if (ignoreView) delete o.view;
    return JSON.stringify(o);
  };
  return norm(a) === norm(b);
};

// ---------- seed with the OLD build ----------
async function seedOld(profile, mode) {
  const ctx = await chromium.launchPersistentContext(profile, { executablePath: CHROME, headless: true });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Commencer le test' }).click();
  let snap;
  if (mode === 'progress') {
    await page.getByRole('button', { name: 'Suivant' }).click(); // page 2, nothing submitted
    await answerVisible(page, 3);
    await page.waitForTimeout(300);
    snap = { raw: await raw(page, OLD.key), pill: await currentPill(page), progress: await progressText(page) };
  } else {
    await answerVisible(page, 3); // page 1
    await page.getByRole('button', { name: 'Terminer le test' }).click();
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await page.waitForTimeout(300);
    snap = { raw: await raw(page, OLD.key), score: await page.locator('.score-points').textContent() };
  }
  await ctx.close();
  return snap;
}

// ---------- checks with the NEW build ----------
async function checkInProgress(profile, snap) {
  const ctx = await chromium.launchPersistentContext(profile, { executablePath: CHROME, headless: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE);
  await page.waitForTimeout(400);
  check('in progress: bare URL lands in the quiz', (await heading(page)) === OLD.label.replace(/ \d{4}$/, ''), await heading(page));
  check('in progress: same page restored', (await currentPill(page)) === snap.pill);
  check('in progress: same answers', (await progressText(page)) === snap.progress);
  check('in progress: saved data unchanged by load', sameData(await raw(page, OLD.key), snap.raw));

  await page.getByRole('link', { name: 'Changer de QCM' }).click();
  const cards = page.locator('ul.quiz-list > li');
  check('home lists two quizzes', (await cards.count()) === 2);
  const tOld = await cards.nth(0).textContent();
  const tNew = await cards.nth(1).textContent();
  check('home: old quiz in progress with Reprendre', tOld.includes(`En cours : 3 / ${OLD.count}`) && tOld.includes('Reprendre'), tOld.slice(0, 80));
  check('home: new quiz not started with Commencer', tNew.includes('Pas commencé') && tNew.includes('Commencer'), tNew.slice(0, 80));

  await cards.nth(1).getByRole('link').click();
  await page.waitForFunction((t) => document.querySelector('h1')?.textContent === t, NEW.label);
  check('new quiz starts on its start screen', (await heading(page)) === NEW.label);
  check('new quiz storage empty before starting', (await raw(page, NEW.key)) === null);
  await page.getByRole('button', { name: 'Commencer le test' }).click();
  check('new quiz: nothing answered at start', (await progressText(page)).startsWith('0 /'));
  await answerVisible(page, 2);
  await page.getByRole('button', { name: 'Suivant' }).click();
  await answerVisible(page, 1);
  await page.waitForTimeout(300);
  check('new quiz: 3 answers on page 2', (await progressText(page)).startsWith('3 /') && (await currentPill(page)) === '2');

  await page.reload();
  await page.waitForTimeout(400);
  check('new quiz: reload restores page 2 and 3 answers', (await heading(page)) === NEW.label && (await currentPill(page)) === '2' && (await progressText(page)).startsWith('3 /'));
  check('old quiz data untouched by new quiz use', sameData(await raw(page, OLD.key), snap.raw));

  await page.goto(BASE);
  await page.waitForTimeout(400);
  check('bare URL again lands in the old quiz', (await heading(page)) === OLD.label.replace(/ \d{4}$/, '') && (await currentPill(page)) === snap.pill);
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

async function checkSubmitted(profile, snap) {
  const ctx = await chromium.launchPersistentContext(profile, { executablePath: CHROME, headless: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE);
  await page.waitForTimeout(400);
  check('submitted: bare URL lands on results', (await heading(page)) === 'Résultats', await heading(page));
  check('submitted: same score', (await page.locator('.score-points').textContent()) === snap.score);
  check('submitted: saved data unchanged by load', sameData(await raw(page, OLD.key), snap.raw, true));

  await page.getByRole('link', { name: 'Changer de QCM' }).click();
  const tOld = await page.locator('ul.quiz-list > li').nth(0).textContent();
  check('home: old quiz finished with grade and Revoir', tOld.includes('Terminé') && tOld.includes('/ 20') && tOld.includes('Revoir'), tOld.slice(0, 90));

  await page.locator('ul.quiz-list > li').nth(1).getByRole('link').click();
  await page.getByRole('button', { name: 'Commencer le test' }).waitFor();
  await page.getByRole('button', { name: 'Commencer le test' }).click();
  await answerVisible(page, 2);
  await page.getByRole('button', { name: 'Terminer le test' }).click();
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await page.waitForTimeout(300);
  check('new quiz: submit shows its results', (await heading(page)) === 'Résultats' && (await page.locator('.score-points').textContent()).includes(`/ ${NEW.count}`));
  check('old quiz data untouched by new quiz submit', sameData(await raw(page, OLD.key), snap.raw, true));

  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.getByRole('button', { name: 'Effacer et recommencer' }).click();
  await page.waitForTimeout(300);
  check('new quiz restart shows its start screen', (await heading(page)) === NEW.label && (await raw(page, NEW.key)) === null);
  check('old quiz data untouched by new quiz restart', sameData(await raw(page, OLD.key), snap.raw, true));

  await page.goto(BASE);
  await page.waitForTimeout(400);
  check('bare URL still shows the old quiz results', (await heading(page)) === 'Résultats');
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------- main ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qcm-upgrade-'));
let failed = true;
try {
  console.log(`Building OLD (${OLD_REF}) and NEW (working tree)…`);
  const oldDist = buildOld(tmp);
  const newDist = buildNew(tmp);

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  root = oldDist;
  const snapProgress = await seedOld(path.join(tmp, 'profile-progress'), 'progress');
  const snapSubmitted = await seedOld(path.join(tmp, 'profile-submitted'), 'submitted');

  root = newDist; // same port, same origin
  console.log('\n== in progress (old build -> new build) ==');
  await checkInProgress(path.join(tmp, 'profile-progress'), snapProgress);
  console.log('\n== submitted (old build -> new build) ==');
  await checkSubmitted(path.join(tmp, 'profile-submitted'), snapSubmitted);

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  failed = passed !== results.length;
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exitCode = failed ? 1 : 0;
