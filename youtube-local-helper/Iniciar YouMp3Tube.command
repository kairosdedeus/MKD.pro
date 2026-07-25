#!/bin/zsh

set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

if [[ ! -d node_modules || ! -x .venv/bin/python ]]; then
  echo "Preparando o YouMp3Tube para o primeiro uso..."
  npm install
  python3 -m venv .venv
  .venv/bin/python -m pip install --upgrade pip yt-dlp
fi

echo "Atualizando o yt-dlp..."
.venv/bin/python -m pip install --quiet --upgrade yt-dlp

exec npm start
