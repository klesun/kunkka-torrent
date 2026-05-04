#!/bin/sh
qbittorrent-nox &
/opt/Jackett/jackett --NoUpdates &
exec npm start
