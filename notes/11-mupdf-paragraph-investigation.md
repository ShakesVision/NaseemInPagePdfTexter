# MuPDF Paragraph Investigation

## 2026-04-02

- Baseline MuPDF test proved access to real subset font names and glyph payloads.
- Next step is to compare MuPDF line/paragraph signals against the older iTextSharp raw stream.
- Focus questions:
  - does MuPDF expose any clearer paragraph delimiter than the legacy raw stream?
  - if not, are line starts / line widths / indentation more stable under MuPDF?
  - can we switch the webapp to MuPDF-only and remove the PowerShell dependency entirely?
