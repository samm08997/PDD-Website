/**
 * run-web.js
 * Runs all Selenium web tests via Mocha, collects results,
 * then generates an Excel report.
 */
const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');
const { generateReport } = require('./utils/reporter');
const config = require('./config');

// Ensure reports directory exists
if (!fs.existsSync(config.REPORTS_DIR)) {
  fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
}

const mocha = new Mocha({
  timeout: 60000,
  reporter: 'spec',
  bail: false,
});

// ── Discover all selenium test files ─────────────────────────────────────
const seleniumDir = path.join(__dirname, 'selenium');
function findTests(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir).forEach((entry) => {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      files.push(...findTests(full));
    } else if (full.endsWith('.test.js')) {
      files.push(full);
    }
  });
  return files;
}

const testFiles = findTests(seleniumDir).sort();
console.log(`\n🔍 Found ${testFiles.length} Selenium test files:\n`);
testFiles.forEach((f) => console.log(`   ${path.relative(__dirname, f)}`));
console.log();

testFiles.forEach((f) => mocha.addFile(f));

// ── Run ───────────────────────────────────────────────────────────────────
mocha.run(async (failures) => {
  const reportPath = await generateReport(
    path.join(config.REPORTS_DIR, `CramAI_Web_TestReport_${new Date().toISOString().slice(0, 10)}.xlsx`)
  );

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  CramAI Web Test Run Complete`);
  console.log(`  Failures: ${failures}`);
  console.log(`  Report:   ${reportPath}`);
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(failures ? 1 : 0);
});
