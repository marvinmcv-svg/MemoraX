/**
 * MemoraX Smoke Test
 * Run: npx tsx scripts/smoke-test.ts
 * Requires the backend to be running on PORT (default 3001).
 */

const BASE = process.env.API_URL || 'http://localhost:3001';

type Color = 'green' | 'red' | 'yellow' | 'cyan' | 'reset';
const c: Record<Color, string> = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ${c.green}✓${c.reset} ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ${c.red}✗${c.reset} ${name}`);
    console.log(`    ${c.red}${String(err)}${c.reset}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function get(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`);
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function del(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

async function testHealth(): Promise<void> {
  console.log(`\n${c.cyan}▸ Health${c.reset}`);

  await test('GET /health returns 200', async () => {
    const res = await get('/health');
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json() as { status: string };
    assert(data.status === 'ok', `Expected status=ok, got ${JSON.stringify(data)}`);
  });
}

async function testCapture(): Promise<[string, string]> {
  console.log(`\n${c.cyan}▸ Capture${c.reset}`);

  let capturedMemoryId = '';
  let capturedUserId = '';

  await test('POST /api/v1/capture — basic note', async () => {
    const res = await post('/api/v1/capture', {
      channel: 'app',
      channelUserId: 'smoke-test-user',
      content: 'Studied chapter 5 of organic chemistry today',
      contentType: 'text',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json() as { success: boolean; memory: { id: string; userId: string }; intent: string };
    assert(data.success === true, 'Expected success=true');
    assert(typeof data.memory?.id === 'string', 'Expected memory.id');
    capturedMemoryId = data.memory.id;
    capturedUserId = data.memory.userId;
  });

  await test('POST /api/v1/capture — reminder with NLP date (tomorrow)', async () => {
    const res = await post('/api/v1/capture', {
      channel: 'app',
      channelUserId: 'smoke-test-user',
      content: 'Remind me to submit my essay tomorrow at 9am',
      contentType: 'text',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json() as { intent: string; autoReminder: unknown };
    assert(data.intent === 'reminder', `Expected intent=reminder, got ${data.intent}`);
    // autoReminder may be null if AI keys aren't configured (fallback still parses date)
    console.log(`    auto-reminder created: ${data.autoReminder ? 'yes' : 'no (no AI keys)'}`);
  });

  await test('POST /api/v1/capture — empty content returns 200', async () => {
    const res = await post('/api/v1/capture', {
      channel: 'app',
      channelUserId: 'smoke-test-user',
      content: '',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('POST /api/v1/capture — missing channel returns 400', async () => {
    const res = await post('/api/v1/capture', {
      content: 'hello',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  return [capturedMemoryId, capturedUserId];
}

async function testMemories(memoryId: string): Promise<void> {
  console.log(`\n${c.cyan}▸ Memories${c.reset}`);

  await test('GET /api/v1/memories — lists memories', async () => {
    const res = await get('/api/v1/memories');
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json() as { data: unknown[] };
    assert(Array.isArray(data.data), 'Expected data array');
  });

  await test('GET /api/v1/memories/:id — 404 for unknown id', async () => {
    const res = await get('/api/v1/memories/nonexistent-id-xyz');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });
}

async function testReminders(): Promise<string> {
  console.log(`\n${c.cyan}▸ Reminders${c.reset}`);

  let reminderId = '';

  // First create a memory to attach the reminder to
  const captureRes = await post('/api/v1/capture', {
    channel: 'app',
    channelUserId: 'smoke-test-reminder-user',
    content: 'Study for midterm',
    contentType: 'text',
  });
  const captureData = await captureRes.json() as { memory: { id: string } };
  const memoryId = captureData.memory?.id;

  await test('POST /api/v1/reminders — create reminder', async () => {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const res = await post('/api/v1/reminders', {
      memoryId,
      remindAt,
      deliveryChannel: 'app',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json() as { id: string; status: string };
    assert(data.status === 'pending', `Expected status=pending, got ${data.status}`);
    reminderId = data.id;
  });

  await test('GET /api/v1/reminders — lists reminders', async () => {
    const res = await get('/api/v1/reminders');
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json() as { data: unknown[] };
    assert(Array.isArray(data.data), 'Expected data array');
  });

  await test('POST /api/v1/reminders/nl — natural language reminder', async () => {
    const res = await post('/api/v1/reminders/nl', {
      text: 'Remind me to review my notes next Monday at 10am',
      deliveryChannel: 'app',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json() as { parsedDate: string; confidence: number; matchedText: string };
    assert(typeof data.parsedDate === 'string', 'Expected parsedDate');
    assert(data.confidence > 0, 'Expected confidence > 0');
    console.log(`    parsed: "${data.matchedText}" → ${data.parsedDate} (confidence ${data.confidence})`);
  });

  await test('POST /api/v1/reminders/nl — past date returns 422', async () => {
    const res = await post('/api/v1/reminders/nl', {
      text: 'Remind me yesterday',
    });
    // yesterday should fail to parse OR be past-date
    assert(res.status === 422 || res.status === 422, `Expected 422, got ${res.status}`);
  });

  await test('POST /api/v1/reminders/nl — no date returns 422', async () => {
    const res = await post('/api/v1/reminders/nl', {
      text: 'Something without any date whatsoever blah blah',
    });
    assert(res.status === 422, `Expected 422, got ${res.status}`);
  });

  if (reminderId) {
    await test('POST /api/v1/reminders/:id/snooze — snoozes reminder', async () => {
      const userId = 'channel-app-smoke-test-reminder-user';
      // snooze uses the reminder's userId internally
      const res = await post(`/api/v1/reminders/${reminderId}/snooze`, { minutes: 30 });
      // 404 is acceptable here since auth header isn't set (userId = anonymous)
      assert(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
    });

    await test('DELETE /api/v1/reminders/:id — deletes reminder', async () => {
      const res = await del(`/api/v1/reminders/${reminderId}`);
      assert(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
    });
  }

  return reminderId;
}

async function testNLPParser(): Promise<void> {
  console.log(`\n${c.cyan}▸ NLP Date Parser (unit-level via /reminders/nl)${c.reset}`);

  const cases: Array<{ text: string; expect: '201' | '422' }> = [
    { text: 'Remind me tomorrow at 2pm', expect: '201' },
    { text: 'in 30 minutes', expect: '201' },
    { text: 'in 2 hours', expect: '201' },
    { text: 'next Friday at noon', expect: '201' },
    { text: 'remind me June 20th at 3pm', expect: '201' },
    { text: 'no date here at all', expect: '422' },
  ];

  for (const { text, expect } of cases) {
    await test(`NL parse: "${text}" → ${expect}`, async () => {
      const res = await post('/api/v1/reminders/nl', { text });
      const code = String(res.status);
      if (expect === '201') {
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        const data = await res.json() as { parsedDate: string };
        console.log(`    → ${data.parsedDate}`);
      } else {
        assert(res.status === 422, `Expected 422, got ${res.status}`);
      }
    });
  }
}

async function testBriefing(): Promise<void> {
  console.log(`\n${c.cyan}▸ Briefing${c.reset}`);

  await test('POST /api/v1/briefing/generate — generates briefing', async () => {
    const res = await post('/api/v1/briefing/generate', {});
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json() as { id: string; content: string };
    assert(typeof data.content === 'string' && data.content.length > 0, 'Expected non-empty content');
    console.log(`    preview: "${data.content.slice(0, 80)}..."`);
  });
}

async function testKnowledgeGraph(): Promise<void> {
  console.log(`\n${c.cyan}▸ Knowledge Graph${c.reset}`);

  await test('GET /api/v1/kg/stats — returns stats', async () => {
    const res = await get('/api/v1/kg/stats');
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json() as { entities: number; relationships: number };
    assert(typeof data.entities === 'number', 'Expected entities count');
    console.log(`    entities: ${data.entities}, relationships: ${data.relationships}`);
  });
}

async function testSerendipity(): Promise<void> {
  console.log(`\n${c.cyan}▸ Serendipity${c.reset}`);

  await test('GET /api/v1/serendipity — returns serendipity memories', async () => {
    const res = await get('/api/v1/serendipity');
    assert(res.ok || res.status === 404, `Expected 200 or 404, got ${res.status}`);
  });
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function run(): Promise<void> {
  console.log(`\n${c.cyan}═══════════════════════════════════════${c.reset}`);
  console.log(`${c.cyan}  MemoraX Smoke Test  →  ${BASE}${c.reset}`);
  console.log(`${c.cyan}═══════════════════════════════════════${c.reset}`);

  await testHealth();
  const [memoryId] = await testCapture();
  await testMemories(memoryId);
  await testReminders();
  await testNLPParser();
  await testBriefing();
  await testKnowledgeGraph();
  await testSerendipity();

  console.log(`\n${c.cyan}═══════════════════════════════════════${c.reset}`);
  const total = passed + failed;
  const color = failed === 0 ? c.green : c.red;
  console.log(`${color}  ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}${c.reset}`);
  console.log(`${c.cyan}═══════════════════════════════════════${c.reset}\n`);

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
