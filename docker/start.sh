#!/bin/bash

printenv | grep -v "no_proxy" >> /etc/environment #Required to include environment variables in cron

echo "STARTING NODEJS APP" &&
HOST=0.0.0.0 node /var/www/readers-frontend/dist/server/entry.mjs &
echo "NODEJS APP RUNNING" &&
cron -f &
docker-php-entrypoint apache2-foreground