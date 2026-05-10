#!/bin/sh

set -eu

export HOME=/home/aspire
export NVM_DIR="$HOME/.nvm"

# Temporarily disable nounset while loading nvm.
set +u
. "$NVM_DIR/nvm.sh"
set -u

cd /home/aspire/dev/scheduled_tasks

nvm use --silent

if [ "$#" -ge 2 ]; then
  exec pnpm exec tsx src/index.ts --task-path "$1" --defaults "$2"
fi

exec pnpm exec tsx src/index.ts --task-path "$1"
