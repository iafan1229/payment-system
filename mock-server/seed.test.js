const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const test = require('node:test');

const sourcePath = path.join(__dirname, 'seed.js');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function runSeedInTemp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payment-system-seed-'));
  const tempSeedPath = path.join(tempDir, 'seed.js');

  fs.copyFileSync(sourcePath, tempSeedPath);
  execFileSync(process.execPath, [tempSeedPath], {
    cwd: tempDir,
    stdio: 'pipe',
  });

  const dbPath = path.join(tempDir, 'db.json');
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

test('seed output is deterministic across runs', async () => {
  const firstRun = runSeedInTemp();
  await delay(25);
  const secondRun = runSeedInTemp();

  assert.deepStrictEqual(secondRun, firstRun);
});

test('seeded transactions stay within a 30-day window per environment', () => {
  const db = runSeedInTemp();

  for (const [env, transactions] of Object.entries(db)) {
    const timestamps = transactions.map((transaction) => Date.parse(transaction.created_at));
    const newest = Math.max(...timestamps);
    const oldest = Math.min(...timestamps);

    assert.ok(
      newest - oldest <= THIRTY_DAYS_MS,
      `${env} should stay within 30 days, got ${(newest - oldest) / (24 * 60 * 60 * 1000)} days`,
    );
  }
});
