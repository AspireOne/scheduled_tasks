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

exec pnpm exec tsx src/index.ts --task-path "$1"
