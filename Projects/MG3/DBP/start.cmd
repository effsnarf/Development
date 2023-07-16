@echo off

rem ..\..\..\Apps\LoadBalancer\App\start.cmd "%~dp0\load-balance.config.yaml"
rem start cmd /c "..\..\..\Apps\LoadBalancer\App\start.cmd

call Proxy\start.cmd
call Node1\start.cmd
call Node2\start.cmd
