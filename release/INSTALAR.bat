@echo off
chcp 65001 >nul
title Instalador - Sistema de Homologação de Atestados Médicos

echo ====================================================================
echo   Sistema de Homologação de Atestados Médicos - Instalador
echo   Versão 2.0.0
echo   Desenvolvido por: Kauan Kelvin
echo ====================================================================
echo.

set "INSTALL_DIR=%ProgramFiles%\SistemaHomologacao"

echo Instalação será realizada em:
echo %INSTALL_DIR%
echo.

REM Verificar permissões de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este instalador requer permissões de administrador.
    echo Por favor, execute como Administrador.
    echo.
    pause
    exit /b 1
)

echo [1/3] Criando diretório de instalação...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo [OK] Diretório criado

echo [2/3] Copiando arquivos...
copy /Y "SistemaHomologacao.exe" "%INSTALL_DIR%\" >nul
echo [OK] Executável copiado

echo [3/3] Criando atalho na área de trabalho...
set SCRIPT="%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\Sistema Homologação.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%INSTALL_DIR%\SistemaHomologacao.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> %SCRIPT%
echo oLink.Description = "Sistema de Homologação de Atestados Médicos" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%
echo [OK] Atalho criado na área de trabalho

echo.
echo ====================================================================
echo Instalação concluída com sucesso!
echo.
echo Executável instalado em: %INSTALL_DIR%
echo Atalho criado na área de trabalho
echo.
echo Os dados do sistema serão salvos em:
echo %LOCALAPPDATA%\SistemaHomologacao\
echo ====================================================================
echo.

choice /C SN /M "Deseja executar o sistema agora"
if errorlevel 2 goto fim
if errorlevel 1 start "" "%INSTALL_DIR%\SistemaHomologacao.exe"

:fim
pause
