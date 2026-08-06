# 🎓 CramAI — End-to-End Test Suite

> **300+ test cases** covering Web (Selenium) + Mobile (Appium) + API testing with Excel report generation.

---

## 📁 Folder Structure

```
testing/
├── config.js                         # Central config (URLs, credentials, Appium caps)
├── run-web.js                         # Run all Selenium tests → Excel report
├── run-mobile.js                      # Run all Appium tests → Excel report
├── run-all.js                         # Run EVERYTHING → combined Excel report
│
├── utils/
│   ├── driver.js                      # Selenium WebDriver factory + helpers
│   └── reporter.js                    # ExcelJS report generator
│
├── selenium/                          # 🌐 Web Tests (Chrome + Selenium)
│   ├── 01_auth/auth.test.js           # TC-WEB-001 → TC-WEB-035  (35 tests)
│   ├── 02_home/home.test.js           # TC-WEB-036 → TC-WEB-065  (30 tests)
│   ├── 03_create/create.test.js       # TC-WEB-066 → TC-WEB-100  (35 tests)
│   ├── 04_player_quiz_timer/          # TC-WEB-101 → TC-WEB-200  (100 tests)
│   └── 07_api/api.test.js             # TC-API-001 → TC-API-050  (50 tests)
│
├── appium/                            # 📱 Mobile Tests (Appium)
│   ├── 01_auth/auth.mobile.test.js    # TC-MOB-001 → TC-MOB-050  (50 tests)
│   └── 02_features/                   # TC-MOB-051 → TC-MOB-300  (250 tests)
│       └── features.mobile.test.js
│
└── reports/                           # 📊 Generated Excel reports (auto-created)
```

**Total: 550 test cases** (200 Web + 300 Mobile + 50 API)

---

## ⚙️ Setup

### 1. Install dependencies
```bash
cd testing
npm install
```

### 2. Configure test credentials

Edit `config.js`:
```js
TEST_USER: {
  email: 'your-test-account@email.com',
  password: 'YourTestPassword123!',
},
```
Create this account in the app before running tests.

### 3. Make sure the app is running

```bash
# In terminal 1 — Start API server
cd .. && PORT=8080 GROQ_API_KEY=your_key pnpm --filter @workspace/api-server run dev

# In terminal 2 — Start web app
cd .. && npx expo start --web --port 8082
```

---

## 🚀 Running Tests

### Run all Web (Selenium) tests
```bash
npm run test:web
```
Requires: Google Chrome installed.

### Run all Mobile (Appium) tests
```bash
# First, start Appium server:
npx appium

# Start Android emulator or connect device
# Then:
npm run test:mobile
```
> Note: Mobile tests are marked **SKIP** (not FAIL) if Appium is not available.

### Run EVERYTHING
```bash
npm run test:all
```

### Run API tests only
```bash
npm run test:api
```

---

## 📊 Excel Report

After each run, an Excel file is generated in the `reports/` folder:

```
reports/CramAI_Web_TestReport_2026-08-05.xlsx
reports/CramAI_Mobile_TestReport_2026-08-05.xlsx
reports/CramAI_FullReport_2026-08-05_14-30.xlsx
```

The workbook contains:
| Sheet | Contents |
|---|---|
| 📊 Summary | Pass/Fail/Skip counts, pass rate, duration per suite |
| 🌐 Web Tests (Selenium) | All 200 web test results |
| 📱 Mobile Tests (Appium) | All 300 mobile test results |
| 🔌 API Tests | All 50 API test results |
| 🚨 Failed Tests | Quick-view of all failures (only present if failures exist) |

---

## 📋 Test Case ID Reference

| Range | Suite | Count |
|---|---|---|
| TC-WEB-001 – TC-WEB-035 | Authentication (Web) | 35 |
| TC-WEB-036 – TC-WEB-065 | Home / Dashboard (Web) | 30 |
| TC-WEB-066 – TC-WEB-100 | Create Deck (Web) | 35 |
| TC-WEB-101 – TC-WEB-130 | Flashcard Player (Web) | 30 |
| TC-WEB-131 – TC-WEB-170 | Quiz Mode (Web) | 40 |
| TC-WEB-171 – TC-WEB-200 | Study Timer (Web) | 30 |
| TC-API-001 – TC-API-050 | REST API | 50 |
| TC-MOB-001 – TC-MOB-050 | Auth (Mobile) | 50 |
| TC-MOB-051 – TC-MOB-100 | Home (Mobile) | 50 |
| TC-MOB-101 – TC-MOB-150 | Create (Mobile) | 50 |
| TC-MOB-151 – TC-MOB-200 | Player (Mobile) | 50 |
| TC-MOB-201 – TC-MOB-250 | Quiz (Mobile) | 50 |
| TC-MOB-251 – TC-MOB-300 | Timer (Mobile) | 50 |
| **TOTAL** | | **550** |

---

## 🔧 Appium Mobile Setup

1. **Install Appium globally**: `npm install -g appium`
2. **Install UiAutomator2 driver**: `appium driver install uiautomator2`
3. **Install XCUITest driver (iOS)**: `appium driver install xcuitest`
4. **Build the APK**: `cd ../artifacts/cram-ai && eas build --platform android --profile preview`
5. **Update APK path** in `config.js → ANDROID.app`
6. **Start Appium server**: `appium`
7. **Start emulator**: `emulator @Pixel_7_API_33`
8. **Run**: `npm run test:mobile`
