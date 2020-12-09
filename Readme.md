# Nouse Website

Based on bCMS - a custom built content management system. There's probably going to always be some debate about whether this was the best idea for Nouse, but it has enabled us to do some really great custom stuff over the years, and overcome crippling performance issues on Wordpress 

# WebServer 

## Docker

1. Make sure you're the root user `sudo su` then `cd /root/`
1. `apt update && apt install docker.io docker-compose`
1. `systemctl enable docker` to ensure docker boots on startup
1. Generate a key for Github pull access `ssh-keygen -t rsa -b 4096 -C "tech@nouse.co.uk"` and then add it to the server `eval $(ssh-agent -s) && ssh-add ~/.ssh/id_rsa`
1. Add this key to the repo [Github Deploy Key](https://github.com/yorknouse/website/settings/keys) - copy it from `cat /root/.ssh/id_rsa.pub`
1. Clone the repo `git clone git@github.com:yorknouse/website.git`
1. `cd website` to get into it
1. Create `nouseprod.env` based on the example file, and fill out the details (do this with `nano nouseprod.env`)
1. Run `bash updater.sh`
1. Once you're happy it's all working, add the following line to `crontab`: `0 4 * * * bash /root/nouse/updater.sh` - this will automatically update the site at 4am Daily

## Updating
```
cd nouse
bash updater.sh
```

# MySQL Server

## Creating a new server

- Install MySQL etc. and copy the db
- Create a MySQL user 
```mysql
CREATE USER 'nouseProd'@'%' IDENTIFIED BY 'PASSWORDGOESHERE';
GRANT DELETE ON nouseProd . * TO 'nouseProd'@'%';
GRANT INSERT ON nouseProd . * TO 'nouseProd'@'%';
GRANT SELECT ON nouseProd . * TO 'nouseProd'@'%';
GRANT UPDATE ON nouseProd . * TO 'nouseProd'@'%';
FLUSH PRIVILEGES;
```
- Edit the config file and set the "bind address" to be the **private** ip of the droplet as we dont want to allow external connections `sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf`
- `apt install s3cmd`
- Upload `mysql/s3cfg` to `/root/.s3cfg` but be sure to set the access key at the top in the file
- Upload `mysl/runBackup.sh` to `/root/runBackup.sh` and set the root mysql password in the file
- Add the following line to `crontab`: `0 */2 * * * bash /root/runBackup.sh`
- Upload `mysl/lifecycle.xml` to `/root`
- Set the lifecycle policy for the bucket `s3cmd setlifecycle lifecycle "s3://BUCKETNAME"`

**NB** The University firewall only allows port 80 through to the internet, so to access the MySQL database for maintenance purposes use a SSH Tunnel on the University VPN