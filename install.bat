@echo off

pushd %~dp0

REM http://stackoverflow.com/questions/19264972/prevent-abort-in-windows-batch-for-npm-install

call npm install

call npm install -g nw-gyp

pushd node_modules\couchbase
call nw-gyp rebuild --target=0.12.0
popd

call npm list

pause

popd
