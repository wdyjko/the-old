$ErrorActionPreference = "Stop"
$src = "C:\Users\Lenovo\Desktop\the-old-no-deps\智慧助老服务对接平台-毕业答辩.pptx"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Open($src, $false, $false, $false)
$sw = $pres.PageSetup.SlideWidth
$sh = $pres.PageSetup.SlideHeight
function Convert-X([double]$x) { $x / 1280.0 * $sw }
function Convert-Y([double]$y) { $y / 720.0 * $sh }
function Convert-W([double]$w) { $w / 1280.0 * $sw }
function Convert-H([double]$h) { $h / 720.0 * $sh }

$slide = $pres.Slides.Item(25)
for ($i = $slide.Shapes.Count; $i -ge 1; $i--) {
  $shape = $slide.Shapes.Item($i)
  if (-not $shape.HasTextFrame) { continue }
  if (-not $shape.TextFrame.HasText) { continue }
  if ($shape.TextFrame.TextRange.Text -like "*课题总结*") {
    $shape.Delete()
  }
}

function Get-BgrColor([string]$hex) {
  $hex = $hex.TrimStart("#")
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return $b * 65536 + $g * 256 + $r
}
$ink = Get-BgrColor "17212B"
$t = "课题总结：`n完成基于 Node.js + React 的社区智慧助老服务对接平台，实现老人/家属端、志愿者端、管理员端三端协同；`n覆盖需求发布、审核匹配、服务执行、实时沟通、评价反馈与积分激励等业务闭环。"
$shape = $slide.Shapes.AddTextbox(1, (Convert-X 180), (Convert-Y 360), (Convert-W 920), (Convert-H 100))
$tr = $shape.TextFrame.TextRange
$tr.Text = $t
$tr.Font.Name = "微软雅黑"
$tr.Font.Size = 14
$tr.Font.Color.RGB = $ink
$tr.ParagraphFormat.Alignment = 2
$shape.Fill.Visible = 0
$shape.Line.Visible = 0

$pres.Save()
$pres.Close()
$ppt.Quit()
Write-Host "Slide 25 layout fixed."
