@echo off

:start

call "%~dp0\..\..\\..\..\Utils\execute-typescript.cmd" "%~dp0\app.ts" "..\..\config.yaml" "config.yaml" %*

goto :start
