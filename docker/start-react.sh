#!/bin/bash

printenv | grep -v "no_proxy" >> /etc/environment #Required to include environment variables in cron

cron &

npm run start