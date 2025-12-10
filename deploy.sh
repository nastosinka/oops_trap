#!/bin/bash
set -e

git checkout main
echo "Pulling the latest main-branch version..."
git pull origin main

echo "Rebuilding containers and clearing cache..."
docker compose down --rmi all --volumes --remove-orphans
docker compose -f docker-compose.prod.yml up --build -d

echo "Deployment complete."

docker ps -a
