#!/bin/bash

printenv | grep -v "no_proxy" >> /etc/environment

cron -f &
docker-php-entrypoint apache2-foreground