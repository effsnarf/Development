@echo off

:start

title MG2.Web

rem Delete the .nuxt and dist folders
if exist ".nuxt" rmdir /s /q ".nuxt"
if exist "dist" rmdir /s /q "dist"

if "%NODE_ENV%"=="development" (
  call npm run dev
) else (
  call npm run build
  call npm run start
)

goto start
