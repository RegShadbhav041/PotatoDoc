# Emulator UI varied-test driver: pushes one image per cycle, drives the app through
# Gallery -> predict -> uiautomator parse, SAVES each result to History, records JSONL,
# extra model switches on a subset, then writes emulator_ui_report.md + errors.log entries.
# Usage:
#   powershell -File emulator_ui_driver.ps1 -Max 2          # validation run (first 2 cycles)
#   powershell -File emulator_ui_driver.ps1 -Skip 2         # full run from cycle 3
#   powershell -File emulator_ui_driver.ps1                # full run from start
param(
  [string]$Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
  [string]$Set = 'D:\Potato\reports\emulator_set',
  [string]$OutJsonl = 'D:\Potato\reports\emulator_ui_results.jsonl',
  [string]$LogPath = 'D:\Potato\reports\emulator_ui_driver.log',
  [string]$ErrLog = 'D:\Potato\reports\errors.log',
  [string]$ReportPath = 'D:\Potato\test.md',
  [string]$Scratch = "$env:TEMP\opencode\uidrv",
  [int]$Skip = 0,
  [int]$Max = 0,
  [int[]]$ModelSubset = @(11, 3, 6, 22, 27, 18, 26, 34)
)
$ErrorActionPreference = 'Stop'
$Dev = 'emulator-5554'
New-Item -ItemType Directory -Force -Path $Scratch | Out-Null

$AllModelNames = @(
  'Ensemble (All Models)', 'Small CNN (from scratch)',
  'MobileNetV2 (transfer)', 'EfficientNet-B0 (transfer)')
$NameToId = @{
  'Ensemble (All Models)'      = 'ensemble'
  'Small CNN (from scratch)'   = 'small_cnn'
  'MobileNetV2 (transfer)'     = 'mobilenetv2'
  'EfficientNet-B0 (transfer)' = 'efficientnetb0'
}
$SwitchOrder = @(
  'Small CNN (from scratch)', 'MobileNetV2 (transfer)', 'EfficientNet-B0 (transfer)')

function Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}
function Err([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Add-Content -LiteralPath $ErrLog -Value $line -Encoding UTF8
}
function Sh([string]$cmd) { & $Adb -s $Dev shell $cmd | Out-Null }
function ShOut([string]$cmd) { & $Adb -s $Dev shell $cmd | Out-String }
function Ensure-Reverses {
  & $Adb -s $Dev reverse tcp:8081 tcp:8081 | Out-Null
  & $Adb -s $Dev reverse tcp:8000 tcp:8000 | Out-Null
}

function Dump([string]$name = 'ui.xml') {
  $p = Join-Path $Scratch $name
  foreach ($try in 1..3) {
    Sh "rm -f /sdcard/uidrv.xml"
    & $Adb -s $Dev shell uiautomator dump /sdcard/uidrv.xml | Out-Null
    $exists = ShOut 'ls /sdcard/uidrv.xml'
    if ($exists -match 'uidrv\.xml') {
      Remove-Item -LiteralPath $p -ErrorAction SilentlyContinue
      & $Adb -s $Dev pull /sdcard/uidrv.xml $p | Out-Null
      if (Test-Path $p) {
        $xml = Get-Content -LiteralPath $p -Raw -Encoding UTF8
        if ($xml -match '<hierarchy') {
          # recovery: notification shade or foreign dialog stole the screen
          $shade = ($xml -match 'package="com\.android\.systemui"' -and
                    ($xml -match 'Display brightness' -or $xml -match 'Internet' -or $xml -match 'Flashlight'))
          if ($shade) {
            Sh 'cmd statusbar collapse'
            Start-Sleep -Milliseconds 800
            continue
          }
          if ($xml -notmatch 'package="host\.exp\.exponent"' -and $xml -notmatch 'providers\.media\.module') {
            # foreign window: launcher / ANR dialog / other app stole focus
            $focus = ShOut 'dumpsys window'
            if ($focus -match 'Not Responding: ([A-Za-z0-9\._]+)') {
              Sh "am force-stop $($Matches[1])"
              Sh 'cmd statusbar collapse'
              Start-Sleep -Seconds 1
              continue
            }
            if ($focus -match 'NexusLauncher|mCurrentFocus=Window\{[^}]*launcher') {
              Sh 'am force-stop host.exp.exponent'
              Start-Sleep -Seconds 2
              Sh 'am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"' | Out-Null
              Start-Sleep -Seconds 12
              Ensure-Reverses
              continue
            }
            Sh 'input keyevent 4'
            Start-Sleep -Seconds 1
            continue
          }
          return $xml
        }
      }
    }
    Start-Sleep -Seconds 1
  }
  return $null
}

function Find-Nodes([string]$xml, [string]$rx) {
  $out = @()
  foreach ($m in [regex]::Matches($xml, $rx)) {
    $out += [pscustomobject]@{ Text = $m.Groups[1].Value; Bounds = $m.Groups[2].Value }
  }
  return $out
}
function B-Parts([string]$b) {
  $m = [regex]::Match($b, '\[(\d+),(\d+)\]\[(\d+),(\d+)\]')
  if (-not $m.Success) { return $null }
  return @{ x1 = [int]$m.Groups[1].Value; y1 = [int]$m.Groups[2].Value
            x2 = [int]$m.Groups[3].Value; y2 = [int]$m.Groups[4].Value }
}
function Tap-B([string]$b) {
  $p = B-Parts $b
  if (-not $p) { return $false }
  $cx = [int](($p.x1 + $p.x2) / 2); $cy = [int](($p.y1 + $p.y2) / 2)
  Sh "input tap $cx $cy"
  return $true
}
# start y400 (NOT y300): y300 + fast flick occasionally opens the notification shade
function To-Top { 1..6 | ForEach-Object { Sh 'input swipe 540 400 540 2200 200'; Start-Sleep -Milliseconds 320 } }
# Result pages are ~10-14k px tall (disease info + gradcam); fixed 5 swipes only reach
# mid-page. Swipe until above-tab-bar content stops changing (bottom reached), max 12.
function Get-BottomFp([string]$xml) {
  if (-not $xml) { return $null }
  $ts = @()
  foreach ($m in [regex]::Matches($xml, 'text="([^"]+)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"')) {
    if ([int]$m.Groups[5].Value -lt 2240 -and $m.Groups[1].Value -ne '') { $ts += $m.Groups[1].Value }
  }
  if ($ts.Count -lt 2) { return $null }
  return "$($ts[0])|$($ts[$ts.Count-1])|$($ts.Count)"
}
function To-Bottom {
  $prev = $null
  foreach ($i in 1..12) {
    Sh 'input swipe 540 1900 540 500 200'
    Start-Sleep -Milliseconds 320
    if (($i % 3) -eq 0) {
      $fp = Get-BottomFp (Dump 'tob.xml')
      if ($fp -and $fp -eq $prev) { break }
      if ($fp) { $prev = $fp }
    }
  }
}
function Back-Key { Sh 'input keyevent 4'; Start-Sleep -Seconds 2 }

function Get-Result([string]$xml) {
  $r = @{ class = $null; conf = $null; unknown = $false; model = $null; status = 'none' }
  if ($xml -match 'Max confidence: ([\d.]+)%') {
    $r.unknown = $true; $r.class = 'Unknown'; $r.conf = [double]$Matches[1]; $r.status = 'ok'
  }
  elseif ($xml -match 'text="Confidence ([\d.]+)%[^"]*"\s[^>]*bounds="\[(\d+),(\d+)\]') {
    $r.conf = [double]$Matches[1]; $cy = [int]$Matches[3]
    foreach ($c in @('Early Blight', 'Late Blight', 'Healthy')) {
      foreach ($n in (Find-Nodes $xml ('text="(' + [regex]::Escape($c) + ')"[^>]*bounds="(\[[^"]+\])"'))) {
        $p = B-Parts $n.Bounds
        if ($p -and [math]::Abs($p.y1 - $cy) -le 8) { $r.class = $c; $r.status = 'ok'; break }
      }
      if ($r.class) { break }
    }
    if (-not $r.class) { $r.status = 'conf-no-class' }
  }
  if ($xml -match 'text="(Model: [^"]+)"') { $r.model = $Matches[1] }
  return $r
}

# Paged top-to-bottom scan: result renders at top of page; known-class pages are LONG
# (disease info below result), so a single To-Bottom parks BELOW the Confidence row.
function Wait-Result([int]$Timeout = 90, [string]$Tag = 'x', [string]$ExpectModel = 'Ensemble (All Models)') {
  Start-Sleep -Seconds 4
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $last = $null
  foreach ($pass in 1..3) {
    To-Top
    foreach ($step in 1..5) {
      if ($sw.Elapsed.TotalSeconds -gt $Timeout) { break }
      $xml = Dump 'wait.xml'
      if ($xml) {
        $r = Get-Result $xml
        if ($r.status -eq 'ok') {
          if ($r.unknown) { return $r }
          if ($r.model -eq "Model: $ExpectModel") { return $r }
          Log ("  [scan] stale result ignored ({0}, conf={1})" -f $r.model, $r.conf)
          $last = $null
        }
        elseif ($r.status -eq 'conf-no-class') { $last = $r }
      }
      if ($step -lt 5) { Sh 'input swipe 540 1900 540 500 250'; Start-Sleep -Milliseconds 500 }
    }
    if ($sw.Elapsed.TotalSeconds -gt $Timeout) { break }
  }
  Save-Dump "timeout_$Tag.xml"
  Err "Wait-Result timeout tag=$Tag expect=$ExpectModel"
  if ($last -and $last.status -eq 'conf-no-class') { return $last }
  return @{ class = $null; conf = $null; unknown = $false; model = $null; status = 'timeout' }
}
function Save-Dump([string]$name) {
  $p = Join-Path $Scratch $name
  Sh 'rm -f /sdcard/uidrv.xml'
  & $Adb -s $Dev shell uiautomator dump /sdcard/uidrv.xml | Out-Null
  & $Adb -s $Dev pull /sdcard/uidrv.xml $p | Out-Null
}

# Save result to History (Unknown results are not saveable by app design -> $null).
function Do-Save([string]$cls) {
  if (-not $cls -or $cls -eq 'Unknown') { return $null }
  $found = $false
  # page keeps growing right after predict (Grad-CAM + disease info arrive async);
  # settle first, then scan bottom repeatedly - a single early To-Bottom lands mid-growth
  Start-Sleep -Seconds 2
  foreach ($pos in @('bottom', 'top', 'mid', 'bottom', 'bottom')) {
    switch ($pos) {
      'bottom' { To-Bottom }
      'top'    { To-Top }
      'mid'    { Sh 'input swipe 540 400 540 2000 250'; Start-Sleep -Milliseconds 500 }
    }
    $xml = Dump 'saveloc.xml'
    if (-not $xml) { continue }
    $b = [regex]::Match($xml, 'text="Save to History"[^>]*bounds="(\[[^"]+\])"')
    if ($b.Success) {
      $null = Tap-B $b.Groups[1].Value
      # Saved! can take a while under JS load (gradcam/AsyncStorage) -> poll up to 12s
      $ok = $false
      foreach ($p in 1..8) {
        Start-Sleep -Milliseconds 1500
        $vxml = Dump 'savev.xml'
        if ($vxml -and $vxml -match 'text="Saved!"') { $ok = $true; break }
        if ($p -eq 4) {
          # first tap may have been swallowed -> re-tap if button still says Save to History
          $v2 = Dump 'saveloc2.xml'
          if ($v2) {
            $b2 = [regex]::Match($v2, 'text="Save to History"[^>]*bounds="(\[[^"]+\])"')
            if ($b2.Success) { $null = Tap-B $b2.Groups[1].Value }
          }
        }
      }
      if ($ok) { $found = $true; break }
      Err "save: tap registered but no Saved! confirmation cls=$cls"
      $found = $false; break
    }
  }
  if ($found) { return $true }
  Err "save: Save-to-History button not found cls=$cls"
  return $false
}

function Enter-Diagnose {
  $xml = Dump 'nav.xml'
  if (-not $xml) { return $false }
  if ($xml -match 'content-desc="[^"]*Gallery[^"]*"') { return $true }
  foreach ($m in [regex]::Matches($xml, 'text="Diagnose"[^>]*bounds="(\[[^"]+\])"')) {
    $p = B-Parts $m.Groups[1].Value
    if ($p.y1 -gt 2100) { $null = Tap-B $m.Groups[1].Value; Start-Sleep -Seconds 3; break }
  }
  $xml = Dump 'nav2.xml'
  return ($xml -and ($xml -match 'content-desc="[^"]*Gallery[^"]*"'))
}

function Close-Menu {
  $xml = Dump 'menuchk.xml'
  if ($xml -and $xml -match 'menu-item-title') { Sh 'input keyevent 4'; Start-Sleep -Seconds 1.5; return $true }
  return $false
}

function Ensure-Clean {
  foreach ($i in 1..4) {
    [void](Close-Menu)
    $xml = Dump 'clean.xml'
    if (-not $xml) { continue }
    $isResult = ($xml -match 'Prediction Result' -or $xml -match 'Confidence [\d.]+%' -or $xml -match 'Max confidence:' -or $xml -match 'text="Next Image"')
    if (-not $isResult -and $xml -match 'content-desc="[^"]*Gallery[^"]*"') { return $true }
    # result page: Next Image may be below current fold (post-save we are parked at bottom)
    $n = [regex]::Match($xml, 'text="Next Image"[^>]*bounds="(\[[^"]+\])"')
    if (-not $n.Success) {
      To-Bottom
      $b = Dump 'cleanb.xml'
      if ($b) { $n = [regex]::Match($b, 'text="Next Image"[^>]*bounds="(\[[^"]+\])"') }
    }
    if ($n.Success) {
      $null = Tap-B $n.Groups[1].Value
      Start-Sleep -Seconds 1.5
      To-Top
      foreach ($v in 1..6) {
        $c = Dump 'clearchk.xml'
        if ($c -and ($c -match 'content-desc="[^"]*Gallery[^"]*"') -and
            ($c -notmatch 'Confidence [\d.]+%') -and ($c -notmatch 'Max confidence:') -and
            ($c -notmatch 'text="Next Image"')) { break }
        Start-Sleep -Seconds 1
      }
      continue
    }
    # neither Next Image nor gallery: top-of-page empty-state check
    To-Top
    $t = Dump 'cleantop.xml'
    if ($t -and ($t -match 'content-desc="[^"]*Gallery[^"]*"') -and ($t -notmatch 'text="Next Image"') -and ($t -notmatch 'Confidence [\d.]+%')) { return $true }
    if ($i -eq 3) {
      # tab-remount: Diagnose focus resets screen state (empty Gallery state)
      Sh 'input tap 107 2345'; Start-Sleep -Seconds 1.5   # Home
      Sh 'input tap 324 2345'; Start-Sleep -Seconds 3      # Diagnose -> focus reset
      continue
    }
    if ($i -ge 4) {
      # wedged (tabs unresponsive / hung request): cold-reload the JS bundle (full state reset)
      Log '  Ensure-Clean: force-reloading Expo Go...'
      Err 'ensure-clean: force-reload (wedged state)'
      Sh 'am force-stop host.exp.exponent'
      Start-Sleep -Seconds 2
      Sh 'am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"' | Out-Null
      Start-Sleep -Seconds 12
      Ensure-Reverses
      To-Top
    }
  }
  $xml = Dump 'cleanfinal.xml'
  return ($xml -and ($xml -match 'content-desc="[^"]*Gallery[^"]*"') -and ($xml -notmatch 'text="Next Image"') -and ($xml -notmatch 'Confidence [\d.]+%'))
}

function Open-Picker {
  [void](Close-Menu)
  To-Top
  $xml = Dump 'prepick.xml'
  $g = [regex]::Match($xml, 'content-desc="[^"]*Gallery[^"]*"[^>]*bounds="(\[[^"]+\])"')
  if (-not $g.Success) {
    To-Top
    $xml = Dump 'prepick2.xml'
    $g = [regex]::Match($xml, 'content-desc="[^"]*Gallery[^"]*"[^>]*bounds="(\[[^"]+\])"')
  }
  if (-not $g.Success) { return $false }
  $null = Tap-B $g.Groups[1].Value
  Start-Sleep -Seconds 5
  foreach ($try in 1..3) {
    # settle: wait for stable thumbnail grid (item insertion shifts layout)
    $prev = ''; $xml = $null; $thumb = $null
    foreach ($s in 1..6) {
      $xml = Dump 'picker.xml'
      if (-not $xml) { Start-Sleep -Seconds 1; continue }
      $pkgs = [regex]::Matches($xml, 'package="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
      $alien = $pkgs | Where-Object { $_ -ne 'host.exp.exponent' -and $_ -ne 'com.google.android.providers.media.module' }
      if ($alien -match 'permission') {
        $a = [regex]::Match($xml, 'text="[^"]*(Allow|ALLOW|While using|Just once|OK)[^"]*"[^>]*bounds="(\[[^"]+\])"')
        if ($a.Success) { $null = Tap-B $a.Groups[2].Value; Start-Sleep -Seconds 3 }
        break
      }
      if ($alien) { Back-Key; break }
      $thumb = [regex]::Match($xml, 'resource-id="com\.google\.android\.providers\.media\.module:id/icon_thumbnail"[^>]*bounds="(\[[^"]+\])"')
      if ($thumb.Success) {
        if ($thumb.Groups[1].Value -eq $prev -and $s -ge 3) { break }
        $prev = $thumb.Groups[1].Value
      }
      Start-Sleep -Seconds 1
    }
    if (-not $thumb -or -not $thumb.Success) { Start-Sleep -Seconds 2; continue }
    $null = Tap-B $thumb.Groups[1].Value
    Start-Sleep -Seconds 3
    # verify selection closed the picker; retry tap if not
    $vxml = Dump 'pickv.xml'
    if ($vxml -and $vxml -notmatch 'icon_thumbnail') { return $true }
    Log '  picker still open after tap, retrying...'
  }
  return $false
}

function Select-Model([string]$Name) {
  foreach ($guard in 1..2) {
    To-Top
    [void](Close-Menu)
    To-Top
    $xml = Dump 'menubtn.xml'
    if (-not $xml) { continue }
    # wrong-tab guard: if we ended up on History (or chip missing), tap the Diagnose tab
    if ($xml -notmatch 'resource-id="button-text"' -or $xml -match '>Clear<') {
      foreach ($m in [regex]::Matches($xml, 'text="Diagnose"[^>]*bounds="(\[[^"]+\])"')) {
        $p = B-Parts $m.Groups[1].Value
        if ($p -and $p.y1 -gt 2100) { $null = Tap-B $m.Groups[1].Value; Start-Sleep -Seconds 2.5; break }
      }
      $xml = Dump 'menubtn.xml'
      if (-not $xml) { continue }
    }
    # already selected?
    if ($xml -match ('text="' + [regex]::Escape($Name) + '" resource-id="button-text"')) { return $true }
    foreach ($try in 1..3) {
      # re-dump and re-acquire chip bounds right before every tap (layout can shift async)
      $xml = Dump 'menubtn.xml'
      if (-not $xml) { continue }
      $bm = [regex]::Match($xml, 'resource-id="button-text"[^>]*bounds="(\[[^"]+\])"')
      if (-not $bm.Success) { break }
      $btn = $bm.Groups[1].Value
      $null = Tap-B $btn
      Start-Sleep -Seconds 1.5
      $xml = Dump 'menuopen.xml'
      if (-not $xml) { continue }
      # menu did not open (stale tap / swallowed) -> loop retries with fresh bounds
      if ($xml -notmatch 'menu-item-title') { continue }
      # menu items are the unique nodes with resource-id="menu-item-title"
      $it = [regex]::Match($xml, ('text="' + [regex]::Escape($Name) + '" resource-id="menu-item-title"[^>]*bounds="(\[[^"]+\])"'))
      if ($it.Success) {
        $null = Tap-B $it.Groups[1].Value
        Start-Sleep -Seconds 2
        # verify the button label actually changed (tap could be swallowed by overlay)
        $v = Dump 'selver.xml'
        if ($v -and $v -match ('text="' + [regex]::Escape($Name) + '" resource-id="button-text"')) { return $true }
        # not applied yet or tap swallowed: close menu (if any) and retry with fresh dumps
        $v2 = Dump 'selver2.xml'
        if ($v2 -and $v2 -match 'menu-item-title') { Sh 'input keyevent 4'; Start-Sleep -Seconds 1 }
        continue
      }
      # menu open but target absent -> close and retry
      Sh 'input keyevent 4'; Start-Sleep -Seconds 1
    }
  }
  Log "  MENU: item '$Name' not found"
  Err "menu: item '$Name' not found or selection not applied"
  return $false
}

function Write-Row([object]$row) {
  $json = $row | ConvertTo-Json -Compress -Depth 6
  Add-Content -LiteralPath $OutJsonl -Value $json -Encoding UTF8
}

# ---------------- main ----------------
Ensure-Reverses
$manifest = Get-Content -LiteralPath (Join-Path $Set 'manifest.json') -Raw | ConvertFrom-Json
$first = $manifest | Where-Object { $_.push_name -like '11_*' }
$rest = $manifest | Where-Object { $_.push_name -notlike '11_*' }
$order = @($first) + @($rest)
if ($Skip -gt 0) { $order = $order | Select-Object -Skip $Skip }
if ($Max -gt 0) { $order = $order | Select-Object -First $Max }

Log "=== driver start: $($order.Count) cycles (skip=$Skip max=$Max) ==="
# Ensure app is foreground, then tab-remount Diagnose (recovers from wedged states:
# hung predict/gradcam leaves buttons hidden and Enter-Diagnose would fail)
Sh 'am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"' | Out-Null
Sh 'input tap 107 2345'; Start-Sleep -Seconds 2      # Home tab
Sh 'input tap 324 2345'; Start-Sleep -Seconds 3      # Diagnose tab -> fresh mount -> wakeUp
# wait for bundle load (metro can take 10-30s on cold start) instead of fixed sleep
$ready = $false
foreach ($w in 1..30) {
  if (($w % 5) -eq 0) { To-Top }  # parked at page bottom hides Gallery from dumps
  Start-Sleep -Seconds 3
  $wx = Dump 'bootwait.xml'
  if ($wx -and ($wx -match 'content-desc="[^"]*Gallery[^"]*"')) { $ready = $true; break }
}
if (-not $ready) { Log 'FATAL: app did not reach ready state'; Err 'FATAL: app did not reach ready state'; exit 1 }
if (-not (Enter-Diagnose)) { Log 'FATAL: cannot reach Diagnose screen'; Err 'FATAL: cannot reach Diagnose screen'; exit 1 }
To-Top

# useWakeUp re-ran on remount: banner clears, warmup probe loads models.
$ready = $false
foreach ($w in 1..6) {
  $xml = Dump 'wake.xml'
  if ($xml -and $xml -match 'text="Ready"') { $ready = $true; break }
  Start-Sleep -Seconds 5
}
Log "warmup ready=$ready"

$curModel = 'Ensemble (All Models)'
$cycle = $Skip
$hardFails = 0
$savedTotal = 0
$savedSkipped = 0

foreach ($m in $order) {
  $cycle++
  Ensure-Reverses
  $nn = 0
  if ($m.push_name -match '^(\d+)_') { $nn = [int]$Matches[1] }
  $api = $m.api_truth
  Log "--- cycle $cycle $($m.push_name) exp=$($m.expected -join '|') apiEns=$($api.ensemble.pred) ---"

  if (-not (Ensure-Clean)) {
    Log '  FATAL: cannot get clean picker-ready state'
    Err "cycle $cycle $($m.push_name): cannot get clean picker-ready state"
    $hardFails++
    if ($hardFails -ge 2) { Log 'aborting (2 hard fails)'; Err 'FATAL: aborting (2 hard fails)'; exit 2 }
    continue
  }
  # push image (newest-first guaranteed by touch)
  $local = Join-Path $Set $m.push_name
  & $Adb -s $Dev push $local $m.push_path | Out-Null
  Sh "touch $($m.push_path)"
  Sh "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://$($m.push_path)"
  Start-Sleep -Seconds 4

  if (-not (Open-Picker)) {
    Log '  FATAL: picker did not open / no thumbnail'
    $xml = Dump 'fail_picker.xml'
    Err "cycle $cycle $($m.push_name): picker did not open / no thumbnail"
    $hardFails++
    if ($hardFails -ge 2) { Log 'aborting (2 hard fails)'; Err 'FATAL: aborting (2 hard fails)'; exit 2 }
    continue
  }
  $hardFails = 0

  $res = Wait-Result 120 "$($m.push_name)_ens" $curModel
  $apiU = $api.ensemble
  $uiMatch = $false
  if ($res.class -and $apiU) {
    $uiMatch = ($res.class -eq $apiU.pred -and [math]::Abs(($res.conf / 100.0) - $apiU.conf) -lt 0.03 -and
                ($res.unknown -eq $apiU.is_unknown))
  }
  $sv = Do-Save $res.class
  if ($sv) { $savedTotal++ } elseif ($null -eq $sv) { $savedSkipped++ }
  Log ("  [ensemble] -> {0} conf={1} status={2} ui==api:{3} saved={4}" -f $res.class, $res.conf, $res.status, $uiMatch, $sv)
  if ($res.status -ne 'ok') { Err "cycle $cycle $($m.push_name) ensemble: status=$($res.status)" }
  if ($uiMatch -eq $false -and $res.status -eq 'ok') { Err "cycle $cycle $($m.push_name) ensemble: ui!=api ui=$($res.class)@$($res.conf) api=$($apiU.pred)@$(($apiU.conf)*100)" }
  Write-Row ([ordered]@{
    idx = $nn; file = $m.push_name; native = $m.native; source = $m.source
    expected = $m.expected; model = 'ensemble'; ui_name = $curModel
    ui_class = $res.class; ui_conf = $res.conf; ui_unknown = $res.unknown
    ui_model_line = $res.model; status = $res.status; ui_matches_api = $uiMatch
    saved = $sv
    image_path = $local; device_path = $m.push_path
    api_pred = $apiU.pred; api_conf = $apiU.conf; api_unknown = $apiU.is_unknown })

  if ($ModelSubset -contains $nn) {
    foreach ($swName in $SwitchOrder) {
      if (-not (Select-Model $swName)) {
        Write-Row ([ordered]@{
          idx = $nn; file = $m.push_name; native = $m.native; model = $NameToId[$swName]
          ui_name = $swName; status = 'menu_fail'; saved = $null
          image_path = $local; device_path = $m.push_path })
        continue
      }
      $curModel = $swName
      $res = Wait-Result 120 "$($m.push_name)_$($NameToId[$swName])" $swName
      $prop = $NameToId[$swName]
      $apiM = $api.$prop
      $uiMatch = $false
      if ($res.class -and $apiM) {
        $uiMatch = ($res.class -eq $apiM.pred -and [math]::Abs(($res.conf / 100.0) - $apiM.conf) -lt 0.03 -and
                    ($res.unknown -eq $apiM.is_unknown))
      }
      $sv = Do-Save $res.class
      if ($sv) { $savedTotal++ } elseif ($null -eq $sv) { $savedSkipped++ }
      Log ("  [{0}] -> {1} conf={2} status={3} ui==api:{4} saved={5}" -f $NameToId[$swName], $res.class, $res.conf, $res.status, $uiMatch, $sv)
      if ($res.status -ne 'ok') { Err "cycle $cycle $($m.push_name) $($NameToId[$swName]): status=$($res.status)" }
      if ($uiMatch -eq $false -and $res.status -eq 'ok') { Err "cycle $cycle $($m.push_name) $($NameToId[$swName]): ui!=api ui=$($res.class)@$($res.conf) api=$($apiM.pred)@$(($apiM.conf)*100)" }
      Write-Row ([ordered]@{
        idx = $nn; file = $m.push_name; native = $m.native; source = $m.source
        expected = $m.expected; model = $NameToId[$swName]; ui_name = $swName
        ui_class = $res.class; ui_conf = $res.conf; ui_unknown = $res.unknown
        ui_model_line = $res.model; status = $res.status; ui_matches_api = $uiMatch
        saved = $sv
        image_path = $local; device_path = $m.push_path
        api_pred = $apiM.pred; api_conf = $apiM.conf; api_unknown = $apiM.is_unknown })
    }
    # return to ensemble for the next cycle (keeps curModel honest)
    if (-not (Select-Model 'Ensemble (All Models)')) { Log '  WARN: could not switch back to ensemble'; Err 'warn: could not switch back to ensemble' }
    else { $curModel = 'Ensemble (All Models)' }
  }
}

Log '=== driver finished, verifying History + writing report ==='

# History sanity check: scroll top->bottom collecting unique date-stamped cards
$histCount = -1
try {
  Sh 'input tap 540 2345'
  Start-Sleep -Seconds 2.5
  $dates = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($r in 1..3) { Sh 'input swipe 540 700 540 2250 300'; Start-Sleep -Milliseconds 600 }   # back to top
  $prev = -1
  for ($swp = 0; $swp -lt 14; $swp++) {
    $hxml = Dump "histend$swp.xml"
    if ($hxml) {
      foreach ($mm in [regex]::Matches($hxml, 'text="(\d+/\d+/\d+,[^"]+)"')) { [void]$dates.Add($mm.Groups[1].Value) }
    }
    $cur = $dates.Count
    if ($swp -gt 0 -and $cur -eq $prev) { break }     # no new entries -> bottom reached
    $prev = $cur
    Sh 'input swipe 540 1900 540 450 350'
    Start-Sleep -Milliseconds 800
  }
  $histCount = $dates.Count
  Log "history entries visible: $histCount (saved this run: $savedTotal, unknown-skipped: $savedSkipped)"
  if ($histCount -ge 0 -and $histCount -lt $savedTotal) {
    Err "history: visible=$histCount < saved this run=$savedTotal"
  }
} catch { Err "history check failed: $($_.Exception.Message)" }

# Pull app-side errors from metro log
$metroLog = 'D:\Potato\mobile\expo_metro2.log'
$metroErrCount = 0
try {
  if (Test-Path $metroLog) {
    $merrs = @(Select-String -LiteralPath $metroLog -Pattern 'predict failed|gradcam failed|GET /models failed|upload failed' | Select-Object -Last 30)
    $metroErrCount = $merrs.Count
    foreach ($e in $merrs) { Err ("metro: " + $e.Line.Trim()) }
    Log "metro error lines: $metroErrCount"
  }
} catch { Err "metro log scan failed: $($_.Exception.Message)" }

# Build report
$rows = @()
if (Test-Path $OutJsonl) {
  $rows = @(Get-Content -LiteralPath $OutJsonl -Encoding UTF8 | Where-Object { $_ -and $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
}
$ok     = @($rows | Where-Object { $_.status -eq 'ok' })
$bad    = @($rows | Where-Object { $_.status -ne 'ok' })
$mism   = @($ok | Where-Object { $_.ui_matches_api -eq $false })
$saved  = @($rows | Where-Object { $_.saved -eq $true })
$byStatus = @{}
foreach ($r in $rows) { $k = [string]$r.status; if (-not $byStatus.ContainsKey($k)) { $byStatus[$k] = 0 }; $byStatus[$k]++ }

$rep = @()
$rep += '# PotatoDoc emulator UI test report'
$rep += ''
$rep += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$rep += ''
$rep += '## Summary'
$rep += ''
$rep += "- rows: $($rows.Count)  (ok=$($ok.Count), failed=$($bad.Count), ui!=api=$($mism.Count), saved=$($saved.Count))"
$rep += "- history entries visible at end: $histCount (rows with saved=true: $($saved.Count))"
$rep += "- metro-side error lines: $metroErrCount"
$rep += "- per-status: " + (($byStatus.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join ', ')
$rep += ''
$rep += '## Failed rows (status != ok)'
$rep += ''
if ($bad.Count -eq 0) { $rep += '- none' } else {
  foreach ($r in $bad) { $rep += "- ``$($r.image_path)`` ($($r.file)) model=$($r.model) status=$($r.status)" }
}
$rep += ''
$rep += '## UI vs API mismatches (uiautomator result disagrees with API truth)'
$rep += ''
if ($mism.Count -eq 0) { $rep += '- none (all OK rows matched API truth within 3% conf)' } else {
  foreach ($r in $mism) { $rep += "- ``$($r.image_path)`` $($r.model): ui=$($r.ui_class)@$($r.ui_conf)% api=$($r.api_pred)@$([math]::Round(($r.api_conf*100),2))%" }
}
$rep += ''
$rep += '## Full rows'
$rep += ''
$rep += '| image_path | model | expected | ui_class | ui_conf | status | saved | ui==api |'
$rep += '|---|---|---|---|---|---|---|---|'
foreach ($r in $rows) {
  $exp = ($r.expected -join '+')
  $rep += "| $($r.image_path) | $($r.model) | $exp | $($r.ui_class) | $($r.ui_conf) | $($r.status) | $($r.saved) | $($r.ui_matches_api) |"
}
$rep += ''
$rep += '## Error log'
$rep += ''
$rep += 'All errors/incidents this session: ``D:\Potato\reports\errors.log``'
$rep += ''
$rep += '## API-only reference reports'
$rep += ''
$rep += '- ``reports/varied_eval_report.md`` (221 imgs x 4 models)'
$rep += '- ``reports/varied_eval_analysis.md`` (P0/P1/P2 failure enlistment)'
$rep += '- ``reports/varied_eval_results.json`` (raw)'
Set-Content -LiteralPath $ReportPath -Value ($rep -join "`r`n") -Encoding UTF8
Log "report written: $ReportPath"
Log "rows=$($rows.Count) ok=$($ok.Count) failed=$($bad.Count) mism=$($mism.Count) saved=$($saved.Count) history=$histCount"
