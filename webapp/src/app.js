import { loadLegacyMappings } from "./xml-loader.js";
import { extractLegacyLikeRuns } from "./pdf-extractor.js";
import { transformLegacyRuns } from "./legacy-transform.js";
import { loadLegacyRawFiles } from "./raw-run-parser.js";

const elements = {
  sourceMode: document.querySelector("#source-mode"),
  pdfFile: document.querySelector("#pdf-file"),
  rawFilesWrap: document.querySelector("#raw-files-wrap"),
  rawFiles: document.querySelector("#raw-files"),
  pdfPageControls: document.querySelector("#pdf-page-controls"),
  pageMode: document.querySelector("#page-mode"),
  startPage: document.querySelector("#start-page"),
  endPage: document.querySelector("#end-page"),
  breakMode: document.querySelector("#break-mode"),
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

function getQueryConfig() {
  const url = new URL(window.location.href);
  return {
    pdf: url.searchParams.get("pdf"),
    autoRun: url.searchParams.get("autorun") === "1",
  };
}

function setStatus(title, detail) {
  elements.statusBadge.textContent = title;
  elements.statusDetail.textContent = detail;
}

function getOptions() {
  return {
    skipEnglishWords: elements.skipEnglish.checked,
    lineFeed: elements.lineFeed.checked,
    newlineMode: elements.breakMode.value,
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

function buildPageOutput(pageNumber, runs, mappings, options) {
  const transformed = transformLegacyRuns(runs, mappings, options).trim();
  return {
    pageNumber,
    runCount: runs.length,
    transformed,
    preview: transformed.slice(0, 220) || "[no output]",
  };
}

function renderProcessedDocument(pageResults, debugLines) {
  const documentChunks = pageResults.map((result) =>
    elements.pageSeparators.checked
      ? `===== Page ${result.pageNumber} =====\n${result.transformed}`
      : result.transformed
  );

  elements.output.value = documentChunks.join("\n\n");
  renderPageResults(pageResults);
  renderDebug(debugLines);
}

async function ensureMappings() {
  if (!mappingsPromise) {
    mappingsPromise = loadLegacyMappings();
  }
  return mappingsPromise;
}

async function getPdfFileLike() {
  const selected = elements.pdfFile.files?.[0];
  if (selected) {
    return selected;
  }

  const query = getQueryConfig();
  if (!query.pdf) {
    return null;
  }

  const response = await fetch(query.pdf);
  const bytes = await response.blob();
  return new File([bytes], query.pdf.split("/").at(-1) || "sample.pdf", {
    type: "application/pdf",
  });
}

async function processPdfSource(mappings, options) {
  const file = await getPdfFileLike();
  if (!file) {
    setStatus("Missing PDF", "Choose a PDF file before processing.");
    return;
  }

  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    setStatus("PDF.js not ready", "The browser PDF worker has not loaded yet.");
    return;
  }

  setStatus("Loading PDF", "Reading mappings and PDF bytes.");
  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDocument = await loadingTask.promise;
  const selectedPages = getSelectedPages(pdfDocument.numPages);

  elements.startPage.max = String(pdfDocument.numPages);
  elements.endPage.max = String(pdfDocument.numPages);
  elements.pageSummary.textContent = `${selectedPages.length} page(s) selected out of ${pdfDocument.numPages}.`;

  const pageResults = [];
  const debugLines = [
    "Source: Browser PDF (experimental)",
    `PDF: ${file.name}`,
    `Total pages: ${pdfDocument.numPages}`,
    `Selected pages: ${selectedPages.join(", ")}`,
    `Break mode: ${options.newlineMode}`,
    `Skip English: ${options.skipEnglishWords}`,
    `Line feed: ${options.lineFeed}`,
    `Swap ï·º lines: ${options.swapText}`,
  ];

  for (const pageNumber of selectedPages) {
    setStatus("Processing", `Decoding page ${pageNumber} of ${pdfDocument.numPages}.`);
    const runs = await extractLegacyLikeRuns(pdfDocument, pageNumber, options);
    const fontSummary = [
      ...new Set(
        runs.map(
          (run) =>
            `${run.fontName} | raw:${run.rawFontName || "-"} | ps:${run.psName || "-"} | style:${
              run.styleFontFamily || "-"
            }`
        )
      ),
    ].slice(0, 15);
    const result = buildPageOutput(pageNumber, runs, mappings, options);
    pageResults.push(result);
    debugLines.push(`Page ${pageNumber}: ${runs.length} runs, ${result.transformed.length} output chars`);
    debugLines.push(`Page ${pageNumber} fonts: ${fontSummary.join(", ")}`);
  }

  renderProcessedDocument(pageResults, debugLines);
  setStatus("Complete", `Processed ${selectedPages.length} PDF page(s).`);
}

async function processRawSource(mappings, options) {
  const selectedFiles = elements.rawFiles.files;
  if (!selectedFiles?.length) {
    setStatus("Missing raw files", "Choose one or more legacy raw text files before processing.");
    return;
  }

  setStatus("Loading raw files", "Reading CLI-generated legacy raw pages.");
  const rawPages = await loadLegacyRawFiles(selectedFiles);
  const pageResults = rawPages.map((page) => buildPageOutput(page.pageNumber, page.runs, mappings, options));
  const debugLines = [
    "Source: Legacy raw files (recommended)",
    `Files: ${rawPages.map((page) => page.fileName).join(", ")}`,
    `Pages: ${rawPages.map((page) => page.pageNumber).join(", ")}`,
    `Break mode: ${options.newlineMode}`,
    `Skip English: ${options.skipEnglishWords}`,
    `Line feed: ${options.lineFeed}`,
    `Swap ï·º lines: ${options.swapText}`,
  ];

  for (const result of pageResults) {
    debugLines.push(`Page ${result.pageNumber}: ${result.runCount} runs, ${result.transformed.length} output chars`);
  }

  elements.pageSummary.textContent = `${pageResults.length} raw page(s) loaded.`;
  renderProcessedDocument(pageResults, debugLines);
  setStatus("Complete", `Processed ${pageResults.length} raw page(s).`);
}

async function processDocument() {
  const mappings = await ensureMappings();
  const options = getOptions();

  if (elements.sourceMode.value === "raw") {
    return processRawSource(mappings, options);
  }

  return processPdfSource(mappings, options);
}

function syncSourceModeUi() {
  const rawMode = elements.sourceMode.value === "raw";
  elements.rawFilesWrap.classList.toggle("hidden", !rawMode);
  elements.pdfFile.closest("label")?.classList.toggle("hidden", rawMode);
  elements.pdfPageControls.classList.toggle("hidden", rawMode);

  const isAll = elements.pageMode.value === "all";
  elements.pageMode.disabled = rawMode;
  elements.startPage.disabled = rawMode || isAll;
  elements.endPage.disabled = rawMode || isAll;

  if (rawMode) {
    setStatus("Waiting for raw files", "Load CLI-generated legacy raw page files to transform them in the browser.");
    return;
  }

  setStatus("Waiting for PDF", "Load a PDF and XML mappings to begin.");
}

elements.processBtn.addEventListener("click", () => {
  processDocument().catch((error) => {
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

elements.sourceMode.addEventListener("change", syncSourceModeUi);

elements.pageMode.addEventListener("change", () => {
  const isAll = elements.pageMode.value === "all";
  elements.startPage.disabled = isAll || elements.sourceMode.value === "raw";
  elements.endPage.disabled = isAll || elements.sourceMode.value === "raw";
});

syncSourceModeUi();

const query = getQueryConfig();
if (query.autoRun && query.pdf) {
  elements.sourceMode.value = "pdf";
  syncSourceModeUi();
  processDocument().catch((error) => {
    console.error(error);
    renderDebug([String(error?.stack || error)]);
    setStatus("Error", error?.message || "Unexpected processing error.");
  });
}
