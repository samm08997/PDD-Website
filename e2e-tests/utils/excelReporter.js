const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReporter {
  constructor(environment) {
    this.environment = environment;
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet(`${environment} Test Report`);
    this.filePath = path.join(__dirname, '..', 'reports', 'Test_Report.xlsx');

    this.worksheet.columns = [
      { header: 'Environment', key: 'env', width: 15 },
      { header: 'Test Suite', key: 'suite', width: 30 },
      { header: 'Test Name', key: 'test', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Error', key: 'error', width: 50 },
    ];

    // Load existing workbook if it exists
    if (fs.existsSync(this.filePath)) {
      this.workbook.xlsx.readFile(this.filePath).then(() => {
        let sheet = this.workbook.getWorksheet(`${environment} Test Report`);
        if (!sheet) {
           this.worksheet = this.workbook.addWorksheet(`${environment} Test Report`);
           this.worksheet.columns = [
             { header: 'Environment', key: 'env', width: 15 },
             { header: 'Test Suite', key: 'suite', width: 30 },
             { header: 'Test Name', key: 'test', width: 40 },
             { header: 'Status', key: 'status', width: 15 },
             { header: 'Duration (ms)', key: 'duration', width: 15 },
             { header: 'Error', key: 'error', width: 50 },
           ];
        } else {
            this.worksheet = sheet;
        }
      }).catch(err => console.log('Error loading existing workbook:', err));
    }
  }

  addResult(testResult) {
    this.worksheet.addRow({
      env: this.environment,
      suite: testResult.suite,
      test: testResult.test,
      status: testResult.status,
      duration: testResult.duration,
      error: testResult.error || '',
    });
  }

  async save() {
    // Ensure the reports directory exists
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

module.exports = ExcelReporter;
