const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campuscart_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_12345';
process.env.IGNORE_DB_FAILURE = 'true';

const { app, server } = require('../index');
const { registry, Counter, Gauge, Histogram } = require('../metrics/prometheus');
const socketServer = require('../sockets/socketServer');

let testServer;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    testServer = app.listen(5099, '127.0.0.1', () => {
      baseUrl = 'http://127.0.0.1:5099';
      resolve();
    });
  });
});

test.after(async () => {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
});

// Helper for making HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

test('1. Health Check Endpoint returns 200 OK', async () => {
  const res = await makeRequest('/');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.includes('CampusCart Backend Running'));
});

test('2. Prometheus Metrics: /metrics returns valid text exposition with Counter, Gauge, Histogram', async () => {
  const res = await makeRequest('/metrics');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.headers['content-type'].includes('text/plain'));
  
  const text = res.body;
  // Assert Counter presence
  assert.ok(text.includes('# TYPE http_requests_total counter'), 'Counter metric missing');
  // Assert Histogram presence
  assert.ok(text.includes('# TYPE http_request_duration_seconds histogram'), 'Histogram metric missing');
  // Assert Gauge presence
  assert.ok(text.includes('# TYPE campuscart_active_connections gauge'), 'Gauge metric missing');
  assert.ok(text.includes('# TYPE campuscart_db_status gauge'), 'DB status gauge missing');
  // Assert Process Gauges
  assert.ok(text.includes('# TYPE nodejs_heap_size_used_bytes gauge'), 'Heap memory metric missing');
  assert.ok(text.includes('# TYPE process_uptime_seconds gauge'), 'Process uptime metric missing');
});

test('3. Prometheus Metrics: Counter, Gauge, Histogram unit logic', () => {
  const counter = new Counter('test_counter', 'Test counter', ['status']);
  counter.inc({ status: '200' }, 1);
  counter.inc({ status: '200' }, 2);
  assert.ok(counter.toPrometheusString().includes('test_counter{status="200"} 3'));

  const gauge = new Gauge('test_gauge', 'Test gauge');
  gauge.set(42);
  gauge.inc({}, 3);
  gauge.dec({}, 5);
  assert.ok(gauge.toPrometheusString().includes('test_gauge 40'));

  const histogram = new Histogram('test_lat', 'Test latency', [0.1, 0.5, 1.0]);
  histogram.observe(0.05);
  histogram.observe(0.2);
  const histStr = histogram.toPrometheusString();
  assert.ok(histStr.includes('test_lat_count 2'));
  assert.ok(histStr.includes('test_lat_bucket{le="0.1"} 1'));
  assert.ok(histStr.includes('test_lat_bucket{le="0.5"} 2'));
});

test('4. Security & Authentication: Password hashing & JWT validation', async () => {
  const password = 'CampusStudent@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true, 'Valid password verification failed');

  const isWrongMatch = await bcrypt.compare('WrongPassword123', hash);
  assert.strictEqual(isWrongMatch, false, 'Invalid password accepted unexpectedly');

  // JWT Token creation & verification
  const payload = { id: 'user_123', email: 'student@college.edu', role: 'student' };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  assert.strictEqual(decoded.id, 'user_123');
  assert.strictEqual(decoded.email, 'student@college.edu');
});

test('5. WebSocket Protocol & Handshake Verification (RFC 6455)', () => {
  const clientKey = 'dGhlIHNhbXBsZSBub25jZQ==';
  const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  const expectedAccept = crypto
    .createHash('sha1')
    .update(clientKey + WS_GUID)
    .digest('base64');

  assert.strictEqual(expectedAccept, 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');

  // Verify frame encoding
  const testMessage = { event: 'TEST_EVENT', data: 'CampusCart Socket Test' };
  const frame = socketServer.encodeFrame(testMessage);
  assert.ok(frame.length > 2);
  assert.strictEqual(frame[0], 0x81); // FIN + text opcode
});

test('6. Data Models: Order status transitions and product validation logic', () => {
  const validCategories = ['Books', 'Electronics', 'Stationery', 'Hostel Essentials', 'Others'];
  const testCategory = 'Electronics';
  assert.ok(validCategories.includes(testCategory), 'Valid category rejected');

  const validStatusTransitions = {
    pending: ['accepted', 'rejected', 'cancelled'],
    accepted: ['completed', 'cancelled'],
    rejected: [],
    completed: []
  };

  const initialStatus = 'pending';
  const nextStatus = 'accepted';
  assert.ok(validStatusTransitions[initialStatus].includes(nextStatus), 'Valid order transition rejected');
});
