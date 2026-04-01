# Sample PDF Findings

## File

- `hp1.pdf`
- size: about `4.8 MB`
- total pages detected by iTextSharp: `293`

## Extraction checks run

### Default iTextSharp extraction

Pages `5` and `6` both produced non-empty text, but the output looked like encoded glyph soup.

That is expected for this legacy format because plain extraction does not preserve the font context needed for ligature decoding.

### Legacy-style font-aware extraction

Using the probe script with the legacy extraction strategy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\LegacyPdfProbe.ps1 -PdfPath .\hp1.pdf -StartPage 5 -EndPage 5 -UseLegacyStrategy
```

Page `5` produced:

- non-empty output
- `ContainsNoori = True`
- font-tagged segments such as `NOORIN63`, `NOORIN56`, `NOORIN85`

This confirms the old decoding approach is applicable to the sample PDF.

## Why page 5 matters

- the supplied note said content starts around page `5`
- page `5` is the first page currently used as the default in the new web UI
- it is suitable for early behavioral comparisons between:
  - old iTextSharp strategy output
  - new PDF.js item extraction
  - new JS ligature transform

## Verification completed in this pass

- probe script works
- sample PDF is readable by the shipped `itextsharp.dll`
- legacy strategy detects `NOORI` font runs on page `5`
- JS transform module passes local unit-style checks

## Still to verify

- compare final cleaned JS output against legacy executable output for the same page
- inspect a few later content pages beyond page `5` to see where font naming diverges, if at all
- decide whether page headers and page numbers should be stripped automatically in the new app
