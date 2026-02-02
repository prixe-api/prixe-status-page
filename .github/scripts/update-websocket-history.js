/**
 * Updates history/web-socket-server.yml from the WebSocket test result file.
 * Used by the uptime workflow so the status page shows the script result.
 */

const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../../history/web-socket-server.yml');
const RESULT_FILE = process.env.WEBSOCKET_RESULT_FILE || path.join(__dirname, '../../websocket-result.json');

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

const yaml = `url: https://ws.prixe.io/ws
status: ${result.status}
code: ${result.code}
responseTime: ${result.responseTime}
lastUpdated: ${now}
startTime: ${startTime}
generator: Upptime <https://github.com/upptime/upptime>
`;

fs.writeFileSync(HISTORY_FILE, yaml, 'utf8');
console.log('Updated', HISTORY_FILE, 'with status:', result.status, 'responseTime:', result.responseTime);
