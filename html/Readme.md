# Nouse Website

Based on bCMS - a custom built content management system

## Creating a new server 

_This might be needed to move between different hositng providers etc, but should only be done by those with experince configuring Linux webservers_

- Install the apt requirements `apt update && apt upgrade -y && apt install apache2 php php-curl php-mbstring zip unzip mysql-client composer -y`
- Generate a key for Github pull access `ssh-keygen -t rsa -b 4096 -C "tech@nouse.co.uk"` and then add it to the server `eval $(ssh-agent -s) && ssh-add ~/.ssh/id_rsa`
- Add this key to the repo [Github Deploy Key](https://github.com/yorknouse/website/settings/keys)
- Clone the repo `git clone git@github.com:yorknouse/website.git /var/www/nouse/`
- Setup Composer dependencies `cd /var/www/nouse/ && composer install`
- Setup apache2 `cp edit.nouse.co.uk.conf /etc/apache2/sites-available/edit.nouse.co.uk.conf && a2ensite edit.nouse.co.uk && cp edit.nouse.co.uk.conf /etc/apache2/sites-available/nouse.co.uk.conf && a2ensite nouse.co.uk && service apache2 reload`
- Edit the crontab (`crontab -e`) to include the following line `tbc`
## Updating the server
```
cd /var/www/nouse/ && /usr/bin/git reset --hard && /usr/bin/git pull
rm /var/www/nouse/composer.lock && composer install --working-dir=/var/www/nouse
```