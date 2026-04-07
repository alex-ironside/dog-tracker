#!/usr/bin/env node
// Verify i18n: (1) structural parity between EN/PL dictionaries, (2) grep-gate for likely-untranslated display strings.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd())
const enPath = join(root, 'src/locales/en/common.json')
const plPath = join(root, 'src/locales/pl/common.json')

function flatten(obj, prefix = '') {
  const out = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const child of flatten(v, key)) out.add(child)
    } else {
      out.add(key)
    }
  }
  return out
}

const en = JSON.parse(readFileSync(enPath, 'utf8'))
const pl = JSON.parse(readFileSync(plPath, 'utf8'))
const enKeys = flatten(en)
const plKeys = flatten(pl)

// Normalize i18next plural suffixes — different languages use different plural forms.
const pluralSuffixRe = /_(zero|one|two|few|many|other)$/
const norm = (k) => k.replace(pluralSuffixRe, '')
const enBase = new Set([...enKeys].map(norm))
const plBase = new Set([...plKeys].map(norm))
const missingInPl = [...enBase].filter((k) => !plBase.has(k))
const missingInEn = [...plBase].filter((k) => !enBase.has(k))

let failed = false
if (missingInPl.length || missingInEn.length) {
  console.error('[verify-i18n] Key parity mismatch between EN and PL dictionaries:')
  if (missingInPl.length) console.error('  missing in pl:', missingInPl.join(', '))
  if (missingInEn.length) console.error('  missing in en:', missingInEn.join(', '))
  failed = true
} else {
  console.log(`[verify-i18n] parity OK (${enKeys.size} keys)`)
}

// Grep gate: scan src/components + src/App.tsx for literal display strings in JSX.
const targets = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (/\.(tsx|ts)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) targets.push(p)
  }
}
walk(join(root, 'src/components'))
targets.push(join(root, 'src/App.tsx'))

// JSX text between > and < that looks like a natural display string (starts with capital, has a space OR is >=4 letters word).
const jsxTextRe = />\s*([A-Z][A-Za-z][A-Za-z '?!.,:-]{3,})\s*</g
// String-literal attribute values for human-visible props.
const attrRe = /\b(aria-label|title|placeholder|alt)\s*=\s*(["'])([A-Z][^"'{<>]{2,})\2/g

const allowSubstrings = [
  'EN', 'PL', 'SVG',
]

const findings = []
for (const file of targets) {
  const src = readFileSync(file, 'utf8')
  let m
  jsxTextRe.lastIndex = 0
  while ((m = jsxTextRe.exec(src))) {
    const text = m[1].trim()
    if (allowSubstrings.includes(text)) continue
    // Skip if looks like a component name (single CapWord no space) used as element: those are <Foo /> not >Foo<
    if (!/\s/.test(text) && text.length < 6) continue
    findings.push({ file, text })
  }
  attrRe.lastIndex = 0
  while ((m = attrRe.exec(src))) {
    const text = m[3].trim()
    if (allowSubstrings.includes(text)) continue
    findings.push({ file, text, attr: m[1] })
  }
}

if (findings.length) {
  console.error(`[verify-i18n] grep-gate found ${findings.length} likely-untranslated display string(s):`)
  for (const f of findings) {
    const rel = f.file.replace(root + '\\', '').replace(root + '/', '')
    console.error(`  ${rel}: ${f.attr ? f.attr + '=' : ''}"${f.text}"`)
  }
  failed = true
} else {
  console.log(`[verify-i18n] grep-gate OK (${targets.length} files scanned)`)
}

process.exit(failed ? 1 : 0)
