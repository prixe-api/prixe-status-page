/**
 * WebSocket Health Check Script
 * Tests the Prixe WebSocket endpoint by connecting and subscribing to a ticker.
 * Passes when subscription is confirmed (subscription_status); also validates
 * price_update if received.
 */

const WebSocket = require('ws');

const WS_URL = `wss://ws.prixe.io/ws?api_key=${process.env.PRIXE_PRO_API_KEY}`;
const TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;       // Report down only after this many consecutive failures
const RETRY_DELAY_MS = 3000; // Wait between attempts

/**
 * Validates subscription_status: {"event": "subscription_status", "data": {"status": "subscribed", "ticker": "TSLA"}}
 */
function validateSubscriptionStatus(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'subscription_status') return null;
    const data = parsed.data;
    if (!data || data.status !== 'subscribed' || !data.ticker) return null;
    return { valid: true, ticker: data.ticker };
  } catch (e) {
    return null;
  }
}

/**
 * Validates price_update: {"event": "price_update", "data": {"data": {...}}}
 */
function validatePriceUpdate(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'price_update') return { valid: false };
    const priceData = parsed.data?.data;
    if (!priceData || typeof priceData !== 'object') return { valid: false };
    const expectedFields = ['askPrice', 'bidPrice', 'lastSalePrice', 'deltaIndicator'];
    const missing = expectedFields.filter(f => !(f in priceData));
    if (missing.length > 0) return { valid: false };
    return { valid: true, data: priceData };
  } catch (e) {
    return { valid: false };
  }
}

async function testWebSocket() {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    console.log('Connecting to WebSocket...');

    const ws = new WebSocket(WS_URL);
    let passed = false;
    let successMessage = '';

    const timeout = setTimeout(() => {
      ws.close();
      if (passed) {
        resolve(successMessage);
      } else {
        reject(new Error('WebSocket test timed out after ' + TIMEOUT_MS + 'ms'));
      }
    }, TIMEOUT_MS);

    const done = (message) => {
      if (passed) return;
      passed = true;
      successMessage = message;
      clearTimeout(timeout);
      ws.close();
      resolve({ message, responseTime: Date.now() - startTime });
    };

    ws.on('open', () => {
      console.log('Connected! Sending subscribe message...');
      ws.send(JSON.stringify({ event: 'subscribe', data: { ticker: 'TSLA' } }));
      console.log('Sent: {"event":"subscribe","data":{"ticker":"TSLA"}}');
    });

    ws.on('message', (data) => {
      const message = data.toString();
      console.log('Received:', message);

      const sub = validateSubscriptionStatus(message);
      if (sub?.valid) {
        console.log('Subscription confirmed for ticker:', sub.ticker);
        done('WebSocket test passed - connected and subscribed to ' + sub.ticker);
        return;
      }

      const price = validatePriceUpdate(message);
      if (price.valid) {
        console.log('Price data received: lastSalePrice=', price.data.lastSalePrice, 'deltaIndicator=', price.data.deltaIndicator);
        done('WebSocket test passed - received valid price_update data');
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error: ' + error.message));
    });

    ws.on('close', (code, reason) => {
      if (!passed) {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before subscription confirmed: ' + code + ' ' + reason));
      }
    });
  });
}

function writeResultFile(status, responseTime, code) {
  const outPath = process.env.WEBSOCKET_RESULT_FILE;
  if (!outPath) return;
  const fs = require('fs');
  fs.writeFileSync(outPath, JSON.stringify({ status, responseTime, code }), 'utf8');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWithRetries() {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      console.log('\n--- Retry', attempt, 'of', MAX_ATTEMPTS, '---');
      await sleep(RETRY_DELAY_MS);
    }
    try {
      const result = await testWebSocket();
      return result;
    } catch (err) {
      lastError = err;
      console.error('\n✗ Attempt', attempt, 'failed:', err.message);
      if (attempt < MAX_ATTEMPTS) {
        console.log('Retrying in', RETRY_DELAY_MS / 1000, 's...');
      }
    }
  }
  throw lastError;
}

runWithRetries()
  .then((result) => {
    const responseTime = typeof result === 'object' && result.responseTime != null ? result.responseTime : 0;
    console.log('\n✓ SUCCESS:', typeof result === 'object' ? result.message : result);
    writeResultFile('up', responseTime, 200);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ FAILED after', MAX_ATTEMPTS, 'attempts. Last error:', error.message);
    writeResultFile('down', 0, 0);
    process.exit(1);
  });
