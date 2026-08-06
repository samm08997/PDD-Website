const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class MultiTabReporter {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.summarySheet = this.workbook.addWorksheet('Test Summary');
    this.detailsSheet = this.workbook.addWorksheet('Test Details');
    this.filePath = path.join(__dirname, '..', 'reports', 'Mobile_Appium_Test_Report.xlsx');
    
    this.results = [];
    this.startTime = Date.now();
    
    // Setup Summary Sheet Columns
    this.summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    
    // Setup Details Sheet Columns
    this.detailsSheet.columns = [
      { header: 'Screen / Flow', key: 'suite', width: 40 },
      { header: 'Test Name', key: 'test', width: 60 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Error', key: 'error', width: 50 },
    ];
  }

  addResult(result) {
    this.results.push(result);
    this.detailsSheet.addRow(result);
  }

  async save() {
    const passed = this.results.filter(r => r.status === 'Pass').length;
    const failed = this.results.filter(r => r.status === 'Fail').length;
    const total = this.results.length;
    const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    this.summarySheet.addRows([
      { metric: 'Total Tests Run', value: total },
      { metric: 'Passed Tests', value: passed },
      { metric: 'Failed Tests', value: failed },
      { metric: 'Total Execution Time (s)', value: durationSec },
      { metric: 'Pass Percentage', value: total === 0 ? '0%' : `${((passed / total) * 100).toFixed(2)}%` }
    ]);
    
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    try {
      await this.workbook.xlsx.writeFile(this.filePath);
      console.log(`Report saved to ${this.filePath}`);
    } catch (err) {
      console.error('Error saving report', err);
    }
  }
}

module.exports = MultiTabReporter;
