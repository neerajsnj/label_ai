@echo off
title LabelCheck AI — Legal Metrology Compliance Checker
echo =================================================================
echo   LabelCheck AI - Smart Packaged Commodity Compliance Checker
echo   Legal Metrology (Packaged Commodities) Rules, 2011
echo =================================================================
echo Starting local web server...

if exist "C:\Users\user\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
    start "" http://localhost:3000
    call "C:\Users\user\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
) else (
    start "" http://localhost:3000
    node server.js
)
pause
