$ErrorActionPreference = "Stop"
$src = "C:\Users\Lenovo\Desktop\the-old-no-deps\智慧助老服务对接平台-毕业答辩.pptx"

function Get-BgrColor([string]$hex) {
  $hex = $hex.TrimStart("#")
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return $b * 65536 + $g * 256 + $r
}

$muted = Get-BgrColor "61707F"
$accent = Get-BgrColor "287C9F"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Open($src, $false, $false, $false)
$sw = $pres.PageSetup.SlideWidth
$sh = $pres.PageSetup.SlideHeight
function Convert-X([double]$x) { $x / 1280.0 * $sw }
function Convert-Y([double]$y) { $y / 720.0 * $sh }
function Convert-W([double]$w) { $w / 1280.0 * $sw }
function Convert-H([double]$h) { $h / 720.0 * $sh }

$slide = $pres.Slides.Item(20)
$patterns = @("测试分组说明", "结论：四类")
for ($i = $slide.Shapes.Count; $i -ge 1; $i--) {
  $shape = $slide.Shapes.Item($i)
  if (-not $shape.HasTextFrame) { continue }
  if (-not $shape.TextFrame.HasText) { continue }
  $t = $shape.TextFrame.TextRange.Text
  foreach ($p in $patterns) {
    if ($t -like ("*" + $p + "*")) { $shape.Delete(); break }
  }
}

$intro = "本节说明：按 L（登录）、D（需求）、V（志愿者）、M（管理）四组用例覆盖关键业务链路；L1-L5 侧重注册与权限，D1-D5 侧重发布与跟踪，V1-V5 侧重接单与执行，M1-M5 侧重审核与实时通信。"
$shape = $slide.Shapes.AddTextbox(1, (Convert-X 64), (Convert-Y 98), (Convert-W 1152), (Convert-H 42))
$tr = $shape.TextFrame.TextRange
$tr.Text = $intro
$tr.Font.Name = "微软雅黑"
$tr.Font.Size = 15
$tr.Font.Color.RGB = $accent
$shape.Fill.Visible = 0
$shape.Line.Visible = 0

$pres.Save()
$pres.Close()
$ppt.Quit()
Write-Host "Slide 20 simplified."
