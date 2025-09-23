#!/bin/bash

printenv | grep -v "no_proxy" >> /etc/environment #Required to include environment variables in cron

cron -f &
docker-php-entrypoint apache2-foreground