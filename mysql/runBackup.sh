#!/usr/bin/env bash
DATE=`date '+%Y-%m-%d-%H-%M-%S'`
mysqldump -u root -pPASSWORD-GOES-HERE nouseProd > "nouseProdBackup-$DATE.sql"
s3cmd put nouseProdBackup-$DATE.sql "s3://nouse/backup/database/production/nouseProdBackup-$DATE.sql" --acl-private
rm nouseProdBackup-$DATE.sql