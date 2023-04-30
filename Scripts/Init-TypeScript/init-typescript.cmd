@echo off
setlocal

rem Check if the tsconfig.json file already exists
if exist tsconfig.json (
  echo Error: tsconfig.json file already exists in the current directory.
  echo Please delete or move the existing file and try again.
  exit /b 1
)

rem Copy the TypeScript config file tsconfig.json from the TypeScript installation directory to the current directory
copy %~dp0template\tsconfig.json .

rem Copy the TypeScript file app.ts from the TypeScript installation directory to the current directory
copy %~dp0template\app.ts .

rem Copy the configuration config.yaml from the TypeScript installation directory to the current directory
copy %~dp0template\config.yaml .

rem Copy the start.cmd file from the TypeScript installation directory to the current directory
copy %~dp0template\start.cmd .

echo.

rem Initialize a new npm project
call npm init -y

rem Install required dev dependencies
call npm install -D typescript ts-node @types/node

rem Install required dependencies
call npm install colors

echo.
echo.
echo Successfully initialized TypeScript project!
echo.
echo To run the TypeScript file, use: start.cmd
