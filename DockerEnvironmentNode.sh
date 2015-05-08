#!/usr/bin/env bash

# This script is assumed to reside in the Git project root folder for a Node.js project.

echo "--- Setting Docker environment variables for a Node.js project. ---"

echo "Current directory = $(pwd)"

echo "Docker version = $(docker --version)"

echo "Node version = $(node --version)"

export PACKAGE_NAME=$(node -pe 'JSON.parse(process.argv[1]).name' "$(cat package.json)")
echo "PACKAGE_NAME = ${PACKAGE_NAME}"

export PACKAGE_VERSION=`node -pe 'JSON.parse(process.argv[1]).version' "$(cat package.json)"`
echo "PACKAGE_VERSION = ${PACKAGE_VERSION}"

export DOCKER_TAG=$(echo "${PACKAGE_NAME}-${PACKAGE_VERSION}" | tr '[:upper:].\+' '[:lower:]--')
echo "DOCKER_TAG = ${DOCKER_TAG}"

rm --force DockerEnvironment.properties
touch DockerEnvironment.properties

echo "PACKAGE_NAME=${PACKAGE_NAME}" >> DockerEnvironment.properties
echo "PACKAGE_VERSION=${PACKAGE_VERSION}" >> DockerEnvironment.properties
echo "DOCKER_TAG=${DOCKER_TAG}" >> DockerEnvironment.properties

echo "Contents of DockerEnvironment.properties:"
cat DockerEnvironment.properties

echo "--- Done setting Docker environment variables for a Node.js project. ---"
