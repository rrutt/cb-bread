@echo off

pushd %~dp0

if .%1==.-? goto ShowHelp
if .%1==.--help goto ShowHelp

set USERARGS=%*
call npm start
goto AllDone

:ShowHelp
node server --help
pause
goto AllDone

:AllDone
popd
