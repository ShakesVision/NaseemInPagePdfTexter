# Webapp Prototype

Static browser-first prototype for the old Naseem PDF Texter.

## What it does

- loads the original XML mapping files from the legacy C# project
- processes a PDF in the browser with PDF.js
- supports single-page, range, or whole-book processing
- applies a first-pass JavaScript port of the legacy ligature cleanup logic

## Current constraints

- this is a translation scaffold, not a verified 1:1 port yet
- accuracy still needs comparison against the old executable on multiple sample pages
- PDF.js font metadata may differ from the old iTextSharp font naming in some PDFs

## Local testing

Run from the `webapp` folder:

```powershell
npm test
```

To use the UI, serve the repo with any static file server so the browser can fetch:

- `webapp/index.html`
- `UnicodeToInpage/*.xml`

Opening `index.html` directly from `file://` may block `fetch()` in some browsers.
