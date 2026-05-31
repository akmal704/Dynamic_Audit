import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const section = process.argv[3] || 'services';

const puppeteerEntry = 'C:/Users/user/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/puppeteer/puppeteer.js';
const { default: puppeteer } = await import(pathToFileURL(puppeteerEntry).href);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2' });

const el = await page.$(`#${section}`);
if (el) {
  const filename = path.join(__dirname, 'temporary screenshots', `section-${section}.png`);
  await el.screenshot({ path: filename });
  console.log(`Saved: ${filename}`);
} else {
  console.log(`Section #${section} not found`);
}
await browser.close();
