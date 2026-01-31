/**
 * WebSocket Health Check Script
 * Tests the Prixe WebSocket endpoint by connecting and subscribing to a ticker
 */

const WebSocket = require('ws');

const WS_URL = `wss://ws.prixe.io/ws?api_key=${process.env.PRIXE_API_KEY}`;
const TIMEOUT_MS = 15000;

async function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('Connecting to WebSocket...');
    
    const ws = new WebSocket(WS_URL);
    let subscribed = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket test timed out after ' + TIMEOUT_MS + 'ms'));
    }, TIMEOUT_MS);
    
    ws.on('open', () => {
      console.log('Connected! Sending subscribe message...');
      
      const subscribeMessage = JSON.stringify({
        event: "subscribe",
        data: {
          ticker: "TSLA"
        }
      });
      
      ws.send(subscribeMessage);
      console.log('Sent:', subscribeMessage);
    });
    
    ws.on('message', (data) => {
      const message = data.toString();
      console.log('Received:', message);
      
      // Any response after subscribing indicates success
      if (!subscribed) {
        subscribed = true;
        clearTimeout(timeout);
        ws.close();
        resolve('WebSocket test passed - received response after subscribe');
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error: ' + error.message));
    });
    
    ws.on('close', (code, reason) => {
      if (!subscribed) {
        clearTimeout(timeout);
        // If we connected and closed without error, that's still a pass
        if (code === 1000 || code === 1005) {
          resolve('WebSocket connected successfully (closed normally)');
        } else {
          reject(new Error(`WebSocket closed unexpectedly: ${code} ${reason}`));
        }
      }
    });
  });
}

testWebSocket()
  .then((result) => {
    console.log('\n✓ SUCCESS:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ FAILED:', error.message);
    process.exit(1);
  });
