#!/bin/bash -l
#The -l is required to include environment variables in cron, not quite sure why but there we are
/usr/local/bin/php /var/www/html/admin/api/article/cronArticle.php