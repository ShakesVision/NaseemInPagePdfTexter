# Raw Layout Analysis

## Page 5 findings

- Fresh raw extraction now includes layout metadata in the second field:
  - `fontName<=;=>x|y|bottom|fontSize<=;=>glyphs`
- Example:
  - `AACZAL+NOORIN63<=;=>545.52|697.56|697.56|13.788<=;=>`
- The glyph payload is still encoded font-specific text at this stage, not readable Urdu.
- Page 5 produced about `963` raw runs and about `27` visual line groups when grouped by baseline `y`.
- There were no explicit paragraph markers in the raw stream corresponding to the user's manual paragraph breaks.

## Implication

Paragraph mode cannot be solved by looking for a dedicated paragraph delimiter in the legacy raw text.
It has to be inferred from one or more of:

- baseline / line grouping
- indentation from `x`
- sentence punctuation
- final-line shortness / heading-like shapes

## Next implementation direction

- normalize noisy same-line `y` fragments into stable visual lines
- compute right-side line start `x` per visual line
- detect paragraph starts from indentation shifts and sentence boundaries
- keep `paragraph` as the default CLI break mode
