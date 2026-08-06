/**
 * CramAI Test Configuration
 * Central config for all Selenium and Appium tests
 */
module.exports = {
  // ── Web App (Expo Web) ──────────────────────────────────────────────────
  WEB_BASE_URL: 'http://localhost:8082',

  // ── API Server ──────────────────────────────────────────────────────────
  API_BASE_URL: 'http://localhost:8080',

  // ── Test Credentials ────────────────────────────────────────────────────
  // Use a test account — sign up in the app first, then add credentials here
  TEST_USER: {
    email: 'test@cramAI.com',
    password: 'TestPass123!',
  },
  INVALID_USER: {
    email: 'notexist@cramAI.com',
    password: 'wrongpassword',
  },

  // ── Browser Settings ─────────────────────────────────────────────────────
  BROWSER: 'chrome',           // 'chrome' | 'firefox' | 'safari'
  HEADLESS: false,             // set true for CI pipelines

  // ── Timeouts ─────────────────────────────────────────────────────────────
  IMPLICIT_WAIT: 10000,        // 10 seconds
  EXPLICIT_WAIT: 15000,        // 15 seconds
  PAGE_LOAD: 30000,            // 30 seconds

  // ── Appium (Mobile) ──────────────────────────────────────────────────────
  APPIUM_HOST: '127.0.0.1',
  APPIUM_PORT: 4723,
  ANDROID: {
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:platformVersion': '13.0',
    'appium:app': '/Users/joesam/Downloads/Study-Helper/artifacts/cram-ai/build/CramAI.apk',
    'appium:automationName': 'UiAutomator2',
    'appium:noReset': false,
    'appium:newCommandTimeout': 60,
  },
  IOS: {
    platformName: 'iOS',
    'appium:deviceName': 'iPhone 14',
    'appium:platformVersion': '17.0',
    'appium:app': '/Users/joesam/Downloads/Study-Helper/artifacts/cram-ai/build/CramAI.app',
    'appium:automationName': 'XCUITest',
    'appium:noReset': false,
  },

  // ── Report Output ─────────────────────────────────────────────────────────
  REPORTS_DIR: './reports',
};
