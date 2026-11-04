@echo off
title Push StockAI to GitHub (Omshinde1915)
cd /d "%~dp0"
echo ========================================================
echo Pushing StockAI to: https://github.com/Omshinde1915/stock-ai-trading-system.git
echo Account: Omshinde1915
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo SUCCESS! Your project has been deployed to GitHub!
    echo View it at: https://github.com/Omshinde1915/stock-ai-trading-system
    echo ========================================================
) else (
    echo.
    echo If GitHub asks you to sign in, please complete the sign-in in your browser.
)
pause
