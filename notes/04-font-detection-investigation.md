# Font Detection Investigation

## What the original C# app actually uses

The WinForms app does not use any UI font setting to detect text fonts.

It uses:

- `renderInfo.GetFont().PostscriptFontName` in `TextWithFontExtractionStategy`
- then `GetFontNOORI()` in `Form1.cs`
- then `CleanFont()` to normalize names like:
  - `AAWXAE+NOORIN01` -> `NOORIN01`
  - `NOORI001` -> `NOORIN01`

So the correct signal is the embedded PDF font name per text run.

## Why the first web version failed

The browser prototype initially used PDF.js style metadata:

- `styles[item.fontName].fontFamily`

For the sample page this surfaced only:

- `sans-serif`

That is a rendering fallback family, not the embedded PDF font identity used by the legacy extractor.

## Verified embedded fonts on page 5

Inspection of the page-5 PDF resources shows actual embedded fonts such as:

- `/F3 => /AAWXAE+NOORIN01`
- `/F10 => /AACZAL+NOORIN63`
- `/F32 => /AABCAH+NOORIN56`
- `/F5 => /AAEBAG+NOORIN85`

This matches the old extractor behavior and confirms the data we need is present in the PDF.

## Fix direction

The web extractor should prefer actual PDF.js font objects and internal names over CSS family fallbacks.

Candidate fields to inspect in PDF.js runtime objects:

- `commonObj.psName`
- `commonObj.name`
- `commonObj.fontName`
- `commonObj.loadedName`
- `style.fontFamily`
- raw `item.fontName`

The app has been updated to expose more of this in the debug output so the next run can confirm which field carries the embedded `NOORINxx` name in-browser.
