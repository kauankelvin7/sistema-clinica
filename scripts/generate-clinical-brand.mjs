// Rasterizes the original SVG with the repository's audited Playwright dependency.
// Run: node scripts/generate-clinical-brand.mjs (Chromium installed).
import { chromium } from '../frontend/node_modules/playwright/index.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
const target = path.resolve(import.meta.dirname, '../frontend/public')
const svg = await readFile(path.join(target, 'logo.svg'), 'utf8')
const browser = await chromium.launch()
try {
  for (const [file, size, dark, maskable] of [
    ['logo_light.png', 512, false, false], ['logo_dark.png', 512, true, false],
    ['icons/icon-192x192.png', 192, false, false], ['icons/icon-512x512.png', 512, false, false],
    ['icons/maskable-icon-512x512.png', 512, false, true], ['icons/apple-touch-icon.png', 180, false, false],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    const artwork = dark ? svg.replace('#7a1f2a', '#171b23').replace('#ffffff', '#e6b1b6') : svg
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;display:grid;place-items:center;background:${maskable ? '#7a1f2a' : 'transparent'}}svg{width:${maskable ? 78 : 100}%;height:${maskable ? 78 : 100}%}</style>${artwork}`)
    await writeFile(path.join(target, file), await page.screenshot({ omitBackground: true }))
    await page.close()
  }
} finally { await browser.close() }
