@echo off

:start

call "%~dp0\..\..\..\Utils\execute-typescript.cmd" "%~dp0\app.ts" %*
rem call "%~dp0\..\..\..\..\Apps\DatabaseProxy\Server\start.cmd" %*

goto :start
