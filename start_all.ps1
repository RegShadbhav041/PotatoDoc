# PotatoDoc backend + quick tunnel launcher (safe to run repeatedly - skips what's already up)
# Usage: right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File start_all.ps1

$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$python = 'C:\Users\shadb\AppData\Local\Programs\Python\Python312\python.exe'
$backend = 'D:\PotatoBackend'
$tmp = "$env:LOCALAPPDATA\Temp\opencode"
$bf = "$env:TEMP\potatodoc-backend"
New-Item -ItemType Directory -Path $tmp, $bf -Force | Out-Null

# 1) uvicorn
$uv = Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like '*uvicorn*' }
if ($uv) { Write-Host "[ok] backend already running (PID $($uv.ProcessId))" }
else {
  Start-Process -FilePath $python -ArgumentList '-m','uvicorn','app:app','--host','127.0.0.1','--port','8000' `
    -WorkingDirectory $backend -WindowStyle Hidden `
    -RedirectStandardOutput "$bf\uvicorn.out" -RedirectStandardError "$bf\uvicorn.err"
  Start-Sleep -Seconds 5
  Write-Host "[ok] backend started (logs: $bf\uvicorn.out)"
}

# 2) named tunnel potatodoc (real hostname; needs NS delegation to work)
$nt = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" | Where-Object { $_.CommandLine -like '*run potatodoc*' }
if ($nt) { Write-Host "[ok] named tunnel already running (PID $($nt.ProcessId))" }
else {
  Start-Process -FilePath $cf -ArgumentList 'tunnel','--config','C:\ProgramData\cloudflared\config-potatodoc.yml','run','potatodoc' `
    -WindowStyle Hidden -RedirectStandardOutput "$tmp\tunnel_named.log" -RedirectStandardError "$tmp\tunnel_named.err"
  Write-Host "[ok] named tunnel started -> potatodoc.shadbhavregmi.com.np"
}

# 3) quick tunnel (works immediately, prints a NEW random URL each start)
$qt = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" | Where-Object { $_.CommandLine -like '*--url*' }
if ($qt) {
  Write-Host "[ok] quick tunnel already running (PID $($qt.ProcessId)) - reuse its URL from $tmp\qt_last.log"
} else {
  Remove-Item "$tmp\qt_last.log","$tmp\qt_last.err" -ErrorAction SilentlyContinue
  Start-Process -FilePath $cf -ArgumentList 'tunnel','--url','http://127.0.0.1:8000' `
    -WindowStyle Hidden -RedirectStandardOutput "$tmp\qt_last.log" -RedirectStandardError "$tmp\qt_last.err"
  $url = $null; $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline -and -not $url) {
    Start-Sleep -Seconds 3
    $m = Select-String -Path "$tmp\qt_last.err" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m) { $url = [regex]::Match($m.Line, 'https://[a-z0-9-]+\.trycloudflare\.com').Value }
  }
  if ($url) { Write-Host "[ok] quick tunnel URL: $url" } else { Write-Host "[!!] quick tunnel URL not found - check $tmp\qt_last.err" }
}

Write-Host ''
Write-Host "Local API:  http://127.0.0.1:8000/ping"
Write-Host "Real host:  https://potatodoc.shadbhavregmi.com.np  (works once NS delegated at registrar)"
