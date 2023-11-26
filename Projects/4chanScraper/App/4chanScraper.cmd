@echo off

echo.
echo Starting 4chanScraper
echo.

call "%~dp0\..\..\..\Utils\execute-typescript.cmd" "%~dp0\4chanScraper.ts" %*
