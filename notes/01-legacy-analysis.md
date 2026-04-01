# Legacy Analysis

## Project shape

- `UnicodeToInpage/Form1.cs`
  - UI event handlers
  - XML loading into `DataTable`
  - PDF extraction and text cleanup
  - clipboard converters for Unicode <-> InPage
- `UnicodeToInpage/TextWithFontExtractionStategy.cs`
  - custom iTextSharp extraction strategy
  - emits font-tagged runs and special markers
- `UnicodeToInpage/Gen.cs`
  - mutable extraction state shared across the strategy and form logic

## Important data assets

### `NastLig.xml`

Primary ligature lookup table.

Relevant fields:

- `FontName`
- `Ligature`
- `UnicodeDec`
- `SkipSpace`
- `OrigWord`

### `UniToInpage.xml`

Unicode to InPage conversion rules.

Relevant fields:

- `UnicodeDec`
- `InpageDec`
- `CodePage`
- `Type`
- `String1`
- `EndTrans`
- `Ignore`

### `InpageToUni.xml`

InPage to Unicode conversion rules.

Relevant fields:

- `InpageDec`
- `UnicodeDec`
- `Ignore`

## Legacy PDF pipeline

### Step 1: extract raw runs

The custom iTextSharp strategy collects:

- font name
- font size
- baseline / bottom position
- raw text

It injects legacy control markers:

- `<=;=>` between font metadata and run text
- `<=!=>` between runs
- `۩` for inferred line feeds
- `۞` for repeated faux-bold glyphs

### Step 2: split into tagged lines

`Form1.GetPdfText()` splits the raw output on `<=!=>`, then parses each item as:

`font <=;=> - <=;=> text`

### Step 3: normalize character codes

The legacy code has two modes:

- default
- special

The default path is the real one in use. It includes:

- Windows-1252 style remaps for code points above `255`
- per-font remaps such as `NOORIN14: 247 -> 252`
- contextual skip/remap rules in `SkipIt()`

### Step 4: look up ligatures

Each normalized char code is looked up in `NastLig.xml` by `(font, UnicodeDec)`.

Output cases:

- matched ligature: append ligature text
- unmatched English/symbol char: append raw char
- unmatched other char: drop

### Step 5: handle layout heuristics

- reverse Urdu digits gathered from `NOORIN01`
- append spacing after terminal ligatures in `_endChar`
- optionally skip non-NOORI runs
- optionally swap text around `ﷺ`
- normalize duplicated bold sections
- move English chunks to the opposite side of the line

### Step 6: cleanup replacements

`CleanString()` contains a large manual replacement list for known bad outputs.
This is domain knowledge and should be preserved as data, not buried in UI code.

## What is UI-only and should not survive

- WinForms controls
- embedded IE browser preview
- per-button event handlers
- clipboard-only workflows
- screen resolution font sizing
- custom WinForms message boxes

## What should become shared core logic

- XML mapping loaders
- font normalization
- char remap rules
- ligature lookup
- faux-bold cleanup
- English-word cleanup
- line cleanup
- range/document aggregation

## Browser translation strategy

Use PDF.js text items as the frontend-only extraction source.

Mapping from PDF.js to legacy concepts:

- `item.str` -> raw text
- `item.transform[5]` -> Y position / baseline proxy
- `item.height` or `abs(item.transform[3])` -> font size proxy
- `styles[item.fontName].fontFamily` -> font family proxy
- `item.hasEOL` -> additional line-break hint

This will not be byte-for-byte identical to iTextSharp, but it is close enough to preserve the legacy decoding model.
