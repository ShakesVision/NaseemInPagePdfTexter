import { loadLegacyMappings } from "./xml-loader.js";
import { extractLegacyLikeRuns } from "./pdf-extractor.js";
import { transformLegacyRuns } from "./legacy-transform.js";

const elements = {
  pdfFile: document.querySelector("#pdf-file"),
  pageMode: document.querySelector("#page-mode"),
  startPage: document.querySelector("#start-page"),
  endPage: document.querySelector("#end-page"),
  skipEnglish: document.querySelector("#skip-english"),
  lineFeed: document.querySelector("#line-feed"),
  swapText: document.querySelector("#swap-text"),
  pageSeparators: document.querySelector("#page-separators"),
  processBtn: document.querySelector("#process-btn"),
  copyBtn: document.querySelector("#copy-btn"),
  output: document.querySelector("#output"),
  debug: document.querySelector("#debug"),
  results: document.querySelector("#results"),
  pageSummary: document.querySelector("#page-summary"),
  statusBadge: document.querySelector("#status-badge"),
  statusDetail: document.querySelector("#status-detail"),
};

let mappingsPromise = null;

function setStatus(title, detail) {
  elements.statusBadge.textContent = title;
  elements.statusDetail.textContent = detail;
}

function getOptions() {
  return {
    skipEnglishWords: elements.skipEnglish.checked,
    lineFeed: elements.lineFeed.checked,
    swapText: elements.swapText.checked,
  };
}

function clampPage(page, pageCount) {
  return Math.max(1, Math.min(pageCount, page));
}

function getSelectedPages(pageCount) {
  const mode = elements.pageMode.value;
  const start = clampPage(Number(elements.startPage.value || 1), pageCount);
  const end = clampPage(Number(elements.endPage.value || start), pageCount);

  if (mode === "all") {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (mode === "range") {
    const first = Math.min(start, end);
    const last = Math.max(start, end);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }
  return [start];
}

function renderDebug(lines) {
  elements.debug.textContent = lines.join("\n");
}

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderPageResults(results) {
  elements.results.innerHTML = results
    .map(
      (result) => `
        <article class="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-amber-100">Page ${result.pageNumber}</h3>
            <span class="text-xs text-stone-400">${result.runCount} runs</span>
          </div>
          <p class="text-sm leading-7 text-stone-300">${escapeHtml(result.preview)}</p>
        </article>
      `
    )
    .join("");
}

async function ensureMappings() {
  if (!mappingsPromise) {
    mappingsPromise = loadLegacyMappings();
  }
  return mappingsPromise;
}

async function processPdf() {
  const file = elements.pdfFile.files?.[0];
  if (!file) {
    setStatus("Missing PDF", "Choose a PDF file before processing.");
    return;
  }

  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    setStatus("PDF.js not ready", "The browser PDF worker has not loaded yet.");
    return;
  }

  setStatus("Loading", "Reading mappings and PDF bytes.");
  const [mappings, bytes] = await Promise.all([ensureMappings(), file.arrayBuffer()]);

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDocument = await loadingTask.promise;
  const selectedPages = getSelectedPages(pdfDocument.numPages);
  const options = getOptions();

  elements.startPage.max = String(pdfDocument.numPages);
  elements.endPage.max = String(pdfDocument.numPages);
  elements.pageSummary.textContent = `${selectedPages.length} page(s) selected out of ${pdfDocument.numPages}.`;

  const pageResults = [];
  const documentChunks = [];
  const debugLines = [
    `PDF: ${file.name}`,
    `Total pages: ${pdfDocument.numPages}`,
    `Selected pages: ${selectedPages.join(", ")}`,
    `Skip English: ${options.skipEnglishWords}`,
    `Line feed: ${options.lineFeed}`,
    `Swap ﷺ lines: ${options.swapText}`,
  ];

  for (const pageNumber of selectedPages) {
    setStatus("Processing", `Decoding page ${pageNumber} of ${pdfDocument.numPages}.`);
    const runs = await extractLegacyLikeRuns(pdfDocument, pageNumber, options);
    const transformed = transformLegacyRuns(runs, mappings, options).trim();

    const pageBlock = elements.pageSeparators.checked
      ? `\n\n===== Page ${pageNumber} =====\n${transformed}`
      : transformed;

    documentChunks.push(pageBlock);
    pageResults.push({
      pageNumber,
      runCount: runs.length,
      preview: transformed.slice(0, 220) || "[no output]",
    });
    debugLines.push(`Page ${pageNumber}: ${runs.length} runs, ${transformed.length} output chars`);
  }

  elements.output.value = documentChunks.join(elements.pageSeparators.checked ? "\n" : "\n\n");
  renderPageResults(pageResults);
  renderDebug(debugLines);
  setStatus("Complete", `Processed ${selectedPages.length} page(s).`);
}

elements.processBtn.addEventListener("click", () => {
  processPdf().catch((error) => {
    console.error(error);
    renderDebug([String(error?.stack || error)]);
    setStatus("Error", error?.message || "Unexpected processing error.");
  });
});

elements.copyBtn.addEventListener("click", async () => {
  if (!elements.output.value) {
    return;
  }
  await navigator.clipboard.writeText(elements.output.value);
  setStatus("Copied", "Processed text copied to clipboard.");
});

elements.pageMode.addEventListener("change", () => {
  const isAll = elements.pageMode.value === "all";
  elements.startPage.disabled = isAll;
  elements.endPage.disabled = isAll;
});

setStatus("Waiting for PDF", "Load a PDF and XML mappings to begin.");
