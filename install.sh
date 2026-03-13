#!/usr/bin/env bash
# Usage: ./install.sh <target-dir>
#
# Installs @fea-lib/jscad into <target-dir>/@fea-lib/jscad/
# and recursively installs declared peer libraries (@fea-lib/values).
#
# Example:
#   ./install.sh ./src/libs
#
# After running, adds the required paths to your tsconfig.json (with prompt).

set -euo pipefail

INVOKE_DIR="$PWD"
TARGET_DIR="$(mkdir -p "${1:?Usage: ./install.sh <target-dir>}" && cd "$1" && pwd)"

# Library name (hardcoded — script is designed to be fetched and run remotely)
NAME="@fea-lib/jscad"
INSTALL_PATH="$TARGET_DIR/$NAME"
REL_PATH="$(python3 -c "import os.path; print(os.path.relpath('$INSTALL_PATH/src/index.ts', '$INVOKE_DIR'))")"

echo "Installing $NAME into $INSTALL_PATH ..."

# Clone repo into target (shallow, no history)
REPO_URL="git@github.com:fea-lib/jscad.git"
TMP=$(mktemp -d)
git clone --depth=1 "$REPO_URL" "$TMP/repo" --quiet
mkdir -p "$INSTALL_PATH"
rsync -a --exclude="install.sh" --exclude=".git" "$TMP/repo/" "$INSTALL_PATH/"
rm -rf "$TMP"

# Recursively install peer libraries
DEPS_FILE="$INSTALL_PATH/dependencies.json"
if [ -f "$DEPS_FILE" ]; then
  PEER_COUNT=$(node -e "
    const d = JSON.parse(require('fs').readFileSync('$DEPS_FILE', 'utf8'));
    process.stdout.write(String((d.peerLibraries || []).length));
  ")
  if [ "$PEER_COUNT" -gt 0 ]; then
    for i in $(seq 0 $((PEER_COUNT - 1))); do
      PEER_INSTALL_SH=$(node -e "
        const d = JSON.parse(require('fs').readFileSync('$DEPS_FILE', 'utf8'));
        const p = d.peerLibraries[$i];
        process.stdout.write(p.installScript);
      ")
      PEER_TMP=$(mktemp)
      curl -fsSL "$PEER_INSTALL_SH" -o "$PEER_TMP"
      bash "$PEER_TMP" "$TARGET_DIR"
      rm "$PEER_TMP"
    done
  fi
fi

echo ""
echo "Done."
echo "  tsconfig.json paths entry: \"$NAME\": [\"$REL_PATH\"]"

# Offer to patch tsconfig.json in the invocation directory
TSCONFIG="$INVOKE_DIR/tsconfig.json"
if [ -f "$TSCONFIG" ]; then
  printf "Patch %s with this entry? [y/N] " "$TSCONFIG"
  read -r REPLY </dev/tty
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    node -e "
      const fs = require('fs');
      const path = require('path');
      const file = '$TSCONFIG';
      const text = fs.readFileSync(file, 'utf8');
      const obj = JSON.parse(text);
      obj.compilerOptions = obj.compilerOptions || {};
      obj.compilerOptions.paths = obj.compilerOptions.paths || {};
      obj.compilerOptions.paths['$NAME'] = ['$REL_PATH'];
      fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
      console.log('Patched ' + file);
    "
  fi
fi
