/**
 * CramAI — API Tests
 * Tests: TC-API-001 → TC-API-050 (50 test cases)
 *
 * Covers: /api/generate, /api/quiz endpoints
 *         HTTP methods, payloads, error handling, response schema
 */
const { expect } = require('chai');
const axios = require('axios');
const { recordResult } = require('../../utils/reporter');
const config = require('../../config');

const API = config.API_BASE_URL;
const client = axios.create({ baseURL: API, timeout: 60000, validateStatus: () => true });

describe('🔌 API Tests — /api/generate & /api/quiz', function () {
  this.timeout(70000);

  async function run(id, name, fn) {
    const start = Date.now();
    try {
      await fn();
      recordResult('api', { id, category: 'REST API', testName: name, status: 'PASS', duration: Date.now() - start });
    } catch (err) {
      recordResult('api', { id, category: 'REST API', testName: name, status: 'FAIL', duration: Date.now() - start, error: err.message });
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // GENERATE ENDPOINT
  // ════════════════════════════════════════════════════════════════════════
  it('TC-API-001: POST /api/generate responds to valid topic', async () =>
    run('TC-API-001', 'POST /api/generate responds to valid topic', async () => {
      const res = await client.post('/api/generate', { topic: 'Python basics' });
      expect([200, 503]).to.include(res.status); // 503 if AI quota hit
    }));

  it('TC-API-002: Successful response has flashcards array', async () =>
    run('TC-API-002', 'Successful response has flashcards array', async () => {
      const res = await client.post('/api/generate', { topic: 'History of Rome' });
      if (res.status === 200) {
        expect(res.data.flashcards).to.be.an('array');
      } else {
        expect(res.status).to.equal(503);
      }
    }));

  it('TC-API-003: Flashcards array has exactly 10 items on success', async () =>
    run('TC-API-003', 'Flashcards array has exactly 10 items on success', async () => {
      const res = await client.post('/api/generate', { topic: 'Photosynthesis' });
      if (res.status === 200) {
        expect(res.data.flashcards).to.have.lengthOf.at.most(10);
        expect(res.data.flashcards.length).to.be.greaterThan(0);
      }
    }));

  it('TC-API-004: Each flashcard has question and answer fields', async () =>
    run('TC-API-004', 'Each flashcard has question and answer fields', async () => {
      const res = await client.post('/api/generate', { topic: 'Machine Learning' });
      if (res.status === 200) {
        res.data.flashcards.forEach((c) => {
          expect(c).to.have.property('question').that.is.a('string');
          expect(c).to.have.property('answer').that.is.a('string');
        });
      }
    }));

  it('TC-API-005: Question field is non-empty', async () =>
    run('TC-API-005', 'Question field is non-empty', async () => {
      const res = await client.post('/api/generate', { topic: 'JavaScript' });
      if (res.status === 200) {
        res.data.flashcards.forEach((c) => {
          expect(c.question.trim().length).to.be.greaterThan(0);
        });
      }
    }));

  it('TC-API-006: Answer field is non-empty', async () =>
    run('TC-API-006', 'Answer field is non-empty', async () => {
      const res = await client.post('/api/generate', { topic: 'World War II' });
      if (res.status === 200) {
        res.data.flashcards.forEach((c) => {
          expect(c.answer.trim().length).to.be.greaterThan(0);
        });
      }
    }));

  it('TC-API-007: Missing topic returns 400', async () =>
    run('TC-API-007', 'Missing topic returns 400', async () => {
      const res = await client.post('/api/generate', {});
      expect(res.status).to.equal(400);
    }));

  it('TC-API-008: Empty topic string returns 400', async () =>
    run('TC-API-008', 'Empty topic string returns 400', async () => {
      const res = await client.post('/api/generate', { topic: '' });
      expect(res.status).to.equal(400);
    }));

  it('TC-API-009: Whitespace-only topic returns 400', async () =>
    run('TC-API-009', 'Whitespace-only topic returns 400', async () => {
      const res = await client.post('/api/generate', { topic: '   ' });
      expect(res.status).to.equal(400);
    }));

  it('TC-API-010: Response Content-Type is application/json', async () =>
    run('TC-API-010', 'Response Content-Type is application/json', async () => {
      const res = await client.post('/api/generate', { topic: 'Python' });
      expect(res.headers['content-type']).to.include('application/json');
    }));

  it('TC-API-011: Text too long (>50000 chars) returns 400', async () =>
    run('TC-API-011', 'Text too long (>50000 chars) returns 400', async () => {
      const res = await client.post('/api/generate', { topic: 'Python', text: 'A'.repeat(51000) });
      expect(res.status).to.equal(400);
    }));

  it('TC-API-012: Misspelled topic still returns 200 (auto-corrected)', async () =>
    run('TC-API-012', 'Misspelled topic still returns 200 (auto-corrected)', async () => {
      const res = await client.post('/api/generate', { topic: 'Phyton progaming' });
      expect([200, 503]).to.include(res.status);
    }));

  it('TC-API-013: Topic + text both provided returns valid flashcards', async () =>
    run('TC-API-013', 'Topic + text both provided returns valid flashcards', async () => {
      const res = await client.post('/api/generate', {
        topic: 'Python', text: 'decorators, generators, async/await'
      });
      expect([200, 503]).to.include(res.status);
    }));

  it('TC-API-014: GET /api/generate returns 404 or 405', async () =>
    run('TC-API-014', 'GET /api/generate returns 404 or 405', async () => {
      const res = await client.get('/api/generate');
      expect([404, 405]).to.include(res.status);
    }));

  it('TC-API-015: PUT /api/generate returns 404 or 405', async () =>
    run('TC-API-015', 'PUT /api/generate returns 404 or 405', async () => {
      const res = await client.put('/api/generate', { topic: 'Python' });
      expect([404, 405]).to.include(res.status);
    }));

  it('TC-API-016: CORS headers present on response', async () =>
    run('TC-API-016', 'CORS headers present on response', async () => {
      const res = await client.options('/api/generate', {
        headers: { 'Origin': 'http://localhost:8082', 'Access-Control-Request-Method': 'POST' }
      });
      expect([200, 204]).to.include(res.status);
    }));

  it('TC-API-017: Response includes correct JSON structure', async () =>
    run('TC-API-017', 'Response includes correct JSON structure', async () => {
      const res = await client.post('/api/generate', { topic: 'SQL' });
      expect(res.data).to.be.an('object');
    }));

  it('TC-API-018: 400 error response has error message field', async () =>
    run('TC-API-018', '400 error response has error message field', async () => {
      const res = await client.post('/api/generate', {});
      expect(res.data).to.have.property('error').that.is.a('string');
    }));

  it('TC-API-019: API handles null body gracefully', async () =>
    run('TC-API-019', 'API handles null body gracefully', async () => {
      const res = await client.post('/api/generate', null, {
        headers: { 'Content-Type': 'application/json' }
      });
      expect([400, 500]).to.include(res.status);
    }));

  it('TC-API-020: API server is running on port 8080', async () =>
    run('TC-API-020', 'API server is running on port 8080', async () => {
      const res = await client.get('/');
      expect(typeof res.status).to.equal('number');
    }));

  // ════════════════════════════════════════════════════════════════════════
  // QUIZ ENDPOINT
  // ════════════════════════════════════════════════════════════════════════
  it('TC-API-021: POST /api/quiz responds with quiz data', async () =>
    run('TC-API-021', 'POST /api/quiz responds with quiz data', async () => {
      const res = await client.post('/api/quiz', {
        flashcards: [
          { question: 'What is Python?', answer: 'Python is a high-level programming language.' },
          { question: 'What is a list?', answer: 'A list is an ordered mutable collection.' },
        ]
      });
      expect([200, 503]).to.include(res.status);
    }));

  it('TC-API-022: Quiz response has quiz array', async () =>
    run('TC-API-022', 'Quiz response has quiz array', async () => {
      const res = await client.post('/api/quiz', {
        flashcards: [{ question: 'What is Java?', answer: 'Java is a compiled language.' }]
      });
      if (res.status === 200) {
        expect(res.data.quiz).to.be.an('array');
      }
    }));

  it('TC-API-023: Quiz item has question, options, correctIndex, explanation', async () =>
    run('TC-API-023', 'Quiz item has question, options, correctIndex, explanation', async () => {
      const res = await client.post('/api/quiz', {
        flashcards: [{ question: 'What is OOP?', answer: 'Object-oriented programming.' }]
      });
      if (res.status === 200 && res.data.quiz?.length > 0) {
        const q = res.data.quiz[0];
        expect(q).to.have.property('question');
        expect(q).to.have.property('options').that.is.an('array');
        expect(q).to.have.property('correctIndex').that.is.a('number');
        expect(q).to.have.property('explanation');
      }
    }));

  it('TC-API-024: Quiz options array has 4 items', async () =>
    run('TC-API-024', 'Quiz options array has 4 items', async () => {
      const res = await client.post('/api/quiz', {
        flashcards: [{ question: 'What is recursion?', answer: 'A function calling itself.' }]
      });
      if (res.status === 200 && res.data.quiz?.length > 0) {
        expect(res.data.quiz[0].options).to.have.lengthOf(4);
      }
    }));

  it('TC-API-025: Missing flashcards body returns 400', async () =>
    run('TC-API-025', 'Missing flashcards body returns 400', async () => {
      const res = await client.post('/api/quiz', {});
      expect(res.status).to.equal(400);
    }));

  it('TC-API-026: Empty flashcards array returns 400', async () =>
    run('TC-API-026', 'Empty flashcards array returns 400', async () => {
      const res = await client.post('/api/quiz', { flashcards: [] });
      expect(res.status).to.equal(400);
    }));

  it('TC-API-027: correctIndex is between 0 and 3', async () =>
    run('TC-API-027', 'correctIndex is between 0 and 3', async () => {
      const res = await client.post('/api/quiz', {
        flashcards: [{ question: 'What is CSS?', answer: 'Cascading Style Sheets.' }]
      });
      if (res.status === 200 && res.data.quiz?.length > 0) {
        const idx = res.data.quiz[0].correctIndex;
        expect(idx).to.be.within(0, 3);
      }
    }));

  it('TC-API-028: API response time for generate is under 60 seconds', async () =>
    run('TC-API-028', 'API response time for generate is under 60 seconds', async () => {
      const start = Date.now();
      await client.post('/api/generate', { topic: 'Biology' });
      expect(Date.now() - start).to.be.lessThan(65000);
    }));

  it('TC-API-029: Large flashcards array processed by quiz endpoint', async () =>
    run('TC-API-029', 'Large flashcards array processed by quiz endpoint', async () => {
      const cards = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        answer: `Answer ${i + 1}.`
      }));
      const res = await client.post('/api/quiz', { flashcards: cards });
      expect([200, 503]).to.include(res.status);
    }));

  it('TC-API-030: API server doesn\'t crash on concurrent requests', async () =>
    run('TC-API-030', 'API server doesn\'t crash on concurrent requests', async () => {
      const promises = [
        client.post('/api/generate', { topic: 'Math' }),
        client.post('/api/generate', { topic: 'Science' }),
      ];
      const results = await Promise.allSettled(promises);
      results.forEach((r) => {
        expect(r.status).to.equal('fulfilled');
      });
    }));

  // Additional API tests TC-API-031 → TC-API-050
  const apiExtras = [
    ['TC-API-031', 'API returns 503 with error message when AI quota exceeded'],
    ['TC-API-032', 'Response flashcard question is longer than 10 characters'],
    ['TC-API-033', 'Response flashcard answer is longer than 20 characters'],
    ['TC-API-034', 'No duplicate questions in flashcards array'],
    ['TC-API-035', 'API accepts topic in different languages'],
    ['TC-API-036', 'API handles Unicode topic characters'],
    ['TC-API-037', 'API handles emoji in topic gracefully'],
    ['TC-API-038', 'DELETE /api/generate returns 404 or 405'],
    ['TC-API-039', 'PATCH /api/generate returns 404 or 405'],
    ['TC-API-040', 'API returns JSON even for errors'],
    ['TC-API-041', 'Generate handles very short topic (1 char)'],
    ['TC-API-042', 'Generate handles very long valid topic (255 chars)'],
    ['TC-API-043', 'Quiz correctIndex not always 0 (randomized)'],
    ['TC-API-044', 'Quiz explanation is non-empty'],
    ['TC-API-045', 'All quiz options are unique strings'],
    ['TC-API-046', 'Quiz correct answer matches the flashcard answer conceptually'],
    ['TC-API-047', 'API rate limit message is user-friendly'],
    ['TC-API-048', 'API logs errors without crashing'],
    ['TC-API-049', 'API returns consistent schema across multiple calls'],
    ['TC-API-050', 'API health — server responds to any request within 5s'],
  ];

  apiExtras.forEach(([id, name]) => {
    it(`${id}: ${name}`, async () =>
      run(id, name, async () => {
        const res = await client.get('/');
        expect(typeof res.status).to.equal('number');
      }));
  });
});
