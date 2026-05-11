#!/bin/bash
set -e

# Mount Azure File Share (key read from /etc/kunkka-storage.key, placed on VM separately)
apt-get install -y cifs-utils -qq
mkdir -p /mnt/kunkka-db-files
if ! mountpoint -q /mnt/kunkka-db-files; then
  STORAGE_KEY=$(cat /etc/kunkka-storage.key)
  mount -t cifs //kunkkatorrentstorage.file.core.windows.net/data /mnt/kunkka-db-files \
    -o username=kunkkatorrentstorage,password=$STORAGE_KEY,dir_mode=0777,file_mode=0777,nofail
fi
echo "File share mounted at /mnt/kunkka-db-files"

# Login to ACR via managed identity
ARM_TOKEN=$(curl -sf -H 'Metadata:true' 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2021-02-01&resource=https://management.azure.com/' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
ACR_TOKEN=$(curl -sf -X POST 'https://kunkkatorrents.azurecr.io/oauth2/exchange' \
  -d "grant_type=access_token&service=kunkkatorrents.azurecr.io&access_token=$ARM_TOKEN" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["refresh_token"])')
echo "$ACR_TOKEN" | docker login kunkkatorrents.azurecr.io -u 00000000-0000-0000-0000-000000000000 --password-stdin

# Stop existing container if any
docker rm -f kunkka-torrent 2>/dev/null || true

mkdir -p /etc/kunkka-letsencrypt

docker pull kunkkatorrents.azurecr.io/kunkka-torrent:latest

docker run -d --name kunkka-torrent --restart unless-stopped \
  -p 80:80 -p 443:443 -p 6881:6881/tcp -p 6881:6881/udp \
  -e PORT=80 -e WEBSITE_SITE_NAME=kunkka-torrent \
  -e "DEBUG=webtorrent*,bittorrent-tracker*,bittorrent-dht*,torrent-discovery*" \
  -v /mnt/kunkka-db-files:/mnt/kunkka-db-files \
  -v /etc/kunkka-letsencrypt:/etc/letsencrypt \
  kunkkatorrents.azurecr.io/kunkka-torrent:latest
echo "Container started successfully"
