/**
 * run-all.js
 * Runs ALL tests (Web + Mobile + API) and generates
 * a single combined Excel report.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');
const { generateReport } = require('./utils/reporter');
const config = require('./config');

if (!fs.existsSync(config.REPORTS_DIR)) {
  fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║       🎓 CramAI — Full E2E Test Suite                   ║
║       Web (Selenium) + Mobile (Appium) + API             ║
╚══════════════════════════════════════════════════════════╝
`);

// ── Discover all test files ───────────────────────────────────────────────
function findTests(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir).forEach((entry) => {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) files.push(...findTests(full));
    else if (full.endsWith('.test.js')) files.push(full);
  });
  return files;
}

const webTests = findTests(path.join(__dirname, 'selenium')).sort();
const mobileTests = findTests(path.join(__dirname, 'appium')).sort();
const allTests = [...webTests, ...mobileTests];

console.log(`📋 Test suite breakdown:`);
console.log(`   🌐 Web (Selenium): ${webTests.length} files`);
console.log(`   📱 Mobile (Appium): ${mobileTests.length} files`);
console.log(`   Total files: ${allTests.length}\n`);

const mocha = new Mocha({
  timeout: 120000,
  reporter: 'spec',
  bail: false,
});

allTests.forEach((f) => mocha.addFile(f));

mocha.run(async (failures) => {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  const reportPath = await generateReport(
    path.join(config.REPORTS_DIR, `CramAI_FullReport_${timestamp}.xlsx`)
  );

  const { results } = require('./utils/reporter');
  const all = [...results.web, ...results.mobile, ...results.api];
  const pass = all.filter((r) => r.status === 'PASS').length;
  const fail = all.filter((r) => r.status === 'FAIL').length;
  const skip = all.filter((r) => r.status === 'SKIP').length;

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ PASSED : ${String(pass).padEnd(43)}║
║  ❌ FAILED : ${String(fail).padEnd(43)}║
║  ⏭ SKIPPED: ${String(skip).padEnd(43)}║
║  📊 REPORT : ${reportPath.slice(-44).padEnd(43)}║
╚══════════════════════════════════════════════════════════╝
  `);

  process.exit(failures ? 1 : 0);
});
