import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const mockDir = path.join(root, '..', 'front-end', 'src', 'mocks');
const outDir = path.join(root, 'database', 'seeders', 'data');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = [
  { file: 'users.ts', varName: 'mockUsers', out: 'users.json' },
  { file: 'attendance.ts', varName: 'mockAttendance', out: 'attendance.json' },
  { file: 'notifications.ts', varName: 'mockNotifications', out: 'notifications.json' },
  { file: 'leaves.ts', varName: 'mockLeaves', out: 'leaves.json' },
  { file: 'overtimes.ts', varName: 'mockOvertimes', out: 'overtimes.json' },
  { file: 'payslips.ts', varName: 'mockPayslips', out: 'payslips.json' },
  { file: 'timeoff.ts', varName: 'mockTimeOffs', out: 'timeoffs.json' },
];

function extractArrayLiteral(content, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`export\\s+const\\s+${escaped}(?:\\s*:[^=]+)?\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const match = content.match(re);
  if (!match) {
    throw new Error(`Cannot find array literal for ${varName}`);
  }

  return match[1];
}

function sanitizeTsArrayLiteral(arrayLiteral) {
  return arrayLiteral
    .replace(/\s+as\s+const/g, '')
    .replace(/\s+as\s+[A-Za-z0-9_<>\[\]\|\s]+/g, '');
}

for (const entry of files) {
  const fullPath = path.join(mockDir, entry.file);
  const source = fs.readFileSync(fullPath, 'utf8');
  const arrayLiteral = extractArrayLiteral(source, entry.varName);

  const sanitized = sanitizeTsArrayLiteral(arrayLiteral);
  const data = Function(`"use strict"; return (${sanitized});`)();
  const outPath = path.join(outDir, entry.out);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Exported ${entry.varName} -> ${path.relative(root, outPath)}`);
}
