# Nouse Website

Based on bCMS - a custom built content management system

## Creating a new server 

_This might be needed to move between different hositng providers etc, but should only be done by those with experince configuring Linux webservers_

- Install the apt requirements `apt update && apt upgrade -y && apt install software-properties-common apache2 php php-curl php-mysqli php-mbstring zip unzip mysql-client composer -y`
- Install certbot `add-apt-repository universe && add-apt-repository ppa:certbot/certbot && apt-get update && apt-get install python-certbot-apache`
- Generate a key for Github pull access `ssh-keygen -t rsa -b 4096 -C "tech@nouse.co.uk"` and then add it to the server `eval $(ssh-agent -s) && ssh-add ~/.ssh/id_rsa`
- Add this key to the repo [Github Deploy Key](https://github.com/yorknouse/website/settings/keys)
- Clone the repo `git clone git@github.com:yorknouse/website.git /var/www/nouse/`
- Setup Composer dependencies `cd /var/www/nouse/ && composer install`
- Setup apache2 `cp edit.nouse.co.uk.conf /etc/apache2/sites-available/edit.nouse.co.uk.conf && a2ensite edit.nouse.co.uk && cp edit.nouse.co.uk.conf /etc/apache2/sites-available/nouse.co.uk.conf && a2ensite nouse.co.uk && service apache2 reload`
- Edit the crontab (`crontab -e`) to include the following line `* * * * * php /var/www/nouse/html/admin/api/article/cronArticle.php`
- Upload a `keys.php` file or set the environment variables using docker (there is a `keys.example.php` file to copy)
- Setup certbot for backend `certbot --apache`

### Creating a new MySQL Server

- Install MySQL etc. and copy the db
- Create a MySQL user 
```mysql
CREATE USER 'nouseProd'@'%' IDENTIFIED BY '';
GRANT DELETE ON nouseProd . * TO 'nouseProd'@'%';
GRANT INSERT ON nouseProd . * TO 'nouseProd'@'%';
GRANT SELECT ON nouseProd . * TO 'nouseProd'@'%';
GRANT UPDATE ON nouseProd . * TO 'nouseProd'@'%';
FLUSH PRIVILEGES;
```
- Edit the config file and set the "bind address" to be the **private** ip of the droplet as we dont want to allow external connections `sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf`
- `apt install s3cmd` then use the s3cmd config file `mysql/s3cfg` but be sure to set the access key at the top of it
- Upload `mysl/runBackup.sh` to `/root` and set the root mysql password in the file
- Add the following line to `crontab`: `0 */2 * * * bash /root/runBackup.sh`

## Updating the server
```
cd /var/www/nouse/ && /usr/bin/git reset --hard && /usr/bin/git pull
rm /var/www/nouse/composer.lock && composer install --working-dir=/var/www/nouse
```