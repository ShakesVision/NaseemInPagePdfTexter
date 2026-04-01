function getFontFamily(item, styles) {
  const style = styles[item.fontName] ?? {};
  return style.fontFamily || item.fontName || "Unknown";
}

function isLikelyBold(item, styles) {
  const fontFamily = getFontFamily(item, styles);
  return /bold/i.test(fontFamily);
}

function getFontSize(item) {
  const transformSize = Math.abs(item.transform?.[3] ?? 0);
  return item.height || transformSize || 0;
}

function getBottom(item) {
  return item.transform?.[5] ?? 0;
}

export async function extractLegacyLikeRuns(pdfDocument, pageNumber, options = {}) {
  const page = await pdfDocument.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const runs = [];

  let lastBottom = 0;
  let lastFontSize = 0;
  let lastText = "";
  let lastFont = "";
  let ligatureRepeatCount = 0;

  for (const item of textContent.items) {
    const fontName = getFontFamily(item, textContent.styles);
    const fontSize = getFontSize(item);
    const bottom = getBottom(item);
    const lineBreak = Boolean(
      item.hasEOL ||
        (runs.length > 0 && options.lineFeed !== false && bottom < (lastBottom - lastFontSize))
    );

    let text = item.str ?? "";
    if (text === lastText && fontName === lastFont) {
      ligatureRepeatCount += 1;
    } else {
      ligatureRepeatCount = 0;
    }

    if (ligatureRepeatCount === 3) {
      ligatureRepeatCount = 0;
      lastText = "";
      lastFont = "";
      text += "۞";
    }

    runs.push({
      pageNumber,
      fontName: isLikelyBold(item, textContent.styles) ? `${fontName}-Bold` : fontName,
      fontSize,
      bottom,
      lineBreak,
      text,
    });

    lastBottom = bottom;
    lastFontSize = fontSize;
    lastText = text;
    lastFont = fontName;
  }

  return runs;
}
