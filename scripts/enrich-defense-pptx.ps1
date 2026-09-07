# 为毕业答辩 PPT 增补演讲说明文字（需本机安装 PowerPoint）
$ErrorActionPreference = "Stop"
$root = "C:\Users\Lenovo\Desktop\the-old-no-deps"
$src = Join-Path $root "智慧助老服务对接平台-毕业答辩.pptx"
$backup = Join-Path $root "智慧助老服务对接平台-毕业答辩-增补演讲说明前备份.pptx"

if (-not (Test-Path $src)) { throw "找不到文件: $src" }
if (-not (Test-Path $backup)) {
  Copy-Item -LiteralPath $src -Destination $backup -Force
  Write-Host "已备份至: $backup"
}

function Get-BgrColor([string]$hex) {
  $hex = $hex.TrimStart("#")
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return $b * 65536 + $g * 256 + $r
}

$script:Ink = Get-BgrColor "17212B"
$script:Muted = Get-BgrColor "61707F"
$script:Accent = Get-BgrColor "287C9F"

function Convert-X([double]$x) { return $x / 1280.0 * $script:SlideW }
function Convert-Y([double]$y) { return $y / 720.0 * $script:SlideH }
function Convert-W([double]$w) { return $w / 1280.0 * $script:SlideW }
function Convert-H([double]$h) { return $h / 720.0 * $script:SlideH }

function Set-ShapeTextStyle($textRange, [int]$size, $color, [bool]$bold = $false) {
  $textRange.Font.Name = "微软雅黑"
  $textRange.Font.Size = $size
  $textRange.Font.Color.RGB = $color
  $textRange.Font.Bold = $(if ($bold) { -1 } else { 0 })
}

function Add-TextBox($slide, [string]$text, $x, $y, $w, $h, [int]$size, $color, [bool]$bold, [int]$align) {
  $shape = $slide.Shapes.AddTextbox(1, (Convert-X $x), (Convert-Y $y), (Convert-W $w), (Convert-H $h))
  $tf = $shape.TextFrame
  $tf.WordWrap = -1
  $tf.AutoSize = 0
  $tf.MarginLeft = 6
  $tf.MarginRight = 6
  $tf.MarginTop = 4
  $tf.MarginBottom = 4
  $tr = $tf.TextRange
  $tr.Text = $text
  Set-ShapeTextStyle $tr $size $color $bold
  $tr.ParagraphFormat.Alignment = $align
  $shape.Fill.Visible = 0
  $shape.Line.Visible = 0
}

function Update-ShapeTextLike($slide, [string]$pattern, [string]$newText, [int]$size) {
  foreach ($shape in $slide.Shapes) {
    if (-not $shape.HasTextFrame) { continue }
    if (-not $shape.TextFrame.HasText) { continue }
    $t = $shape.TextFrame.TextRange.Text
    if ($t -like ("*" + $pattern + "*")) {
      $tr = $shape.TextFrame.TextRange
      $tr.Text = $newText
      Set-ShapeTextStyle $tr $size $script:Ink $false
      return $true
    }
  }
  return $false
}

function Enhance-Slide2($slide) {
  $t = "答辩说明：论文经学校毕业设计管理系统检测，去除本人文献复制比 2.3%、校内互检 3.9%，审核已通过，符合毕业论文原创性与规范性要求。"
  Add-TextBox $slide $t 64 638 1152 58 15 $script:Muted $false 2
}

function Enhance-Slide8($slide) {
  $t = "架构特点：前后端分离、模块边界明确，便于维护扩展和多端协同。`n数据流向：前端经 REST 调用业务接口，Socket.io 推送聊天与状态变更，MySQL 持久化、Redis 缓存会话与热点数据。"
  if (-not (Update-ShapeTextLike $slide "架构特点" $t 14)) {
    $t2 = "数据流向：前端 REST 请求业务接口，Socket.io 推送实时消息，MySQL 持久化核心数据，Redis 缓存会话与热点状态。"
    Add-TextBox $slide $t2 64 648 1152 48 14 $script:Muted $false 2
  }
}

function Enhance-ScreenshotSlide($slide, [string]$intro, [string]$footer) {
  Add-TextBox $slide $intro 64 98 1152 40 16 $script:Accent $false 1
  if (-not (Update-ShapeTextLike $slide "真实页面展示" $footer 13)) {
    Add-TextBox $slide $footer 64 592 1152 108 13 $script:Ink $false 1
  }
}

function Enhance-Slide15($slide) {
  $intro = "本节重点：展示老人/家属端三大核心页面，说明如何通过入口聚合、表单引导与状态可视化降低操作门槛。"
  $footer = "演讲要点：`n• 首页：聚合个人资料与近期动态，减少菜单层级，便于老人快速进入常用功能`n• 发布需求：表单完整性校验 + 地图选点；支持文字转语音输入（适老化创新）`n• 订单跟踪：按待审核/进行中/已完成分类，服务进度与沟通入口一目了然"
  Enhance-ScreenshotSlide $slide $intro $footer
}

function Enhance-Slide16($slide) {
  $intro = "本节重点：对比列表视图与地图视图，说明志愿者如何结合距离、服务类型与出行成本高效接单。"
  $footer = "演讲要点：`n• 列表视图：支持按类型、距离筛选，信息透明，适合快速浏览与一键接单`n• 地图视图：展示周边需求分布，结合高德地图 API 辅助判断出行路线与接单优先级`n• 接单后订单状态自动同步至老人端与管理端，形成多端协同闭环"
  Enhance-ScreenshotSlide $slide $intro $footer
}

function Enhance-Slide18($slide) {
  $intro = '本节重点：展示服务过程中的沟通留痕与积分激励，体现平台可沟通、可激励、可留痕的设计目标。'
  $footer = "演讲要点：`n• 订单级聊天：基于 Socket.io 实现消息即时推送，沟通记录与工单绑定便于追溯`n• 积分机制：服务完成与评价质量挂钩，积分商城促进志愿者持续参与`n• 管理端可结合聊天与积分数据进行服务质量分析与运营决策"
  Enhance-ScreenshotSlide $slide $intro $footer
}

function Enhance-Slide20($slide) {
  $intro = "本节说明：按 L（登录）、D（需求）、V（志愿者）、M（管理）四组用例覆盖关键业务链路；L1-L5 侧重注册与权限，D1-D5 侧重发布与跟踪，V1-V5 侧重接单与执行，M1-M5 侧重审核与实时通信。"
  Add-TextBox $slide $intro 64 98 1152 42 15 $script:Accent $false 1
  $improve = "待改进（后续优化方向）：`n• 增强老年用户操作引导与错误提示的友好性`n• 完善异常场景的说明文案与恢复路径`n• 统一三端界面细节与交互规范，提升整体一致性"
  Update-ShapeTextLike $slide "待改进" $improve 13 | Out-Null
}

function Enhance-Slide22($slide) {
  $t = "以下四项创新相互衔接，形成平台在协同治理、实时服务、激励参与与数据决策方面的组合能力："
  Add-TextBox $slide $t 64 98 1152 36 15 $script:Muted $false 1
}

function Enhance-Slide23($slide) {
  $t = "答辩收尾：在肯定现有成果的同时，客观说明不足并展望智能化、适老化与多社区扩展等后续研究方向。"
  Add-TextBox $slide $t 64 98 1152 36 15 $script:Muted $false 1
}

function Enhance-Slide25($slide) {
  $t = "课题总结：`n完成基于 Node.js + React 的社区智慧助老服务对接平台，实现老人/家属端、志愿者端、管理员端三端协同；`n覆盖需求发布、审核匹配、服务执行、实时沟通、评价反馈与积分激励等业务闭环。"
  Add-TextBox $slide $t 200 395 880 110 15 $script:Ink $false 2
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Open($src, $false, $false, $false)
$script:SlideW = $pres.PageSetup.SlideWidth
$script:SlideH = $pres.PageSetup.SlideHeight

$slideNums = @(2, 8, 15, 16, 18, 20, 22, 23, 25)
foreach ($num in $slideNums) {
  $slide = $pres.Slides.Item($num)
  switch ($num) {
    2 { Enhance-Slide2 $slide }
    8 { Enhance-Slide8 $slide }
    15 { Enhance-Slide15 $slide }
    16 { Enhance-Slide16 $slide }
    18 { Enhance-Slide18 $slide }
    20 { Enhance-Slide20 $slide }
    22 { Enhance-Slide22 $slide }
    23 { Enhance-Slide23 $slide }
    25 { Enhance-Slide25 $slide }
  }
  Write-Host "已处理第 $num 页"
}

$pres.Save()
$pres.Close()
$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
Write-Host "完成。已保存: $src"
