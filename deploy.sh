#!/bin/bash
set -e
echo "Building new images..."
docker compose build

echo "Restarting containers with minimal downtime..."
docker compose down -v
docker compose up -d

echo "Deployment complete!"