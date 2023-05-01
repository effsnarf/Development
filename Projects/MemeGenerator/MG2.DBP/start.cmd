@echo off

rem Delete the .\Node1\.nuxt folder if it exists
if exist ".\Node1\.nuxt" rmdir /s /q ".\Node1\.nuxt"
if exist ".\Node1\dist" rmdir /s /q ".\Node1\dist"

..\..\..\Apps\LoadBalancer\App\start.cmd "%~dp0\load-balance.config.yaml"

rem start cmd /c "..\..\..\Apps\LoadBalancer\App\start.cmd
