#!/usr/bin/env sh
# Create life-audit/ in the target dir (default: cwd) from templates. Never overwrites.
set -eu
T="$(cd "$(dirname "$0")/../templates" && pwd)"
D="${1:-.}/life-audit"
mkdir -p "$D/log" "$D/findings" "$D/outputs" "$D/archive" "$D/checkins"

put() { [ -e "$2" ] || cp "$1" "$2"; }
new() { [ -e "$1" ] || printf '%s\n' "$2" > "$1"; }

put "$T/README.md" "$D/README.md"
put "$T/state.md" "$D/state.md"
put "$T/profile.md" "$D/profile.md"
put "$T/summary.md" "$D/outputs/summary.md"
put "$T/commitments.md" "$D/outputs/commitments.md"
for f in "$T"/findings/*.md; do put "$f" "$D/findings/$(basename "$f")"; done
new "$D/decisions.md" "# Decisions (append-only, dated)"
new "$D/open-threads.md" "# Open threads"
new "$D/safety-notes.md" "# Safety notes (date and 'protocol followed' only, never details)"

# Keep it out of git if inside a repo.
if top="$(git -C "${1:-.}" rev-parse --show-toplevel 2>/dev/null)"; then
  grep -qxF 'life-audit/' "$top/.gitignore" 2>/dev/null || printf 'life-audit/\n' >> "$top/.gitignore"
  echo "added life-audit/ to $top/.gitignore"
fi
echo "ready: $D"
