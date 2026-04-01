# Webapp Raw Import

## 2026-04-01

- Added a browser-side `Legacy Raw Files (Recommended)` mode to the webapp.
- This lets the UI reuse the reliable CLI extraction output while still doing the ligature transform in the browser.
- Added a real `Break Mode` selector to the UI with `paragraph` as the default.
- Kept direct PDF processing in the UI, but marked it as experimental because font identity recovery in PDF.js is still unreliable for these InPage PDFs.
