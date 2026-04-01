import assert from "node:assert/strict";
import { transformLegacyRuns } from "../src/legacy-transform.js";

const baseMappings = {
  ligatureMap: new Map([
    ["NOORIN01:65", { ligature: "ا", skipSpace: "" }],
    ["NOORIN01:66", { ligature: "ب", skipSpace: "" }],
    ["NOORIN01:49", { ligature: "1", skipSpace: "" }],
    ["NOORIN01:50", { ligature: "2", skipSpace: "" }],
    ["NOORIN14:247", { ligature: "ے", skipSpace: "" }],
    ["NOORIN02:67", { ligature: "ﷺ", skipSpace: "" }],
  ]),
};

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

runTest("transforms mapped ligatures into unicode output", () => {
  const output = transformLegacyRuns(
    [{ fontName: "NOORI001", text: "AB", lineBreak: false }],
    baseMappings,
    { skipEnglishWords: false, lineFeed: true, swapText: true }
  );

  assert.match(output, /ا/);
  assert.match(output, /ب/);
});

runTest("reverses digit clusters for urdu numbers", () => {
  const output = transformLegacyRuns(
    [{ fontName: "NOORI001", text: "12A", lineBreak: false }],
    baseMappings,
    { skipEnglishWords: false, lineFeed: true, swapText: false }
  );

  assert.match(output, /۲۱/);
});

runTest("keeps explicit line break markers", () => {
  const output = transformLegacyRuns(
    [
      { fontName: "NOORI001", text: "A", lineBreak: false },
      { fontName: "NOORI001", text: "B", lineBreak: true },
    ],
    baseMappings,
    { skipEnglishWords: false, lineFeed: true, swapText: false }
  );

  assert.match(output, /\n/);
});

if (!process.exitCode) {
  console.log("All tests passed.");
}
