#!/bin/bash

/usr/bin/crontab &
docker-php-entrypoint apache2-foreground