@echo off
title Dota 2 HUD Starter
echo ===================================================
echo   INICIANDO SERVIDORES DO DOTA 2 HUD (DotaPix)
echo ===================================================
echo.

:: Abre o servidor GSI (Node.js) em uma nova janela
echo [+] Iniciando o Servidor de Integracao do Dota 2 (GSI)...
start "Dota 2 GSI Server" cmd /k "cd gsi-server && npm start"

:: Abre a HUD no navegador padrao
echo [+] Abrindo a HUD no seu navegador...
timeout /t 2 /nobreak >nul
start http://localhost:5173/gsi/hud

:: Inicia o front-end Vite
echo [+] Iniciando o servidor web da HUD...
echo.
npm run dev
