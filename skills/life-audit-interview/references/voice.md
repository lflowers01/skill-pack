# Voice mode setup (hands-free)

Bottom line: VoiceMode (MCP server) gives Claude Code a `converse` tool that speaks a line, then listens until the user stops talking. No buttons. Speech runs locally: Whisper for listening, Kokoro for speaking. Nothing about the user's voice leaves the machine.

## Start of every voice sitting
1. Start the engines: `powershell -NoProfile -ExecutionPolicy Bypass -File <skill>/scripts/voice_up.ps1` (safe to rerun; it skips anything already running). Wait for "voice ready".
2. Check the `mcp__voicemode__converse` tool exists. If not, VoiceMode is not registered or the session started before it was; tell the user to restart the session.
3. First converse call: a short sound check ("Can you hear me okay? Say anything."). If the transcript is empty twice, fall back to typing and say so on screen.
4. At the end of the sitting: `voice_up.ps1 -Stop`.

## Installed pieces (this machine, set up 2026-11-09)
- VoiceMode 9.0.2: `uv tool install voice-mode`; registered with `claude mcp add --scope user voicemode -- C:/Users/<user>/.local/bin/voicemode-mcp-launcher.exe`.
- Whisper: whisper.cpp Windows build (`whisper-blas-bin-x64.zip`, release b5454) in `~/.voicemode/services/whisper/Release`, model `ggml-small.en.bin` (English only, ~470 MB, about 1 second per short reply on CPU).
- Kokoro: `~/.voicemode/services/kokoro` (ai-cora/Kokoro-FastAPI, the fork VoiceMode uses), Python 3.12 venv, needs eSpeak NG (`winget install eSpeak-NG.eSpeak-NG`). Voice `af_sky`.
- Settings appended to `~/.voicemode/voicemode.env`: local-only base URLs (no OpenAI fallback), `VOICEMODE_SILENCE_THRESHOLD_MS=2500` (pause allowed mid-thought), `VOICEMODE_INITIAL_SILENCE_GRACE_PERIOD=6.0` (time to start answering), `VOICEMODE_DEFAULT_LISTEN_DURATION=300`, `VOICEMODE_VAD_AGGRESSIVENESS=2`.
- Permissions: the user adds `mcp__voicemode__converse` and `mcp__voicemode__service` to `permissions.allow` in `~/.claude/settings.json`, otherwise every turn waits for an Allow click.

## Tuning
- Cut off mid-thought: raise `VOICEMODE_SILENCE_THRESHOLD_MS` (3000 to 4000).
- Long dead air after they finish: lower it (1800 to 2000).
- Picks up room noise while pacing: `VOICEMODE_VAD_AGGRESSIVENESS=3`.
- Misheard words: switch the model to `ggml-medium.en.bin` (slower) in voice_up.ps1.
- Bluetooth headphones clip the first word: `VOICEMODE_CHIME_LEADING_SILENCE=0.5`.

## Windows gotchas found during setup
- `voicemode service install kokoro|whisper` fails on native Windows (`os.uname`). Use the manual setup above.
- VoiceMode CLI crashes printing emoji in a cp1252 console: run it with `PYTHONIOENCODING=utf-8`. Do not set `PYTHONUTF8=1` for VoiceMode; its env file is not UTF-8.
- From Git Bash, arguments starting with `/` get rewritten into Windows paths (`--inference-path` broke). voice_up.ps1 avoids this; in Git Bash use `MSYS_NO_PATHCONV=1`.
- Port 8765 is VoiceMode's own HTTP server; the dashboard uses 8780.
