#!/bin/sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
QBT_NOVA3="/root/.local/share/data/qBittorrent/nova3"
PYTHONPATH="$QBT_NOVA3:$QBT_NOVA3/engines" python3 "$SCRIPT_DIR/download_torrent_file.py" "$1"