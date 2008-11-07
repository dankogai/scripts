@ECHO off

setlocal
@REM 適当に書き換えてね
SET COMMON_DIR=C:\Documents and Settings\teramako\vimp

SET MOZ_NO_REMOTE=
FOR %%i IN (%*) DO (
    if "%%i" == "-no-remote" SET MOZ_NO_REMOTE=true
)
SET PROFILE_NAME=%1
if "%1"=="" SET PROFILE_NAME=default
SET VIMPERATOR_HOME=%COMMON_DIR%\%PROFILE_NAME%

START "xxx" "C:\Program Files\Mozilla Firefox\firefox.exe" -P %PROFILE_NAME% %2 %3
endlocal

