@echo off

REM This installation script assumes Node.js version 10.10.0
REM http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/#manually-rebuild

pushd %~dp0

REM http://stackoverflow.com/questions/19264972/prevent-abort-in-windows-batch-for-npm-install

call npm install

call npm install -g nw-gyp

pushd node_modules\couchbase

REM  --target refers to version of NW.js, not the version of Node.js
call nw-gyp rebuild --target=0.33.2 --arch=x64

popd

REM call npm list

pause

popd
