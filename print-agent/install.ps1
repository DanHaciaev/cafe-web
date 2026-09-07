# Registers the Cafe Print Agent to start automatically, hidden, whenever
# this Windows user logs in — so kitchen tickets keep printing without
# anyone having to remember to launch anything by hand.
#
# Run this ONCE on the till PC, from an elevated PowerShell prompt, after
# `npm install` has completed in this folder:
#   powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"
$agentDir = $PSScriptRoot
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
  Write-Error "Node.js not found in PATH. Install Node.js first: https://nodejs.org"
  exit 1
}

$taskName = "CafePrintAgent"
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "agent.js" -WorkingDirectory $agentDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null

Write-Host "Scheduled task '$taskName' registered. It will start at next login."
Write-Host "To start it right now: Start-ScheduledTask -TaskName '$taskName'"

Start-ScheduledTask -TaskName $taskName
Write-Host "Agent started. Check agent.log in this folder if printing doesn't work."
