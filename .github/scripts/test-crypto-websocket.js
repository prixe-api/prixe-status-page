/**
 * Crypto Streaming WebSocket Health Check
 *
 * Connects to /crypto, subscribes to BTC for SNAPSHOT, and passes when the
 * server confirms the handshake. Like the Nasdaq stream, the /crypto handler
 * bridges to an upstream feed, so the strongest *server-controlled* signal is
 * the `connected` event (sent right after auth + plan gate succeed). We also
 * accept `subscription_status: subscribed` and any well-formed `market_data`
 * push as bonus pass signals.
 *
 * Plan gate: Pro+ only. Auth uses ?api_key=... query string.
 */

const WebSocket = require('ws');

const WS_URL = `wss://ws.prixe.io/crypto?api_key=${process.env.PRIXE_PRO_PLUS_API_KEY}`;
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

function validateSubscriptionStatus(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'subscription_status') return null;
    if (parsed.data?.status !== 'subscribed') return null;
    return { valid: true, ticker: parsed.data?.ticker || parsed.data?.symbol };
  } catch (e) {
    return null;
  }
}

function validateMarketData(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.event !== 'market_data') return null;
    const d = parsed.data;
    if (!d || typeof d !== 'object') return null;
    return { valid: true, ticker: d.ticker || d.symbol };
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
    if (parsed.event === 'subscription_status' && parsed.data?.status === 'error') {
      return parsed.data?.message || 'subscribe rejected';
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function testWebSocket() {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    console.log('Connecting to Crypto WebSocket...');

    const ws = new WebSocket(WS_URL);
    let passed = false;
    let subscribeSent = false;

    const timeout = setTimeout(() => {
      ws.close();
      if (!passed) {
        reject(new Error('Crypto WebSocket test timed out after ' + TIMEOUT_MS + 'ms'));
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
        // as a deeper check; subscription_status / market_data are bonus signals.
        if (!subscribeSent) {
          subscribeSent = true;
          const payload = JSON.stringify({
            event: 'subscribe',
            data: { ticker: 'BTC', sub_types: ['SNAPSHOT'] }
          });
          try {
            ws.send(payload);
            console.log('Sent:', payload);
          } catch (e) {
            console.warn('Failed to send subscribe (non-fatal, `connected` already validated):', e.message);
          }
        }
        done('Crypto WebSocket test passed - `connected` event received');
        return;
      }

      const sub = validateSubscriptionStatus(message);
      if (sub?.valid) {
        console.log('Subscription confirmed for ticker:', sub.ticker);
        done('Crypto WebSocket test passed - subscribed to ' + sub.ticker);
        return;
      }

      const md = validateMarketData(message);
      if (md?.valid) {
        console.log('market_data received: ticker=' + (md.ticker || 'n/a'));
        done('Crypto WebSocket test passed - received market_data push');
        return;
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error('Crypto WebSocket error: ' + error.message));
    });

    ws.on('close', (code, reason) => {
      if (!passed) {
        clearTimeout(timeout);
        const reasonStr = reason ? reason.toString() : '';
        reject(new Error('Crypto WebSocket closed before handshake: ' + code + ' ' + reasonStr));
      }
    });
  });
}

function writeResultFile(status, responseTime, code) {
  const outPath = process.env.CRYPTO_WS_RESULT_FILE;
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
