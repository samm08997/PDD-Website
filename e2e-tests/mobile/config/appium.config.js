const { remote } = require('webdriverio');

const appiumOptions = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'error',
  capabilities: {
    'platformName': 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    // 'appium:app': '/path/to/your/app.apk', // Path to the mobile app
    'appium:browserName': 'Chrome', // Used for testing mobile web if 'app' is not provided
  }
};

async function getAppiumDriver() {
  const driver = await remote(appiumOptions);
  return driver;
}

module.exports = {
  getAppiumDriver,
};
