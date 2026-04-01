# CLI Pivot

## Why this pivot is happening

The browser prototype proved useful for learning, but it is currently blocked by PDF.js font identity resolution.

Observed behavior in-browser:

- page 5 has `1160` runs
- output remains empty
- PDF.js exposes internal ids like `g_d0_f1`
- style metadata collapses to `sans-serif`

That is not equivalent to the legacy WinForms extractor, which depends on exact embedded PostScript font names like:

- `AAWXAE+NOORIN01`
- `AACZAL+NOORIN63`
- `AAEBAG+NOORIN85`

## Why CLI-first is safer

- the old app already works with iTextSharp
- we have the shipped `itextsharp.dll` in the repo bundle
- we can mirror the original logic much more directly
- page-range and whole-book support can be added without UI uncertainty
- once behavior is stable, we can decide how to make the browser version match it

## Immediate plan

1. Keep one last browser attempt that tries to resolve fonts after operator-list loading.
2. Build a CLI-style extractor around the legacy iTextSharp approach.
3. Support:
   - single page
   - page range
   - whole book
4. Record page-5 verification outputs in notes.

## Likely end state

The final product can still be frontend-only later, but the reliable source of truth should first be a deterministic extraction core whose output we trust.
