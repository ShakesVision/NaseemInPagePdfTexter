function parseXml(xmlText) {
  return new DOMParser().parseFromString(xmlText, "application/xml");
}

function textOf(node, tagName) {
  return node.querySelector(tagName)?.textContent?.trim() ?? "";
}

export async function loadLegacyMappings() {
  const [ligaturesXml, uniToInpageXml, inpageToUniXml] = await Promise.all([
    fetch("../../UnicodeToInpage/NastLig.xml").then((response) => response.text()),
    fetch("../../UnicodeToInpage/UniToInpage.xml").then((response) => response.text()),
    fetch("../../UnicodeToInpage/InpageToUni.xml").then((response) => response.text()),
  ]);

  const ligaturesDoc = parseXml(ligaturesXml);
  const uniToInpageDoc = parseXml(uniToInpageXml);
  const inpageToUniDoc = parseXml(inpageToUniXml);

  const ligatureMap = new Map();
  for (const row of ligaturesDoc.querySelectorAll("Ligatures")) {
    const fontName = textOf(row, "FontName");
    const unicodeDec = Number(textOf(row, "UnicodeDec"));
    if (!fontName || Number.isNaN(unicodeDec)) {
      continue;
    }

    ligatureMap.set(`${fontName}:${unicodeDec}`, {
      fontName,
      unicodeDec,
      ligature: textOf(row, "Ligature"),
      skipSpace: textOf(row, "SkipSpace"),
      origWord: textOf(row, "OrigWord"),
    });
  }

  const uniToInpage = [];
  for (const row of uniToInpageDoc.querySelectorAll("UniToInpage")) {
    uniToInpage.push({
      unicodeDec: Number(textOf(row, "UnicodeDec")),
      inpageDec: Number(textOf(row, "InpageDec")),
      codePage: Number(textOf(row, "CodePage")),
      type: textOf(row, "Type"),
      string1: textOf(row, "String1"),
      endTrans: textOf(row, "EndTrans"),
      ignore: textOf(row, "Ignore"),
    });
  }

  const inpageToUni = [];
  for (const row of inpageToUniDoc.querySelectorAll("InpageToUni")) {
    inpageToUni.push({
      inpageDec: Number(textOf(row, "InpageDec")),
      unicodeDec: Number(textOf(row, "UnicodeDec")),
      ignore: textOf(row, "Ignore"),
    });
  }

  return {
    ligatureMap,
    uniToInpage,
    inpageToUni,
  };
}
