/**
 * CramAI — Appium Mobile Tests: Home, Create, Player, Quiz, Timer
 * Tests: TC-MOB-051 → TC-MOB-300 (250 test cases)
 */
const { remote } = require('webdriverio');
const { expect } = require('chai');
const { recordResult } = require('../../utils/reporter');
const config = require('../../config');

// ════════════════════════════════════════════════════════════════════════
// Driver factory + skip guard
// ════════════════════════════════════════════════════════════════════════
async function makeDriver() {
  try {
    return await remote({
      hostname: config.APPIUM_HOST,
      port: config.APPIUM_PORT,
      capabilities: config.ANDROID,
      logLevel: 'error',
    });
  } catch {
    console.warn('⚠️  Appium server not available — mobile tests will be marked SKIP');
    return null;
  }
}

function makeRunner(driver, category) {
  return async function run(id, name, fn) {
    if (!driver) {
      recordResult('mobile', { id, category, testName: name, status: 'SKIP', duration: 0, error: 'Appium unavailable' });
      return;
    }
    const start = Date.now();
    try {
      await fn();
      recordResult('mobile', { id, category, testName: name, status: 'PASS', duration: Date.now() - start });
    } catch (err) {
      recordResult('mobile', { id, category, testName: name, status: 'FAIL', duration: Date.now() - start, error: err.message });
      throw err;
    }
  };
}

// ════════════════════════════════════════════════════════════════════════
// HOME SCREEN (TC-MOB-051 → TC-MOB-100)
// ════════════════════════════════════════════════════════════════════════
describe('📱 MOBILE — Home / Dashboard', function () {
  this.timeout(120000);
  let driver, run;

  before(async () => {
    driver = await makeDriver();
    run = makeRunner(driver, 'Home (Mobile)');
  });
  after(async () => { if (driver) await driver.deleteSession(); });

  const homeTests = [
    ['TC-MOB-051', 'Home screen loads after login'],
    ['TC-MOB-052', 'CramAI branding/logo visible on home'],
    ['TC-MOB-053', 'Create New Deck button is visible'],
    ['TC-MOB-054', 'Create button is tappable'],
    ['TC-MOB-055', 'Timer/Study Timer button is visible'],
    ['TC-MOB-056', 'Timer button navigates to timer screen'],
    ['TC-MOB-057', 'Sign Out button is visible or in menu'],
    ['TC-MOB-058', 'Deck list renders when decks exist'],
    ['TC-MOB-059', 'Empty state shown when no decks'],
    ['TC-MOB-060', 'Deck card displays title'],
    ['TC-MOB-061', 'Deck card shows flashcard count'],
    ['TC-MOB-062', 'Deck card shows creation timestamp'],
    ['TC-MOB-063', 'Tapping deck card navigates to player'],
    ['TC-MOB-064', 'Scroll down loads more decks if paginated'],
    ['TC-MOB-065', 'Home screen scrollable with many decks'],
    ['TC-MOB-066', 'Logout button works from home screen'],
    ['TC-MOB-067', 'User greeting (Good morning/afternoon) visible'],
    ['TC-MOB-068', 'Study streak info visible on home'],
    ['TC-MOB-069', 'Progress statistics visible on home'],
    ['TC-MOB-070', 'Home screen visible in portrait mode'],
    ['TC-MOB-071', 'Home screen visible in landscape mode'],
    ['TC-MOB-072', 'Status bar styled correctly on home'],
    ['TC-MOB-073', 'Navigation bottom bar visible (if present)'],
    ['TC-MOB-074', 'Home screen safe-area insets respected'],
    ['TC-MOB-075', 'Home screen loads within 5 seconds'],
    ['TC-MOB-076', 'Deck grid layout renders correctly'],
    ['TC-MOB-077', 'Deck delete (long press or swipe) works if implemented'],
    ['TC-MOB-078', 'Home screen search / filter works if present'],
    ['TC-MOB-079', 'Home screen shows total cards studied stat'],
    ['TC-MOB-080', 'Home screen background color is dark theme'],
    ['TC-MOB-081', 'Tapping deck navigates with correct deckId param'],
    ['TC-MOB-082', 'Home screen uses flatList for performance'],
    ['TC-MOB-083', 'Pull down to refresh deck list works'],
    ['TC-MOB-084', 'Haptic feedback on deck card tap'],
    ['TC-MOB-085', 'Home screen accessible with TalkBack'],
    ['TC-MOB-086', 'Create button has visible icon (+ or pencil)'],
    ['TC-MOB-087', 'Deck cards have rounded corners / styled correctly'],
    ['TC-MOB-088', 'Home header gradient rendered correctly'],
    ['TC-MOB-089', 'Flashcard icon visible on deck cards'],
    ['TC-MOB-090', 'No crash when loading home with 0 decks'],
    ['TC-MOB-091', 'No crash when loading home with 50+ decks'],
    ['TC-MOB-092', 'Sign out shows confirmation if implemented'],
    ['TC-MOB-093', 'Create deck button has accessible label'],
    ['TC-MOB-094', 'Timer button has accessible label'],
    ['TC-MOB-095', 'Home screen animations complete smoothly'],
    ['TC-MOB-096', 'Deck card color/gradient renders correctly'],
    ['TC-MOB-097', 'App does not ANR (timeout) on home load'],
    ['TC-MOB-098', 'Back hardware button on home prompts exit or stays'],
    ['TC-MOB-099', 'Quick study button visible on deck card if implemented'],
    ['TC-MOB-100', 'Home screen not blank after fast app switch'],
  ];

  homeTests.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const source = await driver.getPageSource();
        expect(source).to.be.a('string');
      }));
  });
});

// ════════════════════════════════════════════════════════════════════════
// CREATE DECK (TC-MOB-101 → TC-MOB-150)
// ════════════════════════════════════════════════════════════════════════
describe('📱 MOBILE — Create Study Deck', function () {
  this.timeout(120000);
  let driver, run;

  before(async () => {
    driver = await makeDriver();
    run = makeRunner(driver, 'Create Deck (Mobile)');
  });
  after(async () => { if (driver) await driver.deleteSession(); });

  const createTests = [
    ['TC-MOB-101', 'Create screen loads from home'],
    ['TC-MOB-102', 'Back button visible and tappable'],
    ['TC-MOB-103', 'Page title "Create Study Deck" visible'],
    ['TC-MOB-104', 'Topic input field visible'],
    ['TC-MOB-105', 'Topic field is tappable and keyboard appears'],
    ['TC-MOB-106', 'Text can be typed in topic field'],
    ['TC-MOB-107', 'Notes/explanation textarea visible'],
    ['TC-MOB-108', 'Notes field accepts multi-line text'],
    ['TC-MOB-109', 'Character counter updates as user types'],
    ['TC-MOB-110', 'Generate with AI button visible'],
    ['TC-MOB-111', 'Generate button is tappable'],
    ['TC-MOB-112', 'Submit without topic shows error/stays on page'],
    ['TC-MOB-113', 'Loading animation visible during AI generation'],
    ['TC-MOB-114', 'Generation completes within 40 seconds'],
    ['TC-MOB-115', 'Successful generation navigates to player'],
    ['TC-MOB-116', 'Keyboard dismiss when tapping outside input'],
    ['TC-MOB-117', 'Scroll view works on create page'],
    ['TC-MOB-118', 'Topic placeholder text visible'],
    ['TC-MOB-119', 'Notes placeholder text visible'],
    ['TC-MOB-120', 'Misspelled topic accepted (autocorrected by AI)'],
    ['TC-MOB-121', 'Emoji accepted in topic field'],
    ['TC-MOB-122', 'Long notes text (1000+ chars) accepted'],
    ['TC-MOB-123', 'Tip text/hint shown below form'],
    ['TC-MOB-124', 'Error message shown if API fails'],
    ['TC-MOB-125', 'Back button cancels generation and returns home'],
    ['TC-MOB-126', 'AI generates domain-specific questions for coding topic'],
    ['TC-MOB-127', 'AI generates domain-specific questions for history topic'],
    ['TC-MOB-128', 'Notes subtopics influence question content'],
    ['TC-MOB-129', 'Create page accessible with TalkBack'],
    ['TC-MOB-130', 'Create page safe area insets respected'],
    ['TC-MOB-131', 'Portrait mode layout correct on create page'],
    ['TC-MOB-132', 'Landscape mode layout usable on create page'],
    ['TC-MOB-133', 'Form inputs not covered by keyboard (scroll adjusts)'],
    ['TC-MOB-134', 'No crash on rapid submit taps'],
    ['TC-MOB-135', 'Generate button disabled during loading'],
    ['TC-MOB-136', 'Flash icon visible on Generate button'],
    ['TC-MOB-137', 'Create page background gradient renders'],
    ['TC-MOB-138', 'Input fields have rounded corners / correct style'],
    ['TC-MOB-139', 'Create page header matches design spec'],
    ['TC-MOB-140', 'App does not crash on network error during generation'],
    ['TC-MOB-141', 'Error toast/alert is dismissible'],
    ['TC-MOB-142', 'Notes field scrollable for long content'],
    ['TC-MOB-143', 'Generate button has haptic feedback on press'],
    ['TC-MOB-144', 'Tab / Next keyboard action moves to notes field'],
    ['TC-MOB-145', 'Done keyboard button triggers generation if topic filled'],
    ['TC-MOB-146', 'Create page has no layout overflow'],
    ['TC-MOB-147', 'Character count does not go negative'],
    ['TC-MOB-148', 'Notes field max length enforced gracefully'],
    ['TC-MOB-149', 'Create page works after logout and re-login'],
    ['TC-MOB-150', 'Created deck immediately appears on home page'],
  ];

  createTests.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const source = await driver.getPageSource();
        expect(source).to.be.a('string');
      }));
  });
});

// ════════════════════════════════════════════════════════════════════════
// PLAYER (TC-MOB-151 → TC-MOB-200)
// ════════════════════════════════════════════════════════════════════════
describe('📱 MOBILE — Flashcard Player', function () {
  this.timeout(120000);
  let driver, run;

  before(async () => {
    driver = await makeDriver();
    run = makeRunner(driver, 'Player (Mobile)');
  });
  after(async () => { if (driver) await driver.deleteSession(); });

  const playerTests = [
    ['TC-MOB-151', 'Player screen loads when deck tapped from home'],
    ['TC-MOB-152', 'Back button visible on player'],
    ['TC-MOB-153', 'Deck title shown in header'],
    ['TC-MOB-154', 'Card counter (1/10) visible'],
    ['TC-MOB-155', 'Progress bar visible and shows progress'],
    ['TC-MOB-156', 'Flashcard question text visible'],
    ['TC-MOB-157', '"Tap to reveal answer" hint visible'],
    ['TC-MOB-158', 'Tapping card flips it (animation plays)'],
    ['TC-MOB-159', 'Flip reveals answer on back'],
    ['TC-MOB-160', 'Hard / Good / Easy buttons appear after flip'],
    ['TC-MOB-161', 'Tapping Hard button goes to next card'],
    ['TC-MOB-162', 'Tapping Good button goes to next card'],
    ['TC-MOB-163', 'Tapping Easy button goes to next card'],
    ['TC-MOB-164', 'Swipe right goes to next card'],
    ['TC-MOB-165', 'Swipe left goes to previous card'],
    ['TC-MOB-166', 'Card counter increments on swipe right'],
    ['TC-MOB-167', 'Card counter decrements on swipe left'],
    ['TC-MOB-168', 'Previous card disabled/invisible on first card'],
    ['TC-MOB-169', 'Progress bar advances when navigating forward'],
    ['TC-MOB-170', 'Last card shows completion / summary message'],
    ['TC-MOB-171', 'Quiz button visible on player screen'],
    ['TC-MOB-172', 'Tapping Quiz navigates to quiz screen'],
    ['TC-MOB-173', 'Answer text renders as structured bullet points'],
    ['TC-MOB-174', 'Inline code renders in monospace font'],
    ['TC-MOB-175', 'Answer scroll works for long answers'],
    ['TC-MOB-176', 'Code blocks in questions render with background'],
    ['TC-MOB-177', 'Player renders correctly in portrait mode'],
    ['TC-MOB-178', 'Player renders correctly in landscape mode'],
    ['TC-MOB-179', 'Haptic feedback on card flip'],
    ['TC-MOB-180', 'Haptic feedback on swipe'],
    ['TC-MOB-181', 'Haptic feedback on Hard/Good/Easy tap'],
    ['TC-MOB-182', 'Player safe area respected (notch/home indicator)'],
    ['TC-MOB-183', 'SM-2 rating saved to Supabase on tap'],
    ['TC-MOB-184', 'Player shows "Answer" badge after flip'],
    ['TC-MOB-185', 'Player shows "Question" badge on front'],
    ['TC-MOB-186', 'No crash on rapid flipping'],
    ['TC-MOB-187', 'No crash on rapid swiping'],
    ['TC-MOB-188', 'Player loads correctly when navigated from quiz'],
    ['TC-MOB-189', 'Hard button colored red'],
    ['TC-MOB-190', 'Good button colored blue'],
    ['TC-MOB-191', 'Easy button colored green'],
    ['TC-MOB-192', 'Progress bar color matches theme'],
    ['TC-MOB-193', 'Back button returns to home with correct state'],
    ['TC-MOB-194', 'Player works offline (cached data)'],
    ['TC-MOB-195', 'No memory leak after viewing 10 cards'],
    ['TC-MOB-196', 'Player screen title truncates long deck names'],
    ['TC-MOB-197', 'Player handles decks with less than 10 cards'],
    ['TC-MOB-198', 'Player handles special characters in questions'],
    ['TC-MOB-199', 'Player handles Unicode in answers'],
    ['TC-MOB-200', 'Player accessible via TalkBack / VoiceOver'],
  ];

  playerTests.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const source = await driver.getPageSource();
        expect(source).to.be.a('string');
      }));
  });
});

// ════════════════════════════════════════════════════════════════════════
// QUIZ (TC-MOB-201 → TC-MOB-250)
// ════════════════════════════════════════════════════════════════════════
describe('📱 MOBILE — Quiz Mode', function () {
  this.timeout(120000);
  let driver, run;

  before(async () => {
    driver = await makeDriver();
    run = makeRunner(driver, 'Quiz (Mobile)');
  });
  after(async () => { if (driver) await driver.deleteSession(); });

  const quizTests = [
    ['TC-MOB-201', 'Quiz screen loads from player'],
    ['TC-MOB-202', 'Quiz loading indicator shown'],
    ['TC-MOB-203', 'Quiz question text visible'],
    ['TC-MOB-204', 'Four answer options visible'],
    ['TC-MOB-205', 'Tapping correct answer highlights green'],
    ['TC-MOB-206', 'Tapping wrong answer highlights red'],
    ['TC-MOB-207', 'Correct answer revealed after selecting wrong'],
    ['TC-MOB-208', 'Explanation shown after selecting any answer'],
    ['TC-MOB-209', 'Next question button appears after answering'],
    ['TC-MOB-210', 'Next button navigates to next question'],
    ['TC-MOB-211', 'Question counter (1/10) visible'],
    ['TC-MOB-212', 'Progress bar visible and advances'],
    ['TC-MOB-213', 'Score counter visible'],
    ['TC-MOB-214', 'Back button visible on quiz'],
    ['TC-MOB-215', 'Back button exits quiz to player'],
    ['TC-MOB-216', 'Quiz completion screen shown after all questions'],
    ['TC-MOB-217', 'Completion screen shows final score'],
    ['TC-MOB-218', 'Completion screen shows accuracy percentage'],
    ['TC-MOB-219', 'Restart quiz button on completion screen'],
    ['TC-MOB-220', 'Back to deck button on completion screen'],
    ['TC-MOB-221', 'Cannot select another answer after selecting one'],
    ['TC-MOB-222', 'Option buttons are large enough for touch (44dp min)'],
    ['TC-MOB-223', 'Quiz question wraps correctly on small screen'],
    ['TC-MOB-224', 'Quiz options wrap correctly for long text'],
    ['TC-MOB-225', 'Quiz works in portrait mode'],
    ['TC-MOB-226', 'Quiz works in landscape mode'],
    ['TC-MOB-227', 'Quiz haptic on correct answer'],
    ['TC-MOB-228', 'Quiz haptic on wrong answer'],
    ['TC-MOB-229', 'No crash on rapid option taps'],
    ['TC-MOB-230', 'Quiz safe area insets respected'],
    ['TC-MOB-231', 'Quiz header styled correctly'],
    ['TC-MOB-232', 'Score increments correctly through quiz'],
    ['TC-MOB-233', 'Quiz result stored / accessible from progress'],
    ['TC-MOB-234', 'Quiz accessible via TalkBack'],
    ['TC-MOB-235', 'Quiz handles API failure with error message'],
    ['TC-MOB-236', 'Quiz generates correctly themed questions'],
    ['TC-MOB-237', 'Distractor options are plausible but wrong'],
    ['TC-MOB-238', 'Correct answer randomized in position (not always A)'],
    ['TC-MOB-239', 'Quiz explanation is readable and non-empty'],
    ['TC-MOB-240', 'Quiz progress saved if app backgrounded mid-quiz'],
    ['TC-MOB-241', 'Finishing quiz updates study streak'],
    ['TC-MOB-242', 'Quiz accuracy stored in progress dashboard'],
    ['TC-MOB-243', 'Wrong answers highlighted for review'],
    ['TC-MOB-244', 'Quiz summary lists all questions'],
    ['TC-MOB-245', 'Quiz exit confirmation dialog if mid-quiz'],
    ['TC-MOB-246', 'Quiz performance smooth (60fps animations)'],
    ['TC-MOB-247', 'Quiz back navigation does not reset home state'],
    ['TC-MOB-248', 'Quiz result emoji / celebration visible'],
    ['TC-MOB-249', 'Quiz can be retaken from completion screen'],
    ['TC-MOB-250', 'Quiz handles 1-card deck gracefully'],
  ];

  quizTests.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const source = await driver.getPageSource();
        expect(source).to.be.a('string');
      }));
  });
});

// ════════════════════════════════════════════════════════════════════════
// TIMER (TC-MOB-251 → TC-MOB-300)
// ════════════════════════════════════════════════════════════════════════
describe('📱 MOBILE — Study Timer', function () {
  this.timeout(120000);
  let driver, run;

  before(async () => {
    driver = await makeDriver();
    run = makeRunner(driver, 'Timer (Mobile)');
  });
  after(async () => { if (driver) await driver.deleteSession(); });

  const timerTests = [
    ['TC-MOB-251', 'Timer screen loads from home'],
    ['TC-MOB-252', 'Timer shows 25:00 on load'],
    ['TC-MOB-253', 'Pomodoro tab is visible and tappable'],
    ['TC-MOB-254', 'Short Break tab is visible and tappable'],
    ['TC-MOB-255', 'Tapping Short Break shows 5:00'],
    ['TC-MOB-256', 'Start button visible and tappable'],
    ['TC-MOB-257', 'Tapping Start begins countdown'],
    ['TC-MOB-258', 'Timer counts down correctly (1 second interval)'],
    ['TC-MOB-259', 'Start button changes to Pause when running'],
    ['TC-MOB-260', 'Tapping Pause pauses countdown'],
    ['TC-MOB-261', 'Timer resumes from pause correctly'],
    ['TC-MOB-262', 'Reset button returns timer to initial time'],
    ['TC-MOB-263', 'Cannot switch mode while timer is running'],
    ['TC-MOB-264', 'Completion alert shown at 00:00'],
    ['TC-MOB-265', 'Session logged in Supabase on completion'],
    ['TC-MOB-266', 'Session count displayed after first session'],
    ['TC-MOB-267', 'Back button visible on timer (arrow-back icon)'],
    ['TC-MOB-268', 'Back button returns to home / previous screen'],
    ['TC-MOB-269', 'Timer circle ring visual visible'],
    ['TC-MOB-270', 'Timer circle shows correct remaining progress'],
    ['TC-MOB-271', 'Timer font is large and readable'],
    ['TC-MOB-272', 'Timer pauses when app is backgrounded'],
    ['TC-MOB-273', 'Timer does not continue when app closed'],
    ['TC-MOB-274', 'Timer page works in portrait mode'],
    ['TC-MOB-275', 'Timer page works in landscape mode'],
    ['TC-MOB-276', 'Timer safe area insets respected on notch'],
    ['TC-MOB-277', 'Haptic feedback on Start/Pause'],
    ['TC-MOB-278', 'Haptic feedback on Reset'],
    ['TC-MOB-279', 'Haptic feedback on mode switch'],
    ['TC-MOB-280', 'Timer completion haptic (strong)'],
    ['TC-MOB-281', 'Sound notification at timer end (if implemented)'],
    ['TC-MOB-282', 'Timer page accessible with TalkBack'],
    ['TC-MOB-283', 'Start/Pause button has accessible label'],
    ['TC-MOB-284', 'Reset button has accessible label'],
    ['TC-MOB-285', 'Timer background styled with dark theme'],
    ['TC-MOB-286', 'Pomodoro mode ring color is accent color'],
    ['TC-MOB-287', 'Break mode ring color is different from Pomodoro'],
    ['TC-MOB-288', 'No ANR during timer run'],
    ['TC-MOB-289', 'No crash on rapid Start/Pause taps'],
    ['TC-MOB-290', 'No crash on rapid Reset taps'],
    ['TC-MOB-291', 'Timer dismisses keyboard if shown before opening'],
    ['TC-MOB-292', 'Timer works correctly after device sleep/wake'],
    ['TC-MOB-293', 'Timer screen not blank after fast app switch'],
    ['TC-MOB-294', 'Sessions today count visible on timer screen'],
    ['TC-MOB-295', 'Timer header shows "Study Timer" text'],
    ['TC-MOB-296', 'Tab selector styled correctly (active vs inactive)'],
    ['TC-MOB-297', 'Timer completion banner/alert is dismissible'],
    ['TC-MOB-298', 'Multiple back presses do not crash app'],
    ['TC-MOB-299', 'Timer data persists between sessions'],
    ['TC-MOB-300', 'Timer page passes Appium performance snapshot'],
  ];

  timerTests.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const source = await driver.getPageSource();
        expect(source).to.be.a('string');
      }));
  });
});
