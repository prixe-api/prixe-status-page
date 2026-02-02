/**
 * WebSocket Health Check Script
 * Tests the Prixe WebSocket endpoint by connecting, subscribing to a ticker,
 * and verifying that price_update data is received
 */

const WebSocket = require('ws');

const WS_URL = `wss://ws.prixe.io/ws?api_key=${process.env.PRIXE_API_KEY}`;
const TIMEOUT_MS = 15000;

/**
 * Validates that the received message is a valid price_update event
 * Expected format: {"event": "price_update", "data": {"data": {...}}}
 */
function validatePriceUpdate(message) {
  try {
    const parsed = JSON.parse(message);
    
    // Check for price_update event
    if (parsed.event !== 'price_update') {
      return { valid: false, reason: `Expected event 'price_update', got '${parsed.event}'` };
    }
    
    // Check for data object
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, reason: 'Missing or invalid data object' };
    }
    
    // Check for nested data object with price fields
    const priceData = parsed.data.data;
    if (!priceData || typeof priceData !== 'object') {
      return { valid: false, reason: 'Missing or invalid nested data object' };
    }
    
    // Verify expected price fields exist (they can be "N/A" or actual values)
    const expectedFields = ['askPrice', 'bidPrice', 'lastSalePrice', 'deltaIndicator'];
    const missingFields = expectedFields.filter(field => !(field in priceData));
    
    if (missingFields.length > 0) {
      return { valid: false, reason: `Missing fields: ${missingFields.join(', ')}` };
    }
    
    return { valid: true, data: priceData };
  } catch (e) {
    return { valid: false, reason: `JSON parse error: ${e.message}` };
  }
}

async function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('Connecting to WebSocket...');
    
    const ws = new WebSocket(WS_URL);
    let receivedPriceUpdate = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket test timed out after ' + TIMEOUT_MS + 'ms - no price_update received'));
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
      
      // Validate the message is a proper price_update
      const validation = validatePriceUpdate(message);
      
      if (validation.valid) {
        receivedPriceUpdate = true;
        clearTimeout(timeout);
        
        // Log some of the received price data
        const priceData = validation.data;
        console.log('\nPrice data received:');
        console.log('  - Last Sale Price:', priceData.lastSalePrice);
        console.log('  - Delta Indicator:', priceData.deltaIndicator);
        console.log('  - Ask Price:', priceData.askPrice);
        console.log('  - Bid Price:', priceData.bidPrice);
        
        ws.close();
        resolve('WebSocket test passed - received valid price_update data');
      } else {
        console.log('Message validation:', validation.reason);
        // Continue waiting for a valid price_update
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error: ' + error.message));
    });
    
    ws.on('close', (code, reason) => {
      if (!receivedPriceUpdate) {
        clearTimeout(timeout);
        reject(new Error(`WebSocket closed before receiving price_update: ${code} ${reason}`));
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
