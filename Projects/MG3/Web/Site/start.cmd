@echo off

rem ..\..\..\Apps\LoadBalancer\App\start.cmd "%~dp0\load-balance.config.yaml"

start "" /D .\Proxy .\Proxy\start.cmd
start "" /D .\Proxy .\Node1\start.cmd
start "" /D .\Proxy .\Node2\start.cmd

