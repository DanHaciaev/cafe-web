# Cafe Print Agent — one-time setup, per till PC.
#
# Run this ONCE (double-click install.bat, which calls this with the right
# execution policy). It:
#   1. Copies cafe-print-agent.exe (+ config.json) into a permanent folder
#      under this Windows user's own profile.
#   2. Registers a Scheduled Task that starts the agent automatically, with
#      no visible window, every time this user logs in.
#   3. Starts it immediately, so printing works right away.
#
# After this, closing/reopening the browser or restarting the PC never
# requires touching this script again — the site auto-detects the agent on
# every print and silently falls back to the browser's print dialog if it's
# ever not running.

$ErrorActionPreference = 'Stop'

# Registering a Scheduled Task needs an elevated (Administrator) process even
# for a task that only runs under this same user's login. Re-launch ourselves
# elevated (one UAC prompt) instead of asking the operator to remember "Run
# as Administrator".
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  try {
    Start-Process powershell -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
  } catch {
    Write-Host ''
    Write-Host 'Установка требует подтверждения окна UAC (запрос прав администратора) — было отклонено или произошла ошибка.' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Нажмите Enter для выхода...' -ForegroundColor DarkGray
    Read-Host | Out-Null
  }
  exit
}

try {
  $installDir = Join-Path $env:LOCALAPPDATA 'CafePrintAgent'
  New-Item -ItemType Directory -Force -Path $installDir | Out-Null

  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

  # Accept either layout: exe directly beside install.ps1, or inside a "dist"
  # subfolder next to it (how the repo itself is organized: print-agent/dist/).
  $exeCandidates = @(
    (Join-Path $scriptDir 'cafe-print-agent.exe'),
    (Join-Path $scriptDir 'dist\cafe-print-agent.exe')
  )
  $exeSource = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exeSource) {
    throw "Не найден cafe-print-agent.exe рядом с install.ps1 (ни напрямую, ни в dist\). Запустите install.bat из той же папки, куда распакован агент."
  }
  $sourceDir = Split-Path -Parent $exeSource

  $configSource = Join-Path $sourceDir 'config.json'
  $configDest = Join-Path $installDir 'config.json'
  if ((Test-Path $configSource) -and -not (Test-Path $configDest)) {
    # Never overwrite an existing config.json on re-install — printer name
    # etc. may already be customized on this exact PC.
    Copy-Item -Path $configSource -Destination $configDest
  }

  function Wait-ProcessGone($name, $timeoutMs = 5000) {
    $deadline = (Get-Date).AddMilliseconds($timeoutMs)
    while ((Get-Date) -lt $deadline) {
      if (-not (Get-Process -Name $name -ErrorAction SilentlyContinue)) { return }
      Start-Sleep -Milliseconds 200
    }
  }

  function Copy-ItemWithRetry($src, $dst, [switch]$Recurse) {
    for ($i = 1; $i -le 5; $i++) {
      try { Copy-Item -Path $src -Destination $dst -Recurse:$Recurse -Force; return } catch {
        if ($i -eq 5) { throw }
        Start-Sleep -Milliseconds 500
      }
    }
  }

  # MAIB (Arcus2) needs its own bridge folder — bridge.py, arccom.dll and the
  # rest — sitting right next to the INSTALLED exe (maib.js resolves it via
  # the same configDir() as config.json, not the zip's own folder layout).
  # The 32-bit Python bridge process keeps arccom.dll/dialogs.dll/itpos.dll
  # loaded in memory while it's alive — copying over those files while it's
  # still running would fail with "file is used by another process", so it
  # has to be found and stopped first, by its own command line (there is no
  # PID tracked anywhere to kill it by).
  try {
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -and $_.CommandLine -like '*bridge.py*' } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Wait-ProcessGone 'python'
    Wait-ProcessGone 'pythonw'
  } catch { }

  $bridgeCandidates = @(
    (Join-Path $scriptDir 'maib-bridge'),
    (Join-Path $scriptDir 'dist\maib-bridge')
  )
  $bridgeSource = $bridgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($bridgeSource) {
    Copy-ItemWithRetry $bridgeSource (Join-Path $installDir 'maib-bridge') -Recurse
  }

  $exeDest = Join-Path $installDir 'cafe-print-agent.exe'
  $vbsDest = Join-Path $installDir 'run-hidden.vbs'
  $taskName = 'CafePrintAgent'

  # Stop any already-running copy first — avoids a "file in use" copy
  # failure on re-install, and two instances fighting over the same port.
  Get-Process -Name 'cafe-print-agent' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Wait-ProcessGone 'cafe-print-agent'
  Copy-ItemWithRetry $exeSource $exeDest

  # A .exe copied out of a browser-downloaded zip carries a "this came from
  # the internet" marker (Mark of the Web) that re-triggers a security
  # warning on every launch, including the hidden Scheduled Task one — with
  # nobody there to click through it, the agent would silently never start
  # after a reboot. Strip the marker from the installed copy.
  Unblock-File -Path $exeDest -ErrorAction SilentlyContinue

  # Point the Scheduled Task at a tiny VBScript launcher instead of the exe
  # directly — the task's own -Hidden setting only hides it from Task
  # Scheduler's list, it does nothing to the console window the exe itself
  # would otherwise pop up on screen at every login.
  $vbsContent = 'Set objShell = CreateObject("WScript.Shell")' + "`r`n" + ('objShell.Run """' + $exeDest + '""", 0, False')
  Set-Content -Path $vbsDest -Value $vbsContent -Encoding ASCII

  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbsDest + '"')
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

  Start-ScheduledTask -TaskName $taskName

  Write-Host ''
  Write-Host "Установлено — агент печати запущен и будет стартовать автоматически при каждом входе в Windows." -ForegroundColor Green
  Write-Host "Проверка: откройте http://127.0.0.1:47991/health в браузере — должно быть { ""ok"": true, ... }." -ForegroundColor Cyan
  Write-Host "Настройки (имя принтера и т.д.): $configDest" -ForegroundColor Cyan
  if ($bridgeSource) {
    Write-Host "Мост MAIB скопирован — для терминала MAIB нужен 32-битный Python (py -3-32), см. print-agent/README.md." -ForegroundColor Cyan
  }
} catch {
  Write-Host ''
  Write-Host "ОШИБКА установки:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ''
Write-Host 'Нажмите Enter, чтобы закрыть...' -ForegroundColor DarkGray
Read-Host | Out-Null
