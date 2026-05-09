
npx webpack

az acr build --registry kunkkatorrents --image kunkka-torrent:latest . --subscription 3a50dbec-b5b4-4041-b97d-a3125ef48c42

az vm run-command invoke \
  --resource-group DefaultResourceGroup-NEU \
  --name kunkka-torrent-vm \
  --command-id RunShellScript \
  --scripts "@docker/vm-start.sh" \
  --subscription 3a50dbec-b5b4-4041-b97d-a3125ef48c42 \
  --query "value[0].message" -o tsv