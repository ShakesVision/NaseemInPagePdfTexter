# CLI Verification

## New CLI-first pipeline

Files added:

- `tools/NaseemCliExtract.ps1`
- `tools/transform-legacy-raw.mjs`

Pipeline:

1. `LegacyPdfProbe.ps1` extracts legacy-style raw page runs using shipped `itextsharp.dll`
2. `transform-legacy-raw.mjs` parses those raw runs and applies the ported ligature logic
3. output can be emitted for a single page, range, or full book

## Verified sample

Command used:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\NaseemCliExtract.ps1 -PdfPath .\hp1.pdf -Pages 5
```

Observed result:

- page `5` produced meaningful Urdu output
- output begins with:

```text
کوشش تھی کہ ان کاہونہاربیٹاکبھی بھی اس قسم کےبچوں سےمیل جول نہ رکھے...
```

## Conclusion

The extraction logic itself is now working through the CLI-first path.

The current blocker is not the legacy ligature logic anymore.
The blocker is specifically the frontend-only PDF extraction layer and how browser tooling exposes embedded font identity.

## Recommendation

Use the CLI-first path as the correctness baseline.

Next likely steps:

1. add cleaner CLI options for ranges and output bundles
2. compare pages `5-10`
3. only then decide whether to:
   - build a browser-only PDF parser layer
   - or use a precomputed/converted intermediate representation for frontend-only use
