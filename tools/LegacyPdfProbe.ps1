param(
    [Parameter(Mandatory = $true)]
    [string]$PdfPath,
    [int]$StartPage = 5,
    [int]$EndPage = 7,
    [switch]$UseLegacyStrategy,
    [int]$SampleLength = 300
)

$resolvedPdfPath = (Resolve-Path $PdfPath).Path
$itextPath = (Resolve-Path ".\compiled_inspect\NaseemPdfTexter_v1.3\itextsharp.dll").Path

Add-Type -Path $itextPath

if ($UseLegacyStrategy) {
    $source = @"
using System;
using System.Text;
using iTextSharp.text.pdf.parser;

public static class LegacyProbeSupport
{
    private enum TextRenderMode
    {
        FillText = 0,
        StrokeText = 1,
        FillThenStrokeText = 2,
        Invisible = 3,
        FillTextAndAddToPathForClipping = 4,
        StrokeTextAndAddToPathForClipping = 5,
        FillThenStrokeTextAndAddToPathForClipping = 6,
        AddTextToPaddForClipping = 7
    }

    public class Strategy : ITextExtractionStrategy
    {
        private readonly StringBuilder result = new StringBuilder();
        private Vector lastBaseLine;
        private string lastFont;
        private float lastFontSize;

        private static int LigatureRepeatCount = 0;
        private static string LastFont = string.Empty;
        private static string LastText = string.Empty;
        private static float LastFontSize = 0;
        private static float LastRectBottom = 0;

        public void RenderText(TextRenderInfo renderInfo)
        {
            string curFont = renderInfo.GetFont().PostscriptFontName;
            if (renderInfo.GetTextRenderMode() == (int)TextRenderMode.FillThenStrokeText)
            {
                curFont += "-Bold";
            }

            Vector curBaseline = renderInfo.GetBaseline().GetStartPoint();
            Vector topRight = renderInfo.GetAscentLine().GetEndPoint();
            var rect = new iTextSharp.text.Rectangle(
                curBaseline[Vector.I1],
                curBaseline[Vector.I2],
                topRight[Vector.I1],
                topRight[Vector.I2]
            );
            float curFontSize = rect.Height;

            if ((this.lastBaseLine == null) || (curBaseline[Vector.I2] != lastBaseLine[Vector.I2]) || (curFontSize != lastFontSize) || (curFont != lastFont))
            {
                if (this.lastBaseLine != null)
                {
                    this.result.AppendLine("<=!=>");
                }

                float last = LastRectBottom - LastFontSize;
                if (rect.Bottom < last)
                {
                    this.result.AppendLine("۩");
                }

                this.result.Append(curFont);
                this.result.Append("<=;=>-<=;=>");
            }

            string currText = renderInfo.GetText();
            if (currText == LastText && curFont == LastFont)
            {
                LigatureRepeatCount++;
            }
            else
            {
                LigatureRepeatCount = 0;
            }

            if (LigatureRepeatCount == 3)
            {
                LigatureRepeatCount = 0;
                LastText = string.Empty;
                LastFont = string.Empty;
                currText += "۞";
            }

            this.result.Append(currText);

            this.lastBaseLine = curBaseline;
            this.lastFontSize = curFontSize;
            this.lastFont = curFont;

            LastFont = curFont;
            LastText = currText;
            LastFontSize = curFontSize;
            LastRectBottom = rect.Bottom;
        }

        public string GetResultantText()
        {
            return result.ToString();
        }

        public void BeginTextBlock() {}
        public void EndTextBlock() {}
        public void RenderImage(ImageRenderInfo renderInfo) {}
    }
}
"@

    Add-Type -TypeDefinition $source -ReferencedAssemblies @(
        "System.dll",
        $itextPath
    )
}

$reader = New-Object iTextSharp.text.pdf.PdfReader($resolvedPdfPath)

try {
    for ($page = $StartPage; $page -le $EndPage; $page++) {
        if ($UseLegacyStrategy) {
            $strategy = New-Object LegacyProbeSupport+Strategy
            $text = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($reader, $page, $strategy)
        }
        else {
            $text = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($reader, $page)
        }

        $sample = $text.Substring(0, [Math]::Min($SampleLength, $text.Length))
        $sample = $sample.Replace("`r", " ").Replace("`n", " ")

        [pscustomobject]@{
            Page = $page
            Length = $text.Length
            ContainsNoori = $text.Contains("NOORI")
            Sample = $sample
        }
    }
}
finally {
    $reader.Close()
}
