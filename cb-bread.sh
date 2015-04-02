#!/usr/bin/env bash

if [ $# -eq 0 ]
then
  node server --help
elif [ "$1" == "-?" ]
then
  node server -?
elif [ "$1" == "--help" ]
then
  node server --help
else
  # http://askubuntu.com/questions/58814/how-do-i-add-environment-variables
  export USERARGS="$@"
  npm start
  echo $?
  if [ $? -ne 0 ]
  then
    node server --help
  fi
fi

