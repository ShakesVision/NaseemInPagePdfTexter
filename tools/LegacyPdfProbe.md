# LegacyPdfProbe

Low-level helper for inspecting raw legacy extraction output.

## Purpose

- reads PDF pages through the shipped `itextsharp.dll`
- can emit:
  - plain extracted text
  - legacy strategy output with font/run markers
- useful for debugging or comparing extraction behavior page by page

## Typical use

You usually do not need to call this directly for normal extraction.

Use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 ...
```

## Direct example

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\LegacyPdfProbe.ps1 -PdfPath .\hp1.pdf -StartPage 5 -EndPage 5 -UseLegacyStrategy
```

## Raw output capture example

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\LegacyPdfProbe.ps1 -PdfPath .\hp1.pdf -StartPage 5 -EndPage 5 -UseLegacyStrategy -RawTextPath notes\fixtures\page-{page}-legacy-raw.txt
```
