const autocannon = require('autocannon');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function runLoadTest() {
  console.log('Starting Load Test: 300 Concurrent Users for 1 Minute...');
  
  const result = await autocannon({
    url: 'http://localhost:8080/api/health', // Targeting the local API
    connections: 300,
    duration: 60
  });

  console.log('\\n--- Load Test Completed ---');
  console.log(`Requests per second (RPS): ${result.requests.average}`);
  console.log(`Response Time:`);
  console.log(`  Average: ${result.latency.average}ms`);
  console.log(`  Min: ${result.latency.min}ms`);
  console.log(`  Max: ${result.latency.max}ms`);
  console.log(`  Errors/Timeouts: ${result.errors} / ${result.timeouts}`);

  // Save to Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Load Test Results');
  
  worksheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
    { header: 'Unit', key: 'unit', width: 10 }
  ];

  worksheet.addRows([
    { metric: 'Total Connections (Virtual Users)', value: 300, unit: 'Users' },
    { metric: 'Duration', value: 60, unit: 'Seconds' },
    { metric: 'Requests Per Second (RPS)', value: result.requests.average, unit: 'req/sec' },
    { metric: 'Total Requests Sent', value: result.requests.total, unit: 'Requests' },
    { metric: 'Average Response Time', value: result.latency.average, unit: 'ms' },
    { metric: 'Fastest Response (Min)', value: result.latency.min, unit: 'ms' },
    { metric: 'Slowest Response (Max)', value: result.latency.max, unit: 'ms' },
    { metric: '50th Percentile (Median)', value: result.latency.p50, unit: 'ms' },
    { metric: '99th Percentile', value: result.latency.p99, unit: 'ms' },
    { metric: 'Errors', value: result.errors, unit: 'Count' },
    { metric: 'Timeouts', value: result.timeouts, unit: 'Count' }
  ]);

  const reportPath = path.join(__dirname, '..', 'reports', 'Load_Test_Report.xlsx');
  
  // Ensure directory exists
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(reportPath);
  console.log(`\\nExcel report saved successfully to: ${reportPath}`);
}

runLoadTest().catch(console.error);
