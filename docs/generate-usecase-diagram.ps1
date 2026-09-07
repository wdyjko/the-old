Add-Type -AssemblyName System.Drawing

$width = 2200
$height = 1400
$pngPath = "C:\Users\Lenovo\Desktop\the-old-no-deps\docs\system-usecase.png"
$svgPath = "C:\Users\Lenovo\Desktop\the-old-no-deps\docs\system-usecase.svg"

$bmp = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::White)

$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 60, 60)), 3
$linePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80, 80, 80)), 2
$includePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 120, 120)), 2
$includePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$fillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 30, 30))
$titleFont = New-Object System.Drawing.Font ("Microsoft YaHei", 22, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font ("Microsoft YaHei", 15, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font ("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Regular)

function Draw-Actor {
    param(
        [System.Drawing.Graphics]$g,
        [string]$label,
        [int]$x,
        [int]$y
    )

    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(50, 50, 50)), 3
    $g.DrawEllipse($pen, $x + 30, $y, 40, 40)
    $g.DrawLine($pen, $x + 50, $y + 40, $x + 50, $y + 100)
    $g.DrawLine($pen, $x + 15, $y + 60, $x + 85, $y + 60)
    $g.DrawLine($pen, $x + 50, $y + 100, $x + 20, $y + 145)
    $g.DrawLine($pen, $x + 50, $y + 100, $x + 80, $y + 145)
    $g.DrawString($label, $labelFont, $textBrush, $x - 10, $y + 155)
    $pen.Dispose()
}

function Draw-UseCase {
    param(
        [System.Drawing.Graphics]$g,
        [string]$label,
        [int]$x,
        [int]$y,
        [int]$w = 220,
        [int]$h = 62
    )

    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $rectF = New-Object System.Drawing.RectangleF ([single]$x), ([single]$y), ([single]$w), ([single]$h)
    $g.FillEllipse($fillBrush, $rect)
    $g.DrawEllipse($borderPen, $rect)

    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($label, $labelFont, $textBrush, $rectF, $format)
    $format.Dispose()
}

function Draw-Link {
    param(
        [System.Drawing.Graphics]$g,
        [int]$x1,
        [int]$y1,
        [int]$x2,
        [int]$y2,
        [System.Drawing.Pen]$pen = $linePen
    )
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
}

function Draw-Arrow {
    param(
        [System.Drawing.Graphics]$g,
        [int]$x1,
        [int]$y1,
        [int]$x2,
        [int]$y2,
        [string]$label
    )

    $g.DrawLine($includePen, $x1, $y1, $x2, $y2)

    $angle = [Math]::Atan2($y2 - $y1, $x2 - $x1)
    $arrowLen = 12
    $arrowAngle = [Math]::PI / 8
    $ax1 = $x2 - $arrowLen * [Math]::Cos($angle - $arrowAngle)
    $ay1 = $y2 - $arrowLen * [Math]::Sin($angle - $arrowAngle)
    $ax2 = $x2 - $arrowLen * [Math]::Cos($angle + $arrowAngle)
    $ay2 = $y2 - $arrowLen * [Math]::Sin($angle + $arrowAngle)
    $g.DrawLine($includePen, $x2, $y2, [int]$ax1, [int]$ay1)
    $g.DrawLine($includePen, $x2, $y2, [int]$ax2, [int]$ay2)

    $mx = [int](($x1 + $x2) / 2)
    $my = [int](($y1 + $y2) / 2)
    $g.DrawString($label, $smallFont, $textBrush, $mx + 6, $my - 18)
}

$systemRect = New-Object System.Drawing.Rectangle 260, 70, 1680, 1220
$graphics.DrawRectangle($borderPen, $systemRect)
$graphics.DrawString("Smart Elderly Care Platform", $titleFont, $textBrush, 840, 82)

Draw-Actor $graphics "Elderly / Family" 40 210
Draw-Actor $graphics "Volunteer" 40 670
Draw-Actor $graphics "Admin" 1980 290
Draw-Actor $graphics "Baidu Voice API" 1970 930

$usecases = @(
    @{ Label = "Register"; X = 380; Y = 180 },
    @{ Label = "Login"; X = 680; Y = 180 },
    @{ Label = "View Profile"; X = 980; Y = 180 },
    @{ Label = "Update Profile"; X = 1280; Y = 180 },
    @{ Label = "Create Service Order"; X = 380; Y = 330 },
    @{ Label = "View Orders / Detail"; X = 680; Y = 330 },
    @{ Label = "Order Chat"; X = 980; Y = 330 },
    @{ Label = "Confirm Completion"; X = 1280; Y = 330 },
    @{ Label = "Reject Completion"; X = 1580; Y = 330 },
    @{ Label = "Rate Order / Volunteer"; X = 380; Y = 480 },
    @{ Label = "Redeem Points"; X = 680; Y = 480 },
    @{ Label = "Use Prize"; X = 980; Y = 480 },
    @{ Label = "Voice Input"; X = 1280; Y = 480 },
    @{ Label = "Browse Available Orders"; X = 380; Y = 760 },
    @{ Label = "Accept Order"; X = 680; Y = 760 },
    @{ Label = "Update Order Status"; X = 980; Y = 760 },
    @{ Label = "Submit Completion"; X = 1280; Y = 760 },
    @{ Label = "View Dashboard"; X = 380; Y = 1000 },
    @{ Label = "Audit Order"; X = 680; Y = 1000 },
    @{ Label = "Set Reward Points"; X = 980; Y = 1000 },
    @{ Label = "Manage User Status"; X = 1280; Y = 1000 },
    @{ Label = "Delete User"; X = 1580; Y = 1000 },
    @{ Label = "Edit Order"; X = 680; Y = 1140 },
    @{ Label = "Delete Order"; X = 980; Y = 1140 },
    @{ Label = "Award Volunteer Points"; X = 1280; Y = 1140 },
    @{ Label = "Call Voice Service"; X = 1580; Y = 480 }
)

foreach ($u in $usecases) {
    Draw-UseCase $graphics $u.Label $u.X $u.Y
}

# Elderly / family links
Draw-Link $graphics 130 255 380 211
Draw-Link $graphics 130 285 680 211
Draw-Link $graphics 130 320 980 211
Draw-Link $graphics 130 350 1280 211
Draw-Link $graphics 130 390 380 361
Draw-Link $graphics 130 430 680 361
Draw-Link $graphics 130 470 980 361
Draw-Link $graphics 130 505 1280 361
Draw-Link $graphics 130 535 1580 361
Draw-Link $graphics 130 570 380 511
Draw-Link $graphics 130 605 680 511
Draw-Link $graphics 130 640 980 511
Draw-Link $graphics 130 675 1280 511

# Volunteer links
Draw-Link $graphics 130 715 380 211
Draw-Link $graphics 130 745 680 211
Draw-Link $graphics 130 780 980 211
Draw-Link $graphics 130 810 1280 211
Draw-Link $graphics 130 845 380 791
Draw-Link $graphics 130 875 680 791
Draw-Link $graphics 130 905 980 791
Draw-Link $graphics 130 935 1280 791
Draw-Link $graphics 130 965 980 361
Draw-Link $graphics 130 995 680 361

# Admin links
Draw-Link $graphics 1980 335 790 211
Draw-Link $graphics 1980 380 600 1031
Draw-Link $graphics 1980 425 900 1031
Draw-Link $graphics 1980 470 1200 1031
Draw-Link $graphics 1980 510 1500 1031
Draw-Link $graphics 1980 550 1800 1031
Draw-Link $graphics 1980 590 900 1171
Draw-Link $graphics 1980 630 1200 1171
Draw-Link $graphics 1980 670 790 361

# External system link
Draw-Link $graphics 1970 975 1800 511

# Include relations
Draw-Arrow $graphics 1390 791 1090 791 "<<include>>"
Draw-Arrow $graphics 1390 361 1390 1140 "<<include>>"
Draw-Arrow $graphics 790 1031 1090 1031 "<<include>>"
Draw-Arrow $graphics 1390 511 1690 511 "<<include>>"

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$svg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1400" viewBox="0 0 2200 1400">
  <rect width="2200" height="1400" fill="#ffffff"/>
  <rect x="260" y="70" width="1680" height="1220" fill="none" stroke="#3c3c3c" stroke-width="3"/>
  <text x="1100" y="110" text-anchor="middle" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="22" font-weight="700" fill="#1e1e1e">Smart Elderly Care Platform</text>
  <g stroke="#323232" stroke-width="3" fill="none">
    <circle cx="90" cy="230" r="20"/><line x1="90" y1="250" x2="90" y2="310"/><line x1="55" y1="270" x2="125" y2="270"/><line x1="90" y1="310" x2="60" y2="355"/><line x1="90" y1="310" x2="120" y2="355"/>
    <circle cx="90" cy="690" r="20"/><line x1="90" y1="710" x2="90" y2="770"/><line x1="55" y1="730" x2="125" y2="730"/><line x1="90" y1="770" x2="60" y2="815"/><line x1="90" y1="770" x2="120" y2="815"/>
    <circle cx="2030" cy="310" r="20"/><line x1="2030" y1="330" x2="2030" y2="390"/><line x1="1995" y1="350" x2="2065" y2="350"/><line x1="2030" y1="390" x2="2000" y2="435"/><line x1="2030" y1="390" x2="2060" y2="435"/>
    <circle cx="2030" cy="950" r="20"/><line x1="2030" y1="970" x2="2030" y2="1030"/><line x1="1995" y1="990" x2="2065" y2="990"/><line x1="2030" y1="1030" x2="2000" y2="1075"/><line x1="2030" y1="1030" x2="2060" y2="1075"/>
  </g>
  <g font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="15" fill="#1e1e1e">
    <text x="80" y="400" text-anchor="middle">Elderly / Family</text>
    <text x="90" y="860" text-anchor="middle">Volunteer</text>
    <text x="2030" y="480" text-anchor="middle">Admin</text>
    <text x="2030" y="1120" text-anchor="middle">Baidu Voice API</text>
  </g>
</svg>
'@

[System.IO.File]::WriteAllText($svgPath, $svg, [System.Text.Encoding]::UTF8)

$graphics.Dispose()
$bmp.Dispose()
$borderPen.Dispose()
$linePen.Dispose()
$includePen.Dispose()
$fillBrush.Dispose()
$textBrush.Dispose()
$titleFont.Dispose()
$labelFont.Dispose()
$smallFont.Dispose()
