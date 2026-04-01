# Webapp Prototype

Static browser-first prototype for the old Naseem PDF Texter.

## What it does

- loads the original XML mapping files from the legacy C# project
- processes a PDF in the browser with PDF.js
- or imports CLI-generated legacy raw page dumps directly in the browser
- supports single-page, range, or whole-book processing
- applies a first-pass JavaScript port of the legacy ligature cleanup logic

## Current constraints

- the recommended browser path is now `Legacy Raw Files`
- direct browser PDF extraction is still experimental because PDF.js may not expose the original embedded font identity cleanly
- the paragraph mode logic now follows the CLI baseline more closely, but text-order/content cleanup still needs more parity work

## Local testing

Run from the `webapp` folder:

```powershell
npm test
```

To use the UI, serve the repo with any static file server so the browser can fetch:

- `webapp/index.html`
- `UnicodeToInpage/*.xml`

Opening `index.html` directly from `file://` may block `fetch()` in some browsers.

## Recommended use right now

1. Generate raw page files with the CLI:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5-8 -KeepRawFiles
```

2. In the web UI choose:
   - `Input source` -> `Legacy Raw Files (Recommended)`
   - `Break Mode` -> `Paragraph`

3. Load the matching `page-*-legacy-raw.txt` files from `notes\fixtures\cli-run`.
