#!/bin/bash

# Read Package.json for tag

TAG=$(cat package.json | jq -r '.version')

echo "Tagging as Semver: ${TAG:-alpha}"

docker build -t tkjode/eddn-zeromq-router:${TAG:-alpha} .