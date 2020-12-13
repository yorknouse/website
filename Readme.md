# Nouse Website

Based on bCMS - a custom built content management system. There's probably going to always be some debate about whether this was the best idea for Nouse, but it has enabled us to do some really great custom stuff over the years, and overcome crippling performance issues on Wordpress 

# Server Setup

## Docker

The whole stack runs off one docker-compose file which makes this all a lot simpler!

1. Make sure you're the root user `sudo su` then `cd /root/`
1. `apt update && apt install docker.io docker-compose`
1. `systemctl enable docker` to ensure docker boots on startup
1. Generate a key for Github pull access `ssh-keygen -t rsa -b 4096 -C "tech@nouse.co.uk"` and then add it to the server `eval $(ssh-agent -s) && ssh-add ~/.ssh/id_rsa`
1. Add this key to the repo [Github Deploy Key](https://github.com/yorknouse/website/settings/keys) - copy it from `cat /root/.ssh/id_rsa.pub`
1. Clone the repo `git clone git@github.com:yorknouse/website.git`
1. `cd website` to get into it
1. Download the Cloudflare Origin Certificate - place the certificate (`.crt` file) in the `docker/ssl` directory, and dump the `ssl.key` file in the root of the repo. 
1. Create `nouseprod.env` based on the example file, and fill out the details (do this with `nano nouseprod.env`)
1. Run `bash updater.sh`
1. Once you're happy it's all working, add the following line to `crontab`: `0 4 * * * bash /root/nouse/updater.sh` - this will automatically update the site at 4am Daily

## Updating
```
cd nouse
bash updater.sh
```

# Database

## MySQL Setup

```
cat nouseBackup.sql | docker exec -i db /usr/bin/mysql -u root --password=PASSWORDYOUSETEARLIER nouse
```
Enter the password you set at the top of `nouseprod.env` (the root password into the above, and update the sql file to your correct file)

## MySQL Backups

One of the containers runs a backup every day at about 2:30am and pops it in our S3 bucket. That's all automatic, but you do need to set up a lifecycle rule for the spaces/S3 bucket. This is so the backups are deleted after 40 days and we don't get bancrupted by them.

- Set the lifecycle policy for the bucket using the `lifecycle.xml` file

## MySQL remote access

phpmyadmin is accessible by visitng port 8081 of the server - normally you'd need the University network or VPN to do this in the case of a University Server