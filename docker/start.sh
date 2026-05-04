#!/bin/sh

/usr/sbin/sshd
qbittorrent-nox &
/opt/Jackett/jackett --NoUpdates &

(
    attempts=0
    until curl -s --connect-timeout 2 -o /dev/null http://127.0.0.1:9117; do
        attempts=$((attempts+1))
        [ $attempts -ge 20 ] && echo "Jackett did not start in time" >&2 && exit 1
        sleep 3
    done

    curl -sL -c /tmp/jackett.cookies -b /tmp/jackett.cookies "http://127.0.0.1:9117/UI/Dashboard" > /dev/null

    INDEXERS=$(curl -s -b /tmp/jackett.cookies "http://127.0.0.1:9117/api/v2.0/indexers?configured=false" | \
        node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
d.filter(x => x.type === 'public').forEach(x => console.log(x.id));
")

    for id in $INDEXERS; do
        CONFIG=$(curl -s -b /tmp/jackett.cookies "http://127.0.0.1:9117/api/v2.0/indexers/$id/config")
        curl -s -o /dev/null -b /tmp/jackett.cookies \
            -X POST -H "Content-Type: application/json" \
            -d "$CONFIG" \
            "http://127.0.0.1:9117/api/v2.0/indexers/$id/config"
    done
) &

exec npm start
