@echo off

rem Delete the .\Node1\.nuxt folder if it exists
if exist ".\Node1\.nuxt" rmdir /s /q ".\Node1\.nuxt"
if exist ".\Node1\dist" rmdir /s /q ".\Node1\dist"

copy node1.config.yaml .\Node1
copy node2.config.yaml .\Node2

..\..\..\Apps\LoadBalancer\App\start.cmd

rem start cmd /c "..\..\..\Apps\LoadBalancer\App\start.cmd"
