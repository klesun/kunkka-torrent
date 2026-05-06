#!/bin/sh

/usr/sbin/sshd
qbittorrent-nox &
/opt/Jackett/jackett --NoUpdates &
zhopa >> /mnt/kunkka-db-files/dht_crawl.txt 2>/dev/null &

exec npm start
