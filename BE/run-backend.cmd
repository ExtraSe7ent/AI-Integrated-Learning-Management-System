@echo off
cd /d "%~dp0lms-backend"
call "%~dp0lms-backend\mvnw.cmd" spring-boot:run
