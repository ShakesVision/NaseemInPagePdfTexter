# Migration Plan

## Goal

Turn the legacy single-page WinForms extractor into a frontend-only web app that can process:

- one page
- a page range
- the whole book

## Architecture

### 1. Keep data files as source of truth

- reuse `UnicodeToInpage/NastLig.xml`
- reuse `UnicodeToInpage/UniToInpage.xml`
- reuse `UnicodeToInpage/InpageToUni.xml`

### 2. Split the port into layers

- `xml-loader.js`
  - parse XML into JS lookup structures
- `legacy-transform.js`
  - port of font normalization, remap, ligature, cleanup logic
- `pdf-extractor.js`
  - build legacy-like spans from PDF.js text items
- `app.js`
  - UI orchestration, range handling, progress, results

### 3. Range-aware workflow

- load file once
- choose `all`, `single`, or `range`
- process selected pages sequentially
- collect per-page text and metadata
- join output with page separators only when requested

## Completed in this phase

- legacy codebase mapped
- sample PDF added and inspected
- frontend-only scaffold started
- JS transform engine started
- reusable probe script started

## Remaining TODOs

- compare JS output against the legacy app on multiple pages
- decide whether to keep the huge `CleanString` replacement list exactly as-is or move it into a JSON data file
- decide whether English-word handling should stay identical or become optional by mode
- decide if Unicode <-> InPage clipboard converters should be part of the web UI or moved to a separate tool tab
- optionally add export formats:
  - `.txt`
  - `.json`
  - per-page output bundle

## Decision currently recommended

Build the web app first, but keep the core modules CLI-friendly.

Reason:

- the hardest part is decoding the legacy font/ligature logic, not the UI shell
- browser PDF.js gives us a natural frontend-only extraction path
- the same core can later be wrapped by Node CLI if needed

## Open question for the next pass

Should the web app output only cleaned Unicode Urdu text, or do we also want debug views showing:

- raw PDF.js text items
- legacy-tagged spans
- ligature/font trace per page
