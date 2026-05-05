#!/bin/sh

/usr/sbin/sshd
qbittorrent-nox &
/opt/Jackett/jackett --NoUpdates &

exec npm start
