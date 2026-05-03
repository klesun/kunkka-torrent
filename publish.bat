# MUST RUN ONLY FROM cmd.exe or PowerShell! DO NOT RUN FROM GIT BASH, IT WILL CORRUPT THE .zip FILE

@echo on

call npm ci

if %ERRORLEVEL% neq 0 (
    echo Failed to restore server node_modules from lock file
    exit /b %ERRORLEVEL%
)


echo "Removing dev dependencies"
call npm prune --omit=dev --omit=optional --omit=peer

echo "Done removing dev dependencies"

echo "Zipping the application for publish"
call Tar -a -cf app.zip assets scripts src styles views favicon.ico index.html package.json package-lock.json server.ts tsconfig.json
if %ERRORLEVEL% neq 0 (
    echo Zip file generation failed
    exit /b %ERRORLEVEL%
)
call az webapp deployment source config-zip --src ./app.zip -n kunkka-torrent -g DefaultResourceGroup-NEU --subscription 3a50dbec-b5b4-4041-b97d-a3125ef48c42
if %ERRORLEVEL% neq 0 (
    echo Azure CLI deployment call failed
    exit /b %ERRORLEVEL%
)

echo Published. Waiting 60 seconds to make warmup request after changes come into effect...

call npm ci

ping 127.0.0.1 -n 45 > nul
echo Making a ping warmup call...
echo %time%
call curl https://kunkka-torrent.azurewebsites.net/
echo.
echo %time%

call del app.zip