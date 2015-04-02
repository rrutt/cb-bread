#!/usr/bin/env bash

npm install

npm install -g nw-gyp

pushd node_modules/couchbase
nw-gyp rebuild --target=0.12.0
popd

npm list
