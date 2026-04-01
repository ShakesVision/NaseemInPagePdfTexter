param(
    [Parameter(Mandatory = $true)]
    [string]$PdfPath,
    [string]$Pages = "5",
    [string]$CombinedOutputPath,
    [string]$PerPageOutputDir,
    [bool]$SkipEnglishWords = $true,
    [bool]$LineFeed = $true,
    [ValidateSet("paragraph", "line", "none")]
    [string]$BreakMode = "paragraph",
    [bool]$RepairText = $true,
    [switch]$IncludePageMarkers,
    [switch]$EmitDebug,
    [switch]$KeepRawFiles
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-PageNumbers {
    param([string]$Spec, [int]$MaxPage)
    $trimmed = $Spec.Trim().ToLowerInvariant()
    if ($trimmed -eq "all") { return 1..$MaxPage }

    $pages = New-Object System.Collections.Generic.List[int]
    foreach ($part in $trimmed.Split(",")) {
        $token = $part.Trim()
        if (-not $token) { continue }
        if ($token.Contains("-")) {
            $bounds = $token.Split("-", 2)
            $start = [int]$bounds[0]
            $end = [int]$bounds[1]
            if ($end -lt $start) { $tmp = $start; $start = $end; $end = $tmp }
            foreach ($page in $start..$end) {
                if ($page -ge 1 -and $page -le $MaxPage -and -not $pages.Contains($page)) {
                    $pages.Add($page) | Out-Null
                }
            }
            continue
        }
        $pageNo = [int]$token
        if ($pageNo -ge 1 -and $pageNo -le $MaxPage -and -not $pages.Contains($pageNo)) {
            $pages.Add($pageNo) | Out-Null
        }
    }
    return $pages.ToArray()
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptRoot
$resolvedPdfPath = (Resolve-Path $PdfPath).Path
$tempRoot = Join-Path $repoRoot "notes\fixtures\cli-run"
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

Add-Type -Path (Join-Path $repoRoot "compiled_inspect\NaseemPdfTexter_v1.3\itextsharp.dll")
$reader = New-Object iTextSharp.text.pdf.PdfReader($resolvedPdfPath)
$pageNumbers = Get-PageNumbers -Spec $Pages -MaxPage $reader.NumberOfPages
$reader.Close()

if ($null -eq $pageNumbers) {
    throw "No valid pages selected from spec '$Pages'."
}

$pageArray = @($pageNumbers)
if ($pageArray.Length -eq 0) {
    throw "No valid pages selected from spec '$Pages'."
}

$pageList = ($pageArray | ForEach-Object { $_.ToString() }) -join ","
$effectiveBreakMode = $BreakMode
if ($PSBoundParameters.ContainsKey("LineFeed") -and -not $PSBoundParameters.ContainsKey("BreakMode")) {
    if ($LineFeed) { $effectiveBreakMode = "line" }
    else { $effectiveBreakMode = "none" }
}
$preserveLineMarkers = $effectiveBreakMode -ne "none"

foreach ($pageNo in $pageArray) {
    if ($EmitDebug) { Write-Host "Extracting raw legacy page $pageNo" }
    powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scriptRoot "LegacyPdfProbe.ps1") `
        -PdfPath $resolvedPdfPath `
        -StartPage $pageNo `
        -EndPage $pageNo `
        -UseLegacyStrategy `
        -RawTextPath ("notes\\fixtures\\cli-run\\page-{0}-legacy-raw.txt" -f $pageNo) | Out-Null
}

$nodeArgs = @(
    (Join-Path $scriptRoot "transform-legacy-raw-cli.mjs"),
    "--raw-dir", $tempRoot,
    "--pages", $pageList,
    "--skip-english", $SkipEnglishWords.ToString().ToLowerInvariant(),
    "--line-feed", $preserveLineMarkers.ToString().ToLowerInvariant(),
    "--newline-mode", $effectiveBreakMode,
    "--swap-text", $RepairText.ToString().ToLowerInvariant()
)

if ($IncludePageMarkers) {
    $nodeArgs += "--include-page-markers"
}

if ($CombinedOutputPath) {
    $resolvedCombinedOutput = if ([System.IO.Path]::IsPathRooted($CombinedOutputPath)) { $CombinedOutputPath } else { Join-Path $repoRoot $CombinedOutputPath }
    $outDir = Split-Path -Parent $resolvedCombinedOutput
    if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
    $nodeArgs += @("--output", $resolvedCombinedOutput)
}

if ($PerPageOutputDir) {
    $resolvedPerPageDir = if ([System.IO.Path]::IsPathRooted($PerPageOutputDir)) { $PerPageOutputDir } else { Join-Path $repoRoot $PerPageOutputDir }
    New-Item -ItemType Directory -Force -Path $resolvedPerPageDir | Out-Null
    $nodeArgs += @("--per-page-output-dir", $resolvedPerPageDir)
}

if ($EmitDebug) {
    Write-Host ("Transforming pages: {0}" -f $pageList)
    Write-Host ("Break mode: {0}" -f $effectiveBreakMode)
}

$result = & node @nodeArgs

if (-not $KeepRawFiles) {
    foreach ($pageNo in $pageArray) {
        $rawPath = Join-Path $tempRoot ("page-{0}-legacy-raw.txt" -f $pageNo)
        if (Test-Path $rawPath) {
            try {
                Remove-Item -LiteralPath $rawPath -Force -ErrorAction Stop
            }
            catch {
                if ($EmitDebug) {
                    Write-Host "Could not remove temp raw file: $rawPath"
                }
            }
        }
    }
}

if (-not $CombinedOutputPath) {
    $result
}
