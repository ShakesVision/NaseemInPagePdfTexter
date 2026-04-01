# MuPDF Paragraph Findings

## 2026-04-02

- MuPDF does not appear to expose a dedicated paragraph delimiter in the page-5 glyph stream.
- It does expose cleaner line geometry than the earlier browser PDF.js path.
- Page 5 baseline analysis from MuPDF shows about 25 distinct `y` levels, matching the legacy extractor closely.
- The main instability is a small within-line baseline jitter around the same visual line, especially near the owl line on page 5.
- That means the best MuPDF paragraph strategy is:
  - cluster glyphs into visual lines using a tolerant `y` grouping
  - build run records from those clustered lines
  - detect paragraphs from short last lines and indentation/line-width changes

## Consequence

MuPDF gives us a better frontend-only foundation than PDF.js, not because it contains a paragraph marker, but because it gives us:

- real subset font identity
- raw glyph payloads
- stable enough `x/y` geometry to cluster lines in-browser
