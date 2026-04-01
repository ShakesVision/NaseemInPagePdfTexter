# MuPDF Test Results

## 2026-04-02

- Installed the official `mupdf` npm package in `webapp`.
- Verified MuPDF JS exposes low-level text APIs that PDF.js was not giving us:
  - `Device`
  - `Text.walk()`
  - `showGlyph(font, trm, glyph, unicode, ...)`
- Confirmed page 5 of `hp1.pdf` exposes real embedded subset font names through MuPDF, for example:
  - `AAWXAE+NOORIN01`
  - `AACZAL+NOORIN63`
  - `AABCAH+NOORIN56`
- Confirmed MuPDF also exposes glyph ids and private-use unicode payloads like:
  - `glyph: 11, unicodeChar: ""`
  - `glyph: 14, unicodeChar: ""`
- Built two spike scripts:
  - `webapp/scripts/mupdf-spike.mjs`
  - `webapp/scripts/mupdf-transform-page5.mjs`
- Generated reports:
  - `notes/mupdf-page5-spike.json`
  - `notes/mupdf-page5-transform-report.json`
  - `notes/mupdf-page5-raw-like.txt`
  - `out/mupdf-page5-paragraph.txt`

## Conclusion so far

MuPDF passed the most important test that PDF.js failed:
we can access the real font identity plus glyph-level data in a browser/WASM-capable engine.

The first raw-like reconstruction is not parity-perfect yet, but the project is no longer blocked on font visibility if we pivot to MuPDF.
The remaining work is now implementation quality:

- line grouping
- baseline handling
- run reconstruction parity
- feeding those runs into the existing JS transformer
