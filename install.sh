#!/usr/bin/env bash

# This installation script assumes Node.js version 10.10.0
# http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/#manually-rebuild

npm install

npm install -g nw-gyp

pushd node_modules/couchbase

# --target refers to version of NW.js, not the version of Node.js
nw-gyp rebuild --target=0.33.2 --arch=x64

popd

#npm list
