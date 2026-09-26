#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function validateExceptions(text, today = new Date().toISOString().slice(0, 10)) {
  const entries = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  for (const entry of entries) {
    const match = entry.match(/^((?:CVE|GHSA)-[\w-]+) exp:(\d{4}-\d{2}-\d{2})$/);
    if (!match || Number.isNaN(Date.parse(match[2])) || new Date(match[2]).toISOString().slice(0, 10) !== match[2]) {
      throw new Error(`Security exception must have an ID and valid exp:YYYY-MM-DD: ${entry}`);
    }
    if (match[2] <= today) throw new Error(`Security exception ${match[1]} expired on ${match[2]}; re-evaluate or remove it.`);
  }
  return entries.length;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`Security exceptions reviewed: ${validateExceptions(fs.readFileSync('.trivyignore', 'utf8'))}`);
}
