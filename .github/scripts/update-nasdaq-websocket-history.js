/**
 * Updates history/nasdaq-streaming-websocket.yml from the Nasdaq WebSocket
 * test result file. Used by the uptime / websocket-check workflows so the
 * status page shows the script result rather than the placeholder HTTP probe.
 */

const fs = require('fs');
const path = require('path');

// NOTE: slug is `nasdaq-streaming-web-socket` — Upptime decamelizes "WebSocket"
// -> "web-socket" when slugifying the site name (e.g. "WebSocket Server" ->
// web-socket-server). This MUST match the file the status page reads.
const HISTORY_FILE = path.join(__dirname, '../../history/nasdaq-streaming-web-socket.yml');
const RESULT_FILE = process.env.NASDAQ_WS_RESULT_FILE || path.join(__dirname, '../../nasdaq-ws-result.json');

const now = new Date().toISOString();

let result = { status: 'down', responseTime: 0, code: 0 };
if (fs.existsSync(RESULT_FILE)) {
  try {
    result = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read result file:', e.message);
  }
}

let startTime = now;
if (fs.existsSync(HISTORY_FILE)) {
  try {
    const content = fs.readFileSync(HISTORY_FILE, 'utf8');
    const match = content.match(/startTime:\s*(.+)/);
    if (match) startTime = match[1].trim();
  } catch (e) {
    console.error('Failed to read history file:', e.message);
  }
}

const yaml = `url: https://ws.prixe.io/nasdaq
status: ${result.status}
code: ${result.code}
responseTime: ${result.responseTime}
lastUpdated: ${now}
startTime: ${startTime}
generator: Upptime <https://github.com/upptime/upptime>
`;

fs.writeFileSync(HISTORY_FILE, yaml, 'utf8');
console.log('Updated', HISTORY_FILE, 'with status:', result.status, 'responseTime:', result.responseTime);
