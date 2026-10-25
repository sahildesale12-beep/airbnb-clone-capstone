import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
let count = 0;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (/\.(jsx|js|mjs)$/.test(item.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (!text.trim()) throw new Error(`Empty source file: ${full}`);
      count++;
    }
  }
}
walk(root);
console.log(`Frontend source presence check passed for ${count} JavaScript/JSX files. Run npm run build for full Vite compilation.`);
