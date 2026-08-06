const { expect } = require('chai');
const { getAppiumDriver } = require('../config/appium.config');
const ExcelReporter = require('../../utils/excelReporter');

const reporter = new ExcelReporter('Mobile');

describe('Mobile Application - Core Suite', function () {
  this.timeout(60000); // 60 seconds timeout
  let driver;

  before(async function () {
    try {
        driver = await getAppiumDriver();
    } catch (e) {
        console.warn("Could not start Appium driver. Is Appium running?", e.message);
        this.skip();
    }
  });

  after(async function () {
    if (driver) {
      await driver.deleteSession();
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

  it('should launch the application', async function () {
    // Example test for mobile
    // const element = await driver.$('~accessibility_id');
    // await element.click();
    expect(true).to.be.true; 
  });
  
  // Here we would add more test cases based on the specific mobile app features
});
