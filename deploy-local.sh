#!/bin/bash
set -e
echo "Building new images..."
docker compose -f local-docker-compose.yml build

echo "Restarting containers with minimal downtime..."
docker compose -f local-docker-compose.yml down -v
docker compose -f local-docker-compose.yml up -d

echo "Deployment complete!"