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

# Optional summary file passed by a parent install script (peer mode).
# When set, this script appends its entry and suppresses its own summary/prompt.
SUMMARY_FILE="${3:-}"

# Library name (hardcoded — script is designed to be fetched and run remotely)
NAME="@fea-lib/jscad"
INSTALL_PATH="$TARGET_DIR/$NAME"
REL_PATH="$(python3 -c "import os.path; print(os.path.relpath('$INSTALL_PATH/src/index.ts', '$INVOKE_DIR'))")"

echo "Installing $NAME ..."

# Clone repo into target (shallow, no history)
REPO_URL="git@github.com:fea-lib/jscad.git"
TMP=$(mktemp -d)
git clone --depth=1 "$REPO_URL" "$TMP/repo" --quiet
mkdir -p "$INSTALL_PATH"
rsync -a --exclude="install.sh" --exclude=".git" "$TMP/repo/" "$INSTALL_PATH/"
rm -rf "$TMP"

# If no summary file was passed in, this is the top-level invocation — create one
IS_TOP_LEVEL=false
if [ -z "$SUMMARY_FILE" ]; then
  SUMMARY_FILE=$(mktemp)
  IS_TOP_LEVEL=true
fi
echo "$NAME|$REL_PATH" >> "$SUMMARY_FILE"

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
      bash "$PEER_TMP" "$TARGET_DIR" "" "$SUMMARY_FILE"
      rm "$PEER_TMP"
    done
  fi
fi

# Only the top-level script prints the summary and offers to patch tsconfig
if [ "$IS_TOP_LEVEL" = true ]; then
  echo ""
  echo "Installed:"
  while IFS="|" read -r LIB_NAME LIB_PATH; do
    echo "  \"$LIB_NAME\": [\"$LIB_PATH\"]"
  done < "$SUMMARY_FILE"

  TSCONFIG="$INVOKE_DIR/tsconfig.json"
  if [ -f "$TSCONFIG" ]; then
    echo ""
    printf "Patch %s with the above entries? [y/N] " "$TSCONFIG"
    read -r REPLY </dev/tty
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      node -e "
        const fs = require('fs');
        const entries = fs.readFileSync('$SUMMARY_FILE', 'utf8').trim().split('\n');
        const obj = JSON.parse(fs.readFileSync('$TSCONFIG', 'utf8'));
        obj.compilerOptions = obj.compilerOptions || {};
        obj.compilerOptions.paths = obj.compilerOptions.paths || {};
        for (const entry of entries) {
          const [name, relPath] = entry.split('|');
          obj.compilerOptions.paths[name] = [relPath];
        }
        fs.writeFileSync('$TSCONFIG', JSON.stringify(obj, null, 2) + '\n');
        console.log('Patched $TSCONFIG');
      "
    fi
  fi

  # Offer to install npm peer dependencies declared in package.json
  NPM_DEPS=$(node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$INSTALL_PATH/package.json', 'utf8'));
    process.stdout.write(Object.keys(pkg.peerDependencies || {}).join(' '));
  ")
  if [ -n "$NPM_DEPS" ]; then
    echo ""
    printf "Install npm dependencies (%s)? [y/N] " "$NPM_DEPS"
    read -r REPLY </dev/tty
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      npm install $NPM_DEPS
    fi
  fi

  rm "$SUMMARY_FILE"
fi
