# Start local Whisper (listening, port 2022) and Kokoro (speaking, port 8880) for VoiceMode on Windows.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File voice_up.ps1 [-Stop]
# Idempotent: skips any service that already answers. Both bind to 127.0.0.1 only.
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$base = Join-Path $HOME '.voicemode\services'
$logs = Join-Path $HOME '.voicemode\logs'; New-Item -ItemType Directory -Force $logs | Out-Null

if ($Stop) {
  Get-Process whisper-server -ErrorAction SilentlyContinue | Stop-Process -Force
  Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like '*api.src.main:app*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  'stopped'; exit 0
}

function Up($url) { try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 | Out-Null; $true } catch { $false } }

if (-not (Up 'http://127.0.0.1:2022/health')) {
  $w = Join-Path $base 'whisper\Release'
  Start-Process -WindowStyle Hidden -WorkingDirectory $w -FilePath (Join-Path $w 'whisper-server.exe') `
    -ArgumentList '--host','127.0.0.1','--port','2022','--model','..\models\ggml-small.en.bin','--threads','6','--inference-path','/v1/audio/transcriptions' `
    -RedirectStandardError (Join-Path $logs 'whisper.err.log') -RedirectStandardOutput (Join-Path $logs 'whisper.log')
}

if (-not (Up 'http://127.0.0.1:8880/v1/models')) {
  $k = Join-Path $base 'kokoro'
  $env:PHONEMIZER_ESPEAK_LIBRARY = 'C:\Program Files\eSpeak NG\libespeak-ng.dll'
  $env:PYTHONUTF8 = '1'; $env:PROJECT_ROOT = $k; $env:USE_GPU = 'false'; $env:USE_ONNX = 'false'
  $env:PYTHONPATH = "$k;$k\api"; $env:MODEL_DIR = 'src/models'; $env:VOICES_DIR = 'src/voices/v1_0'; $env:WEB_PLAYER_PATH = "$k\web"
  Start-Process -WindowStyle Hidden -WorkingDirectory $k -FilePath (Join-Path $k '.venv\Scripts\python.exe') `
    -ArgumentList '-m','uvicorn','api.src.main:app','--host','127.0.0.1','--port','8880' `
    -RedirectStandardError (Join-Path $logs 'kokoro.err.log') -RedirectStandardOutput (Join-Path $logs 'kokoro.log')
}

foreach ($i in 1..60) {
  $w = Up 'http://127.0.0.1:2022/health'; $k = Up 'http://127.0.0.1:8880/v1/models'
  if ($w -and $k) { 'voice ready: whisper 2022, kokoro 8880'; exit 0 }
  Start-Sleep 2
}
"not ready: whisper=$w kokoro=$k (logs in $logs)"; exit 1
