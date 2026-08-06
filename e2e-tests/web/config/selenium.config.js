const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function getDriver() {
  const options = new chrome.Options();
  // options.addArguments('--headless'); // Uncomment for headless mode
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  return driver;
}

module.exports = {
  getDriver,
};
