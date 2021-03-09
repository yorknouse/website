# Nouse Website

Based on bCMS - a custom built content management system. There's probably going to always be some debate about whether this was the best idea for Nouse, but it has enabled us to do some really great custom stuff over the years, and overcome crippling performance issues on Wordpress 

# Server Setup

## Docker

The whole stack runs off one docker-compose file which makes this all a lot simpler!

1. Make sure you're the root user `sudo su` then `cd /root/`
1. `apt update && apt install docker.io docker-compose`
1. `systemctl enable docker` to ensure docker boots on startup
1. Generate a key for Github pull access `ssh-keygen -t rsa -b 4096 -C "tech@nouse.co.uk"` and then add it to the server `eval $(ssh-agent -s) && ssh-add ~/.ssh/id_rsa`
1. Login to docker hub `docker login` and ensure that it creates a config file for you (located at `/root/.docker/config.json`)
1. Add this key to the repo [Github Deploy Key](https://github.com/yorknouse/website/settings/keys) - copy it from `cat /root/.ssh/id_rsa.pub`
1. Clone the repo `git clone git@github.com:yorknouse/website.git`
1. `cd website` to get into it
1. Download the Cloudflare Origin Certificate - place the certificate (`.crt` file) in the `ssl` directory, with the `ssl.key` file  
1. Create `nouseprod.env` based on the example file, and fill out the details (do this with `nano nouseprod.env`)
1. Run `docker-compose up -d` to get the site running

## Updating

Watchtower does the updating for you anytime you push a new tag (which triggers a docker build) but if you update the docker compose file or the config you'll need to run `git pull && docker-compose up -d` (in the Nouse directory)

## Backblaze Setup

You need to setup the CORS on the bucket to allow uploads

First download and authenticate the AWS Cli (using your Backblaze credentials), then download the cors.json file from this repo and run:

`aws s3api put-bucket-cors --bucket=nousePublicBackendUploads --endpoint-url=https://s3.eu-central-003.backblazeb2.com  --cors-configuration=file://cors.json`

# Database

**N.B.** the database is in Latin1, this needs upgrading but for now just remember to keep your clients etc using that!

## MySQL Setup

To transfer a MySQL dump file (named `nouseBackup.sql`) run:
```
cat nouseBackup.sql | docker exec -i db /usr/bin/mysql -u root --password=rootPass nouse
```

## MySQL Backups

`mysql-backup` runs a backup every day at about 2:30am and pops it in our S3 bucket. That's all automatic, but you do need to set up a lifecycle rule for the spaces/S3 bucket. This is so the backups are deleted after 40 days and we don't get bancrupted by them.

- Set the lifecycle policy for the bucket using the `lifecycle.xml` file

## MySQL remote access

phpmyadmin is accessible at http://yusunouse01.york.ac.uk/tools/phpmyadmin, with login = nouseAdmin and password = [nouseAdminPassword set in nouseprod.env]

# Netdata

netdata is accessible at http://yusunouse01.york.ac.uk/tools/netdata, with login = nouseAdmin and password = [nouseAdminPassword set in nouseprod.env]

# Grafana

Grafana (stats.nouse.co.uk) runs as an instance inside the MySQL server. It has full root access to the database due to Docker limitations so as such no users have edit permissions. Instead, set up your queries and graphs in the text files under `"`docker/grafana/dashboards`. You can also generate these locally by running grafana and using the UI to export JSON files. 

Grafana security is managed by an oauth hook from the main admin site. 