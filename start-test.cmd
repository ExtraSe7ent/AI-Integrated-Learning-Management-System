@echo off
rem Bat backend va frontend trong hai cua so rieng, roi mo trinh duyet de test thu cong.
rem Backend can JDK 21: tu dung JDK 21 trong %USERPROFILE%\.jdks neu JAVA_HOME chua tro toi ban 21.
setlocal
if exist "%USERPROFILE%\.jdks\jdk-21.0.13+9\bin\java.exe" set "JAVA_HOME=%USERPROFILE%\.jdks\jdk-21.0.13+9"
rem LMS_SEED_DEMO=false: neu xoa thu muc data, he thong moi chi co tai khoan, khong co du lieu demo.
start "LMS backend (dong cua so nay de tat)" cmd /k "set JAVA_HOME=%JAVA_HOME%&& set LMS_SEED_DEMO=false&& call "%~dp0run-backend.cmd""
start "LMS frontend (dong cua so nay de tat)" cmd /k "call "%~dp0run-frontend.cmd""
echo Dang khoi dong... Backend mat khoang 30-60 giay.
timeout /t 45 /nobreak >nul
start "" http://127.0.0.1:5173
