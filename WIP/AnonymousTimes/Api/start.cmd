@echo off

echo.
echo Starting AnonymousTimes API
echo.

call "%~dp0\..\Utils\execute-typescript.cmd" "%~dp0\main.ts" %*
