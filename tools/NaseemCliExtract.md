# Naseem CLI Extract

Primary CLI entrypoint for the legacy Naseem PDF extraction flow.

## What it does

- reads an InPage-generated PDF
- extracts font-aware raw runs using the shipped `itextsharp.dll`
- transforms those runs into cleaned Urdu text using the ported ligature logic
- supports:
  - single page
  - page range
  - comma-separated page list
  - whole book
- can emit:
  - combined output
  - per-page output
  - both in one call

## Main command

Run from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5
```

## Parameters

- `-PdfPath`
  - required
  - path to the source PDF

- `-Pages`
  - optional
  - default: `5`
  - accepted forms:
    - `5`
    - `5-10`
    - `5,7,9`
    - `5,7-9,12`
    - `all`

- `-CombinedOutputPath`
  - optional
  - writes one merged text file for all selected pages

- `-PerPageOutputDir`
  - optional
  - writes one file per selected page:
    - `page-5.txt`
    - `page-6.txt`
    - etc.

- `-SkipEnglishWords`
  - optional boolean
  - default: `$true`
  - set to `$false` to keep English-heavy runs

- `-LineFeed`
  - optional boolean
  - default: `$true`
  - legacy compatibility switch
  - if you pass this without `-BreakMode`, `$true` maps to `line` and `$false` maps to `none`

- `-BreakMode`
  - optional
  - default: `paragraph`
  - accepted values:
    - `paragraph`
    - `line`
    - `none`
  - `paragraph` is the new default and is intended for book-style output
  - `line` keeps visual line breaks
  - `none` flattens lines into continuous text

- `-RepairText`
  - optional boolean
  - default: `$true`
  - applies the legacy line repair behavior for `ï·º` cases

- `-IncludePageMarkers`
  - optional switch
  - adds page headers inside the combined output

- `-EmitDebug`
  - optional switch
  - prints progress while extracting

- `-KeepRawFiles`
  - optional switch
  - keeps temporary legacy raw-run files under `notes\fixtures\cli-run`

## Examples

### 1. Single page to console

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5
```

### 2. Single page to a file

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5 -CombinedOutputPath .\out\page-5.txt
```

### 3. Range with combined output

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5-8 -CombinedOutputPath .\out\pages-5-8.txt -IncludePageMarkers
```

### 4. Range with per-page files

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5-8 -PerPageOutputDir .\out\pages-5-8
```

### 5. Whole book with both combined and per-page outputs

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages all -CombinedOutputPath .\out\book.txt -PerPageOutputDir .\out\book-pages -IncludePageMarkers -EmitDebug
```

### 6. Keep English and reduce line splitting

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5 -SkipEnglishWords $false -LineFeed $false
```

### 7. Default paragraph mode

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5 -BreakMode paragraph
```

### 8. Preserve original visual lines

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5 -BreakMode line
```

## Notes

- the browser prototype is not the source of truth right now
- this CLI path is the correctness baseline
- for the supplied sample PDF, page `5` is the recommended first verification page
- the raw extraction format now preserves layout metadata as `x|y|bottom|fontSize`, which is the basis for future indentation-aware paragraph detection
