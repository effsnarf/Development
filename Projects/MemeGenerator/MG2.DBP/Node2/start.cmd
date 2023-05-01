@echo off

call "%~dp0\..\..\..\..\Apps\DatabaseProxy\Server\start.cmd" "%~dp0\..\nodes.config.yaml" "%~dp0\config.yaml" %*
