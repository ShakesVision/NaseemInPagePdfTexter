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
- A custom line-break marker `Û©` is injected when a text item drops below the previous baseline threshold.
- Repeated glyph emission is treated as faux bold and converted to `Ûž`, then normalized later.
- Font aliases like `NOORI001` are normalized to `NOORIN01`.
- Ligatures are looked up by `(fontName, unicodeDec)`.
- Some characters are remapped per font before lookup.
- A small set of contextual skip/remap rules handle broken glyph pairs.
- Digits are reversed into Urdu number order.
- English fragments can be skipped entirely or moved to the opposite side of the line.
- A repair option for lines containing `ï·º` exists.
- A manual cleanup pass fixes known extraction defects.

## Direction chosen for this pass

- Extract the reusable logic into browser-friendly JavaScript modules.
- Keep the UI frontend-only for now.
- Process full documents or page ranges instead of one page at a time.
- Use the old XML files directly as data assets.
- Keep a separate probe script for comparing legacy extraction behavior against the JS port.

## 2026-04-01 follow-up

- Reproduced the `0 output chars` failure path on page `5`.
- Confirmed two missing decode steps in the JS port:
  - subset font names like `AACZAL+NOORIN63` must be reduced to `NOORIN63`
  - private-use glyphs in the `U+F0xx` range must be converted back to low-byte values by subtracting `0xF000`
- Verified the fix by pushing a real legacy page-5 capture through the JS transformer:
  - before fix: `0` output chars
  - after fix: about `2296` output chars

## 2026-04-01 paragraph-mode follow-up

- Confirmed page `5` raw extraction is not plain Urdu text; it is font-tagged glyph runs plus delimiters that are decoded afterward through `NastLig.xml`.
- Confirmed the current raw dump was preserving glyph runs but discarding layout coordinates by writing `-` as placeholder metadata.
- Confirmed page `5` does not contain direct paragraph markers in the raw run stream; the existing marker is only for detected visual line drops.
- Updated the legacy probe so raw runs now carry `x|y|bottom|fontSize` metadata alongside font name and glyph text.
- Added an explicit CLI `-BreakMode` with `paragraph`, `line`, and `none`.
- Kept `-LineFeed` as a compatibility alias, but the new intended default is `paragraph`.
- Next step is to use the preserved `x` positions for indentation-aware paragraph grouping instead of relying only on sentence heuristics.
