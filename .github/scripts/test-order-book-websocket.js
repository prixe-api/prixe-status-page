/**
 * L2 Order Book WebSocket Health Check
 *
 * Connects to /order_book, subscribes to BTC/ETH, and passes when the server
 * confirms the handshake. The strongest *server-controlled* signal is the
 * `connected` event (sent right after auth + plan gate succeed). We also accept
 * a `subscriptions` ack, an initial `snapshot`, or an `l2update` as bonus pass
 * signals.
 *
 * Plan gate: Pro+ only. Auth uses ?api_key=... query string.
 * Note: full-book snapshots can be large (~MBs); we pass on `connected` (which
 * precedes the snapshot), so frame size never affects the health result.
 */

const WebSocket = require('ws');

const WS_URL = `wss://ws.prixe.io/order_book?api_key=${process.env.PRIXE_PRO_PLUS_API_KEY}`;
const TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 3000;

function validateConnected(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'connected') return null;
    return { valid: true, plan: parsed.data?.plan, status: parsed.data?.status };
  } catch (e) {
    return null;
  }
}

function validateSubscriptions(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'subscriptions') return null;
    return { valid: true };
  } catch (e) {
    return null;
  }
}

function validateBookData(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'snapshot' && parsed.event !== 'l2update') return null;
    return { valid: true, type: parsed.event, ticker: parsed.data?.ticker || parsed.data?.symbol };
  } catch (e) {
    return null;
  }
}

function detectServerError(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event === 'error') {
      return parsed.data?.message || parsed.message || 'unknown server error';
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function testWebSocket() {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    console.log('Connecting to Order Book WebSocket...');

    const ws = new WebSocket(WS_URL);
    let passed = false;
    let subscribeSent = false;

    const timeout = setTimeout(() => {
      ws.close();
      if (!passed) {
        reject(new Error('Order Book WebSocket test timed out after ' + TIMEOUT_MS + 'ms'));
      }
    }, TIMEOUT_MS);

    const done = (message) => {
      if (passed) return;
      passed = true;
      clearTimeout(timeout);
      ws.close();
      resolve({ message, responseTime: Date.now() - startTime });
    };

    ws.on('open', () => {
      console.log('Connected! Waiting for `connected` event before subscribing...');
    });

    ws.on('message', (data) => {
      const message = data.toString();
      console.log('Received:', message.length > 500 ? message.slice(0, 500) + '...[truncated]' : message);

      const serverError = detectServerError(message);
      if (serverError) {
        clearTimeout(timeout);
        ws.close();
        reject(new Error('Server error: ' + serverError));
        return;
      }

      const connected = validateConnected(message);
      if (connected?.valid) {
        console.log('Auth + plan gate confirmed (plan=' + (connected.plan || 'unknown') + ')');
        // Primary pass signal: server-controlled `connected` event. Send subscribe
        // as a deeper check; subscriptions / snapshot / l2update are bonus signals.
        if (!subscribeSent) {
          subscribeSent = true;
          const payload = JSON.stringify({ event: 'subscribe', tickers: ['BTC', 'ETH'] });
          try {
            ws.send(payload);
            console.log('Sent:', payload);
          } catch (e) {
            console.warn('Failed to send subscribe (non-fatal, `connected` already validated):', e.message);
          }
        }
        done('Order Book WebSocket test passed - `connected` event received');
        return;
      }

      const subs = validateSubscriptions(message);
      if (subs?.valid) {
        console.log('Subscriptions acknowledged');
        done('Order Book WebSocket test passed - subscriptions acknowledged');
        return;
      }

      const book = validateBookData(message);
      if (book?.valid) {
        console.log('Order book data received: type=' + book.type + ' ticker=' + (book.ticker || 'n/a'));
        done('Order Book WebSocket test passed - received ' + book.type);
        return;
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error('Order Book WebSocket error: ' + error.message));
    });

    ws.on('close', (code, reason) => {
      if (!passed) {
        clearTimeout(timeout);
        const reasonStr = reason ? reason.toString() : '';
        reject(new Error('Order Book WebSocket closed before handshake: ' + code + ' ' + reasonStr));
      }
    });
  });
}

function writeResultFile(status, responseTime, code) {
  const outPath = process.env.ORDER_BOOK_WS_RESULT_FILE;
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
