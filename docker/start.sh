#!/bin/bash

echo "starting kunkka main app and side apps..."

/usr/sbin/sshd
/opt/Jackett/jackett --NoUpdates > /dev/null &
JACKETT_PID=$!
qbittorrent-nox &
QBT_PID=$!
npm start &
NODE_PID=$!

# Exit when any background process dies so Docker restarts the container
wait -n
kill -0 $JACKETT_PID 2>/dev/null || echo "[start.sh] Jackett (pid $JACKETT_PID) died" >&2
kill -0 $QBT_PID    2>/dev/null || echo "[start.sh] qbittorrent-nox (pid $QBT_PID) died" >&2
kill -0 $NODE_PID   2>/dev/null || echo "[start.sh] npm start (pid $NODE_PID) died" >&2
exit 1
