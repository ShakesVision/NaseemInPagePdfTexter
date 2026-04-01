# Paragraph Mode Investigation

## Plain-language extraction flow

1. `LegacyPdfProbe.ps1` asks iTextSharp for each rendered text run on the PDF page.
2. Each run is written as:
   - `fontName<=;=>x|y|bottom|fontSize<=;=>glyphs`
3. Runs are separated with `<=!=>`.
4. When the renderer drops to a lower baseline, the extractor inserts a line marker:
   - `۩`
5. The glyph text is still not readable Urdu at this stage.
   - it is encoded per embedded Noori font subset
   - examples look like `` or ``
6. `transform-legacy-raw-cli.mjs` parses those runs.
7. `webapp/src/legacy-transform.js` converts each glyph code through:
   - font normalization
   - code remapping
   - ligature lookup in `NastLig.xml`
   - cleanup and line/paragraph formatting

## What page 5 showed

- The raw stream clearly contains font-tagged gibberish first, then gets decoded later.
- The raw stream did not contain separate paragraph markers for the manual breaks in `out/page-5-ideal.txt`.
- That means paragraph mode must be inferred from layout or text structure.

## Best next signal

- indentation guessing from `x`
- line grouping from baseline `y` / `bottom`
- sentence boundaries as a fallback only

This is why preserving layout metadata in the raw CLI output matters before we try to make paragraph mode reliable across whole books.
