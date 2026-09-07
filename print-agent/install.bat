@echo off
REM Cafe Print Agent — double-click this file to install.
REM
REM install.ps1 alone can fail silently on a fresh Windows PC: PowerShell's
REM default "script execution is disabled" policy blocks a .ps1 from running
REM at all, and the window can close before anyone reads why. This .bat has
REM no such restriction, and explicitly bypasses the policy just for this
REM one script, only in this one process.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
