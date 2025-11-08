@echo off
REM Establecer variable de entorno
set LOG_LEVEL=debug
set PORT=8080

REM Mostrar el valor de la variable
echo Iniciando aplicacion en modo local

REM Ejecutar la aplicación
npm run dev
