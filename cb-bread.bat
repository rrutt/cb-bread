@echo off

pushd %~dp0


if .%1==.-? goto ShowHelp
if .%1==.--help goto ShowHelp

set USERARGS=%*
npm start
goto AllDone

:ShowHelp
node server --help
pause
goto AllDone

:AllDone
echo "Type popd to return to original directory."
