#!/bin/bash

/usr/sbin/sshd
qbittorrent-nox &
/opt/Jackett/jackett --NoUpdates &
npm start &

# Exit when any background process dies so Docker restarts the container
wait -n
exit 1
