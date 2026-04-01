# Progress Log

## 2026-04-01

- Mapped the legacy solution and confirmed it is a .NET Framework 4.6.1 WinForms app.
- Identified the real core as PDF extraction plus ligature/font decoding, not the UI.
- Confirmed the project ships with three XML data sets:
  - `NastLig.xml`: font/codepoint to ligature text
  - `UniToInpage.xml`: Unicode to InPage encoding rules
  - `InpageToUni.xml`: InPage to Unicode encoding rules
- Found the main PDF extraction pipeline inside `UnicodeToInpage/Form1.cs` and `UnicodeToInpage/TextWithFontExtractionStategy.cs`.
- Confirmed local `dotnet` SDK is not installed in this environment.
- Confirmed Node.js `v22.20.0`, npm `10.9.3`, Python `3.13.9`, and the old shipped `itextsharp.dll` are available.
- Confirmed `hp1.pdf` contains extractable text on page 5 and later; total pages: `293`.

## Core legacy behaviors extracted

- Text extraction is font-aware and line-aware.
- Each rendered text run is tagged with font info using `<=;=>`.
- Each line/run boundary is tagged using `<=!=>`.
- A custom line-break marker `۩` is injected when a text item drops below the previous baseline threshold.
- Repeated glyph emission is treated as faux bold and converted to `۞`, then normalized later.
- Font aliases like `NOORI001` are normalized to `NOORIN01`.
- Ligatures are looked up by `(fontName, unicodeDec)`.
- Some characters are remapped per font before lookup.
- A small set of contextual skip/remap rules handle broken glyph pairs.
- Digits are reversed into Urdu number order.
- English fragments can be skipped entirely or moved to the opposite side of the line.
- There is a repair option for lines containing `ﷺ`.
- A long manual cleanup pass fixes known OCR/extraction defects.

## Direction chosen for this pass

- Extract the reusable logic into browser-friendly JavaScript modules.
- Keep the UI frontend-only for now.
- Process full documents or page ranges instead of one page at a time.
- Use the old XML files directly as data assets.
- Keep a separate probe script for comparing legacy extraction behavior against the JS port.
