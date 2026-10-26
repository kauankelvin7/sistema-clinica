import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const parts = ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z']
const catalog = parts.flatMap(part => JSON.parse(readFileSync(
  new URL('../src/data/cid10/catalogo-' + part + '.json', import.meta.url), 'utf8'
)))
const codes = new Map(catalog)
test('DATASUS e COVID-19 completos, sem duplicatas e com descrições', () => {
  assert.equal(catalog.length, 14238)
  assert.equal(codes.size, catalog.length)
  for (const [code, text] of catalog) {
    assert.match(code, /^[A-Z]\d{2}(?:\.[0-9A-Z])?$/)
    assert.ok(text && text.trim(), code)
  }
})
test('capítulos e amostras de códigos raros, comuns e de COVID-19', () => {
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    assert.ok(catalog.some(([code]) => code.startsWith(letter)), letter)
  for (const code of ['A00', 'A00.0', 'B34.9', 'F32.1', 'I10', 'M54.5', 'R51', 'V01', 'X99', 'Z99', 'U07.1', 'U07.2', 'U08.9', 'U09.9', 'U10.9'])
    assert.ok(codes.has(code), code)
})
