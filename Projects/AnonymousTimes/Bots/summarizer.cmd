@echo off

echo.
echo Starting Summarizer
echo.

call "%~dp0\..\Utils\execute-typescript.cmd" "%~dp0\summarizer.ts" %*
