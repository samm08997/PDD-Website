/**
 * WebDriver Helper — Selenium
 * Handles driver setup, teardown, and common interactions
 */
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config');

let driver = null;

const chromeOptions = new chrome.Options();
if (config.HEADLESS) {
  chromeOptions.addArguments('--headless=new');
}
chromeOptions.addArguments(
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--window-size=1440,900',
  '--disable-web-security',
  '--allow-running-insecure-content'
);

/**
 * Build and return a new WebDriver instance
 */
async function buildDriver() {
  driver = await new Builder()
    .forBrowser(config.BROWSER)
    .setChromeOptions(chromeOptions)
    .build();
  await driver.manage().setTimeouts({
    implicit: config.IMPLICIT_WAIT,
    pageLoad: config.PAGE_LOAD,
  });
  return driver;
}

/**
 * Quit the driver
 */
async function quitDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
  }
}

/**
 * Get current driver instance
 */
function getDriver() {
  return driver;
}

/**
 * Navigate to a path on the web app
 */
async function goto(path) {
  await driver.get(`${config.WEB_BASE_URL}${path}`);
  await driver.sleep(1500); // allow React to mount
}

/**
 * Wait for element to be visible
 */
async function waitForElement(locator, timeout = config.EXPLICIT_WAIT) {
  return driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Wait for element to be clickable
 */
async function waitForClickable(locator, timeout = config.EXPLICIT_WAIT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

/**
 * Safe click (waits then clicks)
 */
async function click(locator) {
  const el = await waitForClickable(locator);
  await el.click();
  return el;
}

/**
 * Type text into a field (clears first)
 */
async function type(locator, text) {
  const el = await waitForElement(locator);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

/**
 * Get text content of an element
 */
async function getText(locator) {
  const el = await waitForElement(locator);
  return el.getText();
}

/**
 * Check if element exists on page
 */
async function elementExists(locator) {
  try {
    const els = await driver.findElements(locator);
    return els.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get current URL
 */
async function getCurrentUrl() {
  return driver.getCurrentUrl();
}

/**
 * Take a screenshot (returns base64)
 */
async function screenshot() {
  return driver.takeScreenshot();
}

/**
 * Login helper — navigates to login and authenticates
 */
async function login(email = config.TEST_USER.email, password = config.TEST_USER.password) {
  await goto('/login');
  await driver.sleep(1000);
  await type(By.css('input[type="email"], input[placeholder*="mail"]'), email);
  await type(By.css('input[type="password"], input[placeholder*="assword"]'), password);
  await click(By.xpath("//button[contains(., 'Sign In') or contains(., 'Log In') or contains(., 'Login')]"));
  await driver.sleep(2000);
}

module.exports = {
  buildDriver,
  quitDriver,
  getDriver,
  goto,
  waitForElement,
  waitForClickable,
  click,
  type,
  getText,
  elementExists,
  getCurrentUrl,
  screenshot,
  login,
  By,
  until,
};
