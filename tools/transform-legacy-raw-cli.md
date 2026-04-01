# transform-legacy-raw-cli

Internal helper used by `NaseemCliExtract.ps1`.

## Purpose

- reads raw legacy page-run text files produced by `LegacyPdfProbe.ps1`
- parses run markers like:
  - `<=!=>`
  - `<=;=>`
  - `۩`
- applies the JavaScript ligature transform
- writes combined and/or per-page text files

## Normal use

You normally should not call this file directly.

Use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 ...
```

## Direct invocation

If needed, it can be called like this:

```powershell
node .\tools\transform-legacy-raw-cli.mjs --raw-dir .\notes\fixtures\cli-run --pages 5 --output .\out\page-5.txt
```

## Inputs expected

- raw files named like `page-5-legacy-raw.txt`
- original ligature XML at `UnicodeToInpage\NastLig.xml`
