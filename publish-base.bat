@echo on

set ACR_NAME=kunkkatorrents
set SUBSCRIPTION=3a50dbec-b5b4-4041-b97d-a3125ef48c42

call az acr build --registry %ACR_NAME% --image kunkka-torrent-base:latest --file Dockerfile.base . --subscription %SUBSCRIPTION%
