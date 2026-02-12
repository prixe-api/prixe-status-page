/**
 * Merges two Upptime history runs: only report "down" if both runs were down.
 * Reduces false positives by requiring two consecutive failures.
 *
 * Usage: run after two "update" steps. First run's history should be in
 * HISTORY_FIRST_RUN_DIR, second run in history/. Merged result written to history/.
 */

const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.join(__dirname, '../../history');
const FIRST_RUN_DIR = process.env.HISTORY_FIRST_RUN_DIR || path.join(HISTORY_DIR, '..', 'history_first_run');

function parseHistoryFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const obj = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) obj[match[1]] = match[2].trim();
  }
  return obj;
}

function writeHistoryFile(filePath, data) {
  const yaml = `url: ${data.url}
status: ${data.status}
code: ${data.code}
responseTime: ${data.responseTime}
lastUpdated: ${data.lastUpdated}
startTime: ${data.startTime}
generator: ${data.generator}
`;
  fs.writeFileSync(filePath, yaml, 'utf8');
}

if (!fs.existsSync(FIRST_RUN_DIR)) {
  console.log('No first-run history found at', FIRST_RUN_DIR, '- skipping merge');
  process.exit(0);
}

const secondRunFiles = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.yml'));
let merged = 0;

for (const file of secondRunFiles) {
  const firstPath = path.join(FIRST_RUN_DIR, file);
  const secondPath = path.join(HISTORY_DIR, file);
  const first = parseHistoryFile(firstPath);
  const second = parseHistoryFile(secondPath);
  if (!second) continue;

  const firstDown = first && first.status === 'down';
  const secondDown = second.status === 'down';

  let status, code, responseTime, lastUpdated, startTime;
  if (firstDown && secondDown) {
    status = 'down';
    code = second.code || '0';
    responseTime = second.responseTime || '0';
    lastUpdated = second.lastUpdated || new Date().toISOString();
    startTime = second.startTime || first?.startTime || lastUpdated;
  } else {
    status = 'up';
    const upRun = secondDown && first && first.status === 'up' ? first : second;
    code = upRun.code || '200';
    responseTime = upRun.responseTime || '0';
    lastUpdated = upRun.lastUpdated || new Date().toISOString();
    startTime = second.startTime || first?.startTime || lastUpdated;
  }

  const url = second.url || first?.url || '';
  const generator = second.generator || 'Upptime <https://github.com/upptime/upptime>';

  writeHistoryFile(secondPath, {
    url,
    status,
    code,
    responseTime,
    lastUpdated,
    startTime,
    generator
  });
  merged++;
  if (firstDown && secondDown) {
    console.log('Merged (down):', file);
  } else if (firstDown && !secondDown) {
    console.log('Merged (up on retry):', file);
  }
}

console.log('Merged', merged, 'history files (down only if both runs failed).');
process.exit(0);
