@echo on

set ACR_NAME=kunkkatorrents
set APP_NAME=kunkka-torrent
set RESOURCE_GROUP=DefaultResourceGroup-NEU
set SUBSCRIPTION=3a50dbec-b5b4-4041-b97d-a3125ef48c42

rem Build image in Azure cloud (no local Docker needed)
call az acr build --registry %ACR_NAME% --image %APP_NAME%:latest . --subscription %SUBSCRIPTION%
if %ERRORLEVEL% neq 0 (
    echo ACR build failed
    exit /b %ERRORLEVEL%
)

rem Restart app so it pulls the new image
call az webapp restart --name %APP_NAME% --resource-group %RESOURCE_GROUP% --subscription %SUBSCRIPTION%
if %ERRORLEVEL% neq 0 (
    echo App restart failed
    exit /b %ERRORLEVEL%
)

echo Published. Waiting 60 seconds for warmup...
ping 127.0.0.1 -n 61 > nul
echo Making warmup call...
echo %time%
call curl https://kunkka-torrent.azurewebsites.net/
echo.
echo %time%
