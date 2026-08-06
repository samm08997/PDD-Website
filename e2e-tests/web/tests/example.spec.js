const { expect } = require('chai');
const { getDriver } = require('../config/selenium.config');
const ExcelReporter = require('../../utils/excelReporter');

const reporter = new ExcelReporter('Web');

describe('Web Application - Authentication Suite', function () {
  this.timeout(30000); // 30 seconds timeout
  let driver;

  before(async function () {
    driver = await getDriver();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
    await reporter.save();
  });

  afterEach(function () {
    reporter.addResult({
      suite: this.currentTest.parent.title,
      test: this.currentTest.title,
      status: this.currentTest.state === 'passed' ? 'Pass' : 'Fail',
      duration: this.currentTest.duration,
      error: this.currentTest.err ? this.currentTest.err.message : null,
    });
  });

  it('should open the homepage and verify title', async function () {
    await driver.get('http://example.com'); // changed to example.com just for this demonstration
    const title = await driver.getTitle();
    
    // Example assertion
    expect(title).to.include('Example Domain');
  });

  // Example for more test cases
  // 1 to 300 test cases will go here grouped in different describe blocks
  // e.g. Login tests, Signup tests, Profile updates, Navigation
});
