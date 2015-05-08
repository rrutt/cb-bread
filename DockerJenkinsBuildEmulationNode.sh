#!/usr/bin/env bash

# This script is assumed to reside in the Git project root folder for a Node.js project.

echo "--- Emulating Jenkins build of Docker container. ---"

bash ./DockerEnvironmentNode.sh

sed "s/^/export /" <./DockerEnvironment.properties >./DockerEnvironmentExport.properties

. ./DockerEnvironmentExport.properties

echo "--- Running docker build: ---"
echo "docker build -t jenkins-emulation:${DOCKER_TAG} ."
docker build -t jenkins-emulation:${DOCKER_TAG} .

echo "--- Done emulating Jenkins build of Docker container. ---"

