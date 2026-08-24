@echo off
setlocal
set "PATH=C:\Users\Bruno Marques\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
cd /d "%~dp0"
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call "C:\Users\Bruno Marques\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" dev
endlocal
