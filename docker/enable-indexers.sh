#!/bin/sh
# Run once at image build time to pre-configure Jackett indexers.

/opt/Jackett/jackett --NoUpdates &

attempts=0
until curl -s --connect-timeout 2 -o /dev/null http://127.0.0.1:9117; do
    attempts=$((attempts+1))
    [ $attempts -ge 30 ] && echo "Jackett did not start in time" >&2 && exit 1
    sleep 2
done

curl -sL -c /tmp/jackett.cookies -b /tmp/jackett.cookies "http://127.0.0.1:9117/UI/Dashboard" > /dev/null

INDEXERS=$(curl -s -b /tmp/jackett.cookies "http://127.0.0.1:9117/api/v2.0/indexers?configured=false" | \
    node -e "
const SKIP = new Set([
  // FlareSolverr / Cloudflare challenge — confirmed never returning results
  '0magnet','1337x','52bt','blueroms','btdirectory','btstate',
  'extratorrent-st','eztv','kickasstorrents-to','kickasstorrents-ws',
  'linuxtracker','magnetcat','megapeer','opensharing','pandacd','pornrips',
  'sexypics','skidrowrepack','torrentcore',
  'torrentoyunindir','torrentproject2','torrentsome','torrenttip',
  'wolfmax4k','xxxclub','zamundarip',
  // timeout / down / other errors — confirmed never returning results
  'newstudio','demonoid-clone','ilcorsaronero','tokyotosho','torrentkitty','anisource',
]);
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
d.filter(x => x.type === 'public' && !SKIP.has(x.id)).forEach(x => console.log(x.id));
")

enabled=0; failed=0
for id in $INDEXERS; do
    CONFIG=$(curl -s -b /tmp/jackett.cookies "http://127.0.0.1:9117/api/v2.0/indexers/$id/config")
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/jackett.cookies \
        -X POST -H "Content-Type: application/json" \
        -d "$CONFIG" \
        "http://127.0.0.1:9117/api/v2.0/indexers/$id/config")
    if [ "$STATUS" = "204" ]; then enabled=$((enabled+1)); else failed=$((failed+1)); fi
done

echo "Jackett indexers: enabled=$enabled failed=$failed"

pkill -f jackett || true
