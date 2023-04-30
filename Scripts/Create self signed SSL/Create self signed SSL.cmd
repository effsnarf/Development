@echo off

if "%1"=="" (
    echo Error: No domain name specified.
    echo Please specify a domain name as the first argument.
    exit /b 1
) else (
  openssl genrsa -out private.key 2048

  openssl req -x509 -new -key %1.key -out %1.crt -days 365

  rem openssl x509 -in %1.crt -out %1.key -outform PEM -nocerts
)
