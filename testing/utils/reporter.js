/**
 * Excel Report Generator for CramAI Test Suite
 * Generates a comprehensive Excel workbook with:
 *   - Summary sheet (pass/fail counts, duration, pie chart data)
 *   - Web Tests sheet (all Selenium results)
 *   - Mobile Tests sheet (all Appium results)
 *   - API Tests sheet
 *   - Failed Tests sheet (for quick debugging)
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// ── Result store (populated by mocha reporter hooks) ────────────────────────
const results = {
  web: [],
  mobile: [],
  api: [],
};

/**
 * Record a single test result
 * @param {'web'|'mobile'|'api'} suite
 * @param {object} result - { id, category, testName, status, duration, error, screenshot }
 */
function recordResult(suite, result) {
  results[suite].push({
    id: results[suite].length + 1,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate the Excel report workbook
 */
async function generateReport(outputPath) {
  // Ensure reports dir exists
  if (!fs.existsSync(config.REPORTS_DIR)) {
    fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'CramAI Test Suite';
  wb.created = new Date();

  // ── COLOUR PALETTE ─────────────────────────────────────────────────────
  const COLORS = {
    headerBg: '4F46E5',     // Indigo
    headerFg: 'FFFFFF',
    pass: 'D1FAE5',
    passBorder: '10B981',
    fail: 'FEE2E2',
    failBorder: 'EF4444',
    skip: 'FEF3C7',
    skipBorder: 'F59E0B',
    sectionBg: 'EEF2FF',
    altRow: 'F8FAFF',
    white: 'FFFFFF',
    dark: '1E1B4B',
  };

  // ── HELPER: style a header row ──────────────────────────────────────────
  function styleHeader(row) {
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
      cell.font = { bold: true, color: { argb: COLORS.headerFg }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.headerBg } },
        bottom: { style: 'thin', color: { argb: COLORS.headerBg } },
      };
    });
  }

  // ── HELPER: style a data row ────────────────────────────────────────────
  function styleDataRow(row, status, isAlt) {
    let bg = isAlt ? COLORS.altRow : COLORS.white;
    if (status === 'PASS') bg = COLORS.pass;
    if (status === 'FAIL') bg = COLORS.fail;
    if (status === 'SKIP') bg = COLORS.skip;

    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.font = { size: 10 };
    });
    row.height = 18;
  }

  // ── HELPER: compute stats ────────────────────────────────────────────────
  function stats(arr) {
    const total = arr.length;
    const pass = arr.filter((r) => r.status === 'PASS').length;
    const fail = arr.filter((r) => r.status === 'FAIL').length;
    const skip = arr.filter((r) => r.status === 'SKIP').length;
    const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0';
    const duration = arr.reduce((acc, r) => acc + (r.duration || 0), 0);
    return { total, pass, fail, skip, rate, duration };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET 1 — SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  const summarySheet = wb.addWorksheet('📊 Summary', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  });

  summarySheet.columns = [
    { key: 'label', width: 28 },
    { key: 'web', width: 18 },
    { key: 'mobile', width: 18 },
    { key: 'api', width: 18 },
    { key: 'total', width: 18 },
  ];

  // Title
  summarySheet.mergeCells('A1:E1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '🎓 CramAI — End-to-End Test Report';
  titleCell.font = { bold: true, size: 18, color: { argb: COLORS.dark } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
  summarySheet.getRow(1).height = 40;

  // Generated At
  summarySheet.mergeCells('A2:E2');
  const genCell = summarySheet.getCell('A2');
  genCell.value = `Generated: ${new Date().toLocaleString()}  |  App: http://localhost:8082  |  API: http://localhost:8080`;
  genCell.font = { italic: true, color: { argb: '6B7280' }, size: 10 };
  genCell.alignment = { horizontal: 'center' };
  summarySheet.getRow(2).height = 20;

  summarySheet.addRow([]);

  // Header row
  const headerRow = summarySheet.addRow(['Metric', '🌐 Web (Selenium)', '📱 Mobile (Appium)', '🔌 API', '📈 Total']);
  styleHeader(headerRow);

  const webStats = stats(results.web);
  const mobStats = stats(results.mobile);
  const apiStats = stats(results.api);
  const allResults = [...results.web, ...results.mobile, ...results.api];
  const allStats = stats(allResults);

  const summaryData = [
    ['Total Tests', webStats.total, mobStats.total, apiStats.total, allStats.total],
    ['✅ Passed', webStats.pass, mobStats.pass, apiStats.pass, allStats.pass],
    ['❌ Failed', webStats.fail, mobStats.fail, apiStats.fail, allStats.fail],
    ['⏭ Skipped', webStats.skip, mobStats.skip, apiStats.skip, allStats.skip],
    ['Pass Rate (%)', webStats.rate + '%', mobStats.rate + '%', apiStats.rate + '%', allStats.rate + '%'],
    ['Duration (ms)', webStats.duration, mobStats.duration, apiStats.duration, allStats.duration],
  ];

  summaryData.forEach((rowData, i) => {
    const r = summarySheet.addRow(rowData);
    r.height = 22;
    r.eachCell((cell, col) => {
      cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'center' };
      cell.font = { size: 11, bold: col === 1 };
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: i % 2 === 0 ? COLORS.altRow : COLORS.white },
      };
    });
    // Color pass/fail rows
    if (rowData[0].includes('Passed')) r.getCell(5).font = { bold: true, color: { argb: COLORS.passBorder } };
    if (rowData[0].includes('Failed')) r.getCell(5).font = { bold: true, color: { argb: COLORS.failBorder } };
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER: Build a results sheet (used for web, mobile, api)
  // ═══════════════════════════════════════════════════════════════════════
  function buildResultsSheet(sheetName, data) {
    const ws = wb.addWorksheet(sheetName, {
      pageSetup: { fitToPage: true, orientation: 'landscape' },
    });

    ws.columns = [
      { key: 'id', header: '#', width: 6 },
      { key: 'category', header: 'Category', width: 22 },
      { key: 'testName', header: 'Test Case', width: 55 },
      { key: 'status', header: 'Status', width: 10 },
      { key: 'duration', header: 'Duration (ms)', width: 15 },
      { key: 'error', header: 'Error / Notes', width: 50 },
      { key: 'timestamp', header: 'Timestamp', width: 22 },
    ];

    // Title
    ws.mergeCells('A1:G1');
    const t = ws.getCell('A1');
    t.value = sheetName;
    t.font = { bold: true, size: 14, color: { argb: COLORS.dark } };
    t.alignment = { horizontal: 'center', vertical: 'middle' };
    t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
    ws.getRow(1).height = 32;

    // Header
    const hRow = ws.getRow(2);
    hRow.values = ['#', 'Category', 'Test Case', 'Status', 'Duration (ms)', 'Error / Notes', 'Timestamp'];
    styleHeader(hRow);

    // Data rows
    data.forEach((r, i) => {
      const row = ws.addRow([
        r.id,
        r.category || '',
        r.testName || '',
        r.status || 'SKIP',
        r.duration || 0,
        r.error || '',
        r.timestamp || '',
      ]);
      styleDataRow(row, r.status, i % 2 === 1);

      // Status cell special font
      const statusCell = row.getCell(4);
      if (r.status === 'PASS') statusCell.font = { bold: true, color: { argb: '059669' } };
      if (r.status === 'FAIL') statusCell.font = { bold: true, color: { argb: 'DC2626' } };
      if (r.status === 'SKIP') statusCell.font = { bold: true, color: { argb: 'D97706' } };
    });

    // Auto-filter
    ws.autoFilter = { from: 'A2', to: 'G2' };

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 2 }];

    return ws;
  }

  buildResultsSheet('🌐 Web Tests (Selenium)', results.web);
  buildResultsSheet('📱 Mobile Tests (Appium)', results.mobile);
  buildResultsSheet('🔌 API Tests', results.api);

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET — FAILED TESTS (quick debug view)
  // ═══════════════════════════════════════════════════════════════════════
  const failed = allResults.filter((r) => r.status === 'FAIL');
  if (failed.length > 0) {
    buildResultsSheet('🚨 Failed Tests', failed);
  }

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const finalPath = outputPath || path.join(config.REPORTS_DIR, `CramAI_TestReport_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(finalPath);
  console.log(`\n📊 Excel report saved → ${finalPath}\n`);
  return finalPath;
}

module.exports = { recordResult, generateReport, results };
