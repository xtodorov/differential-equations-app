@echo off
setlocal
cd /d "%~dp0"
title MathForge AI - Local Windows Startup

echo MathForge AI - local development
where node >nul 2>&1
if errorlevel 1 goto missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto missing_node
node -e "process.exit(Number(process.versions.node.split('.')[0])>=24?0:1)"
if errorlevel 1 goto missing_node
where docker >nul 2>&1
if errorlevel 1 goto missing_docker
docker info >nul 2>&1
if errorlevel 1 goto missing_docker
node -e "const s=require('node:net').createServer();s.once('error',()=>{console.error('Port 3000 is already in use. Close the other app first.');process.exit(1)});s.listen(3000,'127.0.0.1',()=>s.close())"
if errorlevel 1 goto failed

if not exist ".env" copy /y ".env.example" ".env" >nul
if not exist ".env" goto failed

echo [1/6] Starting database and mathematics service. First startup may take several minutes.
docker compose up -d --build --wait db math
if errorlevel 1 goto failed

echo [2/6] Installing locked application packages...
call npm.cmd ci --no-audit --no-fund
if errorlevel 1 goto failed

echo [3/6] Preparing database client...
call npm.cmd run db:generate
if errorlevel 1 goto failed

echo [4/6] Preparing code editor...
call npm.cmd run assets
if errorlevel 1 goto failed

echo [5/6] Applying database migration and lessons...
call npm.cmd run db:migrate
if errorlevel 1 goto failed
call npm.cmd run db:seed
if errorlevel 1 goto failed

echo [6/6] Starting MathForge AI.
echo When Ready appears, open http://localhost:3000 in Edge or Chrome.
echo Keep this window open while using the application.
call node "node_modules/next/dist/bin/next" dev --hostname 127.0.0.1 --port 3000
if errorlevel 1 goto failed
exit /b 0

:missing_node
echo Install Node.js 24 LTS from https://nodejs.org/ and reopen this file.
pause
exit /b 1

:missing_docker
echo Install Docker Desktop from https://www.docker.com/products/docker-desktop/
echo Start Docker Desktop in Linux containers mode and wait until the engine is running.
echo If it requests WSL 2 or a restart, follow Docker Desktop's instructions first.
pause
exit /b 1

:failed
echo.
echo Startup stopped. The error is shown above. Copy it into the Codex chat for help.
pause
exit /b 1
