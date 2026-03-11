#!/usr/bin/env bash
# Usage: ./install.sh <target-dir>
#
# Installs @fea-lib/jscad into <target-dir>/@fea-lib/jscad/
# and recursively installs declared peer libraries (@fea-lib/values).
#
# Example:
#   ./install.sh ./src/libs
#
# After running, add to your tsconfig.json compilerOptions.paths:
#   "@fea-lib/jscad":   ["<target-dir>/@fea-lib/jscad/src/index.ts"]
#   "@fea-lib/values":  ["<target-dir>/@fea-lib/values/src/index.ts"]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:?Usage: ./install.sh <target-dir>}"

# Read library name from package.json
NAME=$(node -e "process.stdout.write(require('$SCRIPT_DIR/package.json').name)")
INSTALL_PATH="$TARGET_DIR/$NAME"

echo "Installing $NAME into $INSTALL_PATH ..."

# Clone repo into target (shallow, no history)
REPO_URL="https://github.com/fea-lib/jscad-builder"
TMP=$(mktemp -d)
git clone --depth=1 "$REPO_URL" "$TMP/repo" --quiet
mkdir -p "$INSTALL_PATH"
rsync -a --exclude="install.sh" --exclude=".git" "$TMP/repo/" "$INSTALL_PATH/"
rm -rf "$TMP"

# Recursively install peer libraries
DEPS_FILE="$INSTALL_PATH/dependencies.json"
if [ -f "$DEPS_FILE" ]; then
  PEER_COUNT=$(node -e "
    const d = require('$DEPS_FILE');
    process.stdout.write(String((d.peerLibraries || []).length));
  ")
  for i in $(seq 0 $((PEER_COUNT - 1))); do
    PEER_INSTALL_SH=$(node -e "
      const d = require('$DEPS_FILE');
      const p = d.peerLibraries[$i];
      process.stdout.write(p.repo + '/raw/main/install.sh');
    ")
    PEER_TMP=$(mktemp)
    curl -fsSL "$PEER_INSTALL_SH" -o "$PEER_TMP"
    bash "$PEER_TMP" "$TARGET_DIR"
    rm "$PEER_TMP"
  done
fi

echo ""
echo "Done. Add the following to your tsconfig.json compilerOptions.paths:"
echo "  \"$NAME\": [\"$INSTALL_PATH/src/index.ts\"]"
echo "  (peer libs will have printed their own paths above)"
