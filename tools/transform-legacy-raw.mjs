import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformLegacyRuns } from "../webapp/src/legacy-transform.js";

function decodeXml(str) {
  return str
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function loadLigatureMap(xmlPath) {
  const xml = fs.readFileSync(xmlPath, "utf8");
  const ligatureMap = new Map();

  for (const block of xml.split("<Ligatures>").slice(1)) {
    const body = block.split("</Ligatures>")[0];
    const font = /<FontName>([\s\S]*?)<\/FontName>/.exec(body)?.[1]?.trim();
    const dec = Number(/<UnicodeDec>([\s\S]*?)<\/UnicodeDec>/.exec(body)?.[1]?.trim());
    const lig = decodeXml(/<Ligature>([\s\S]*?)<\/Ligature>/.exec(body)?.[1] ?? "");
    const skipSpace = /<SkipSpace>([\s\S]*?)<\/SkipSpace>/.exec(body)?.[1]?.trim() ?? "";
    if (font && !Number.isNaN(dec)) {
      ligatureMap.set(`${font}:${dec}`, { ligature: lig, skipSpace });
    }
  }

  return { ligatureMap };
}

function parseRawRuns(rawText) {
  return rawText
    .split("<=!=>")
    .map((chunk) => {
      const parts = chunk.split("<=;=>");
      if (parts.length < 3) {
        return null;
      }

      return {
        fontName: parts[0].trim(),
        text: parts.slice(2).join("<=;=>"),
        lineBreak: chunk.includes("۩"),
      };
    })
    .filter(Boolean);
}

const args = process.argv.slice(2);
const options = {
  rawDir: "",
  pages: "",
  output: "",
  perPageOutputDir: "",
  skipEnglishWords: true,
  lineFeed: true,
  swapText: true,
  includePageMarkers: false,
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--raw-dir") options.rawDir = args[++i];
  else if (arg === "--pages") options.pages = args[++i];
  else if (arg === "--output") options.output = args[++i];
  else if (arg === "--per-page-output-dir") options.perPageOutputDir = args[++i];
  else if (arg === "--skip-english") options.skipEnglishWords = args[++i] !== "false";
  else if (arg === "--line-feed") options.lineFeed = args[++i] !== "false";
  else if (arg === "--swap-text") options.swapText = args[++i] !== "false";
  else if (arg === "--include-page-markers") options.includePageMarkers = true;
}

if (!options.rawDir || !options.pages) {
  console.error("Missing --raw-dir or --pages");
  process.exit(1);
}

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFile), "..");
const mappings = loadLigatureMap(path.join(repoRoot, "UnicodeToInpage", "NastLig.xml"));
const pageNumbers = options.pages.split(",").map((value) => Number(value.trim())).filter(Boolean);

const chunks = [];
for (const page of pageNumbers) {
  const rawPath = path.join(options.rawDir, `page-${page}-legacy-raw.txt`);
  const raw = fs.readFileSync(rawPath, "utf8");
  const runs = parseRawRuns(raw);
  const output = transformLegacyRuns(runs, mappings, {
    skipEnglishWords: options.skipEnglishWords,
    lineFeed: options.lineFeed,
    swapText: options.swapText,
  }).trim();

  if (options.perPageOutputDir) {
    fs.mkdirSync(options.perPageOutputDir, { recursive: true });
    const perPagePath = path.join(options.perPageOutputDir, `page-${page}.txt`);
    fs.writeFileSync(perPagePath, output, "utf8");
  }

  if (options.includePageMarkers) {
    chunks.push(`===== Page ${page} =====\n${output}`);
  } else {
    chunks.push(output);
  }
}

const finalText = chunks.join("\n\n");
if (options.output) {
  fs.writeFileSync(options.output, finalText, "utf8");
} else {
  process.stdout.write(finalText);
}
