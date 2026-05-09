#!/bin/bash

echo "starting kunkka main app and side apps..."

CERT_FILE="/etc/letsencrypt/live/torrent.klesun.net/fullchain.pem"

/usr/sbin/sshd
/opt/Jackett/jackett --NoUpdates > /dev/null &
JACKETT_PID=$!
qbittorrent-nox &
QBT_PID=$!

if [ -f "$CERT_FILE" ]; then
    echo "Certificate found - starting with nginx HTTPS proxy (Node on port 3000)"
    npm start &
    NODE_PID=$!
    nginx -g 'daemon off;' &
    NGINX_PID=$!
    wait -n
    kill -0 $NGINX_PID  2>/dev/null || echo "[start.sh] nginx (pid $NGINX_PID) died" >&2
else
    echo "No certificate yet - starting Node directly on port 80"
    PORT=80 npm start &
    NODE_PID=$!
    wait -n
fi

kill -0 $JACKETT_PID 2>/dev/null || echo "[start.sh] Jackett (pid $JACKETT_PID) died" >&2
kill -0 $QBT_PID    2>/dev/null || echo "[start.sh] qbittorrent-nox (pid $QBT_PID) died" >&2
kill -0 $NODE_PID   2>/dev/null || echo "[start.sh] npm start (pid $NODE_PID) died" >&2
exit 1
