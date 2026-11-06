@echo off
rem Xoa toan bo du lieu hoc tap (hoc phan, lop, bai hoc, cau hoi, phien, bai tap, diem, phan hoi, file upload...)
rem nhung GIU NGUYEN moi tai khoan (ma, ten, email, vai tro, mat khau). Sau do mo lai web nhu start-test.cmd.
rem Truoc khi chay: dong cua so "LMS backend" dang mo (neu co).
setlocal
echo.
echo  Thao tac nay XOA toan bo du lieu hoc tap, chi giu lai tai khoan.
echo  Hay dong cua so "LMS backend" dang chay truoc khi tiep tuc.
echo.
set /p OK=Go Y roi Enter de tiep tuc:
if /I not "%OK%"=="Y" exit /b
if exist "%USERPROFILE%\.jdks\jdk-21.0.13+9\bin\java.exe" set "JAVA_HOME=%USERPROFILE%\.jdks\jdk-21.0.13+9"
rem Ban sao luu de lay lai neu can
set "STAMP=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%-%TIME:~0,2%%TIME:~3,2%"
set "STAMP=%STAMP: =0%"
if exist "%~dp0lms-backend\data" xcopy /E /I /Q /Y "%~dp0lms-backend\data" "%~dp0lms-backend\backup-truoc-reset\%STAMP%\data" >nul
if exist "%~dp0lms-backend\private_media" xcopy /E /I /Q /Y "%~dp0lms-backend\private_media" "%~dp0lms-backend\backup-truoc-reset\%STAMP%\private_media" >nul
echo Da sao luu vao lms-backend\backup-truoc-reset\%STAMP%
start "LMS backend (dong cua so nay de tat)" cmd /k "set JAVA_HOME=%JAVA_HOME%&& set LMS_CLEAR_KEEP_ACCOUNTS=true&& set LMS_SEED_DEMO=false&& call "%~dp0run-backend.cmd""
start "LMS frontend (dong cua so nay de tat)" cmd /k "call "%~dp0run-frontend.cmd""
echo Dang khoi dong va xoa du lieu... khoang 30-60 giay.
timeout /t 45 /nobreak >nul
start "" http://127.0.0.1:5173
