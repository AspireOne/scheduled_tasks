#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [ -s "$NVM_DIR/nvm.sh" ]; then
  # Temporarily disable nounset while loading nvm.
  set +u
  . "$NVM_DIR/nvm.sh"
  set -u

  nvm use --silent
fi

if [ "$#" -ge 2 ]; then
  exec pnpm exec tsx src/index.ts --task-path "$1" --defaults "$2"
fi

exec pnpm exec tsx src/index.ts --task-path "$1"
