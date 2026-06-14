param(
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyinstaller = Join-Path $root ".venv\Scripts\pyinstaller.exe"

Set-Location $root

if (!(Test-Path $pyinstaller)) {
  throw "PyInstaller is not installed in the local virtual environment."
}

& $pyinstaller --noconfirm --clean (Join-Path $root "build\ProperQRStudio.spec")