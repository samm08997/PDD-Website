/**
 * run-mobile.js
 * Runs all Appium mobile tests via Mocha, collects results,
 * then generates an Excel report.
 *
 * Prerequisites:
 *   1. Start Appium: npx appium
 *   2. Start Android emulator or connect device
 *   3. Build the app APK: eas build --platform android --profile preview
 */
const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');
const { generateReport } = require('./utils/reporter');
const config = require('./config');

if (!fs.existsSync(config.REPORTS_DIR)) {
  fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
}

const mocha = new Mocha({
  timeout: 120000,
  reporter: 'spec',
  bail: false,
});

const appiumDir = path.join(__dirname, 'appium');
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

const testFiles = findTests(appiumDir).sort();
console.log(`\n🔍 Found ${testFiles.length} Appium test files:\n`);
testFiles.forEach((f) => console.log(`   ${path.relative(__dirname, f)}`));
console.log();

testFiles.forEach((f) => mocha.addFile(f));

mocha.run(async (failures) => {
  const reportPath = await generateReport(
    path.join(config.REPORTS_DIR, `CramAI_Mobile_TestReport_${new Date().toISOString().slice(0, 10)}.xlsx`)
  );

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  CramAI Mobile Test Run Complete`);
  console.log(`  Failures: ${failures}`);
  console.log(`  Report:   ${reportPath}`);
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(failures ? 1 : 0);
});
