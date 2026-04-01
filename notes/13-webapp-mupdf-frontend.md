# MuPDF Frontend Integration

## 2026-04-02

- The webapp now uses `mupdf` directly in-browser instead of depending on CLI-generated raw files.
- The missing module is implemented in [webapp/src/mupdf-extractor.js](/f:/WORK/Pent/NaseemInPagePdfTexter/webapp/src/mupdf-extractor.js).
- Extraction now uses `Device.fillText` plus `Text.walk(showGlyph)` so we keep:
  - real subset font names like `AAWXAE+NOORIN01`
  - raw private-use glyph payloads
  - per-glyph `x/y` geometry
- There is still no dedicated paragraph delimiter in the MuPDF stream.
- Paragraph mode therefore depends on:
  - clustering glyphs into visual lines with a tolerant `y` threshold
  - using the existing layout-aware paragraph grouping in `legacy-transform.js`
- `legacy-transform.js` was also corrected so `lineBreak` means "break before this run", matching the raw format and decoder behavior.

## Consequence

- The browser path is now genuinely frontend-only.
- Remaining quality work is about line clustering and text ordering, not external preprocessing.
