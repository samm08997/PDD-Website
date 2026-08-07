const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReporter {
  constructor(environment) {
    this.environment = environment;
    this.workbook = new ExcelJS.Workbook();
    this.filePath = path.join(__dirname, '..', 'reports', 'Test_Report.xlsx');
    this.results = [];

    // Load existing workbook if it exists
    if (fs.existsSync(this.filePath)) {
      this.workbook.xlsx.readFile(this.filePath).then(() => {
        this.setupSheets();
      }).catch(err => {
        console.log('Error loading existing workbook:', err);
        this.setupSheets();
      });
    } else {
      this.setupSheets();
    }
  }

  setupSheets() {
    this.detailsSheet = this.workbook.getWorksheet(`${this.environment} Details`);
    if (!this.detailsSheet) {
      this.detailsSheet = this.workbook.addWorksheet(`${this.environment} Details`);
      this.detailsSheet.columns = [
        { header: 'Environment', key: 'env', width: 15 },
        { header: 'Test Suite', key: 'suite', width: 30 },
        { header: 'Test Name', key: 'test', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Duration (ms)', key: 'duration', width: 15 },
        { header: 'Error/Logs', key: 'error', width: 80 },
      ];
    }

    this.summarySheet = this.workbook.getWorksheet(`${this.environment} Summary`);
    if (!this.summarySheet) {
      this.summarySheet = this.workbook.addWorksheet(`${this.environment} Summary`);
      this.summarySheet.columns = [
        { header: 'Environment', key: 'env', width: 15 },
        { header: 'Total Tests', key: 'total', width: 15 },
        { header: 'Passed', key: 'passed', width: 15 },
        { header: 'Failed', key: 'failed', width: 15 },
        { header: 'Pass Rate', key: 'rate', width: 15 },
        { header: 'Visual Graph', key: 'graph', width: 50 }
      ];
    }
  }

  addResult(testResult) {
    this.results.push(testResult);
    if (this.detailsSheet) {
      this.detailsSheet.addRow({
        env: this.environment,
        suite: testResult.suite,
        test: testResult.test,
        status: testResult.status,
        duration: testResult.duration,
        error: testResult.error || 'No errors logged.',
      });
    }
  }

  async save() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Calculate Summary
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'Pass').length;
    const failed = total - passed;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';
    
    // ASCII Graph
    const graphLength = 30;
    const passedBlocks = total > 0 ? Math.round((passed / total) * graphLength) : 0;
    const failedBlocks = graphLength - passedBlocks;
    const graphStr = '█'.repeat(passedBlocks) + '░'.repeat(failedBlocks);

    if (this.summarySheet) {
      this.summarySheet.addRow({
        env: this.environment,
        total: total,
        passed: passed,
        failed: failed,
        rate: rate,
        graph: graphStr
      });
    }

    try {
      await this.workbook.xlsx.writeFile(this.filePath);
      console.log(`Report saved to ${this.filePath}`);
    } catch (err) {
      console.error('Error saving report', err);
    }
  }
}

module.exports = ExcelReporter;
