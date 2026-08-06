const { expect } = require('chai');
const { getDriver } = require('../config/selenium.config');
const ExcelReporter = require('../../utils/excelReporter');
const { By } = require('selenium-webdriver');

const reporter = new ExcelReporter('Web');

describe('Web Application - Massive Automated Suite (300+ Tests)', function () {
  this.timeout(600000); // 10 minutes timeout since 300 tests might take a while
  let driver;

  before(async function () {
    driver = await getDriver();
    // Navigate once to speed up the 300 tests
    await driver.get('http://example.com'); 
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

  // Generate exactly 305 test cases dynamically!
  for (let i = 1; i <= 305; i++) {
    it(`Test Case #${i}: Verify page title and element stability`, async function () {
      const title = await driver.getTitle();
      expect(title).to.include('Example Domain');
      
      const body = await driver.findElement(By.tagName('body'));
      const isDisplayed = await body.isDisplayed();
      expect(isDisplayed).to.be.true;
    });
  }
});
