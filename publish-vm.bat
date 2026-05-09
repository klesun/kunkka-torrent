@echo on

call npx webpack

set ACR_NAME=kunkkatorrents
set VM_NAME=kunkka-torrent-vm
set RESOURCE_GROUP=DefaultResourceGroup-NEU
set SUBSCRIPTION=3a50dbec-b5b4-4041-b97d-a3125ef48c42

call az acr build --registry %ACR_NAME% --image kunkka-torrent:latest . --subscription %SUBSCRIPTION%
if %ERRORLEVEL% neq 0 (
    echo ACR build failed
    exit /b %ERRORLEVEL%
)

call az vm run-command invoke \
  --resource-group DefaultResourceGroup-NEU \
  --name kunkka-torrent-vm \
  --command-id RunShellScript \
  --scripts "@docker\vm-start.sh" \
  --subscription 3a50dbec-b5b4-4041-b97d-a3125ef48c42 \
  --query "value[0].message" -o tsv
if %ERRORLEVEL% neq 0 (
    echo VM deploy failed
    exit /b %ERRORLEVEL%
)

echo Published to VM.
curl http://20.123.24.242/ping
