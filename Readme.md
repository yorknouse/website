# Nouse Website

Nouse was based on "bCMS" originally, a custom built content management system.
There's probably going to always be some debate about whether this was the best idea for Nouse,
but it has enabled us to do some really great custom stuff over the years,
and overcome crippling performance issues on Wordpress.

## Local Development

Please see `LOCAL.md` for instructions.

## Repo Structure

~~Firstly, an apology.
This repo was, in its early life,
a 3-year labour of love of over 580 commits just trying to keep up with Nouse as the society grew and its needs developed.
There are no tests or migrations and documentation is limited.
Code quality and style varies as the project grew alongside its creators skill set.
No linting is provided or used.~~

Actually *firstly*, an apology.
This repo is still in somewhat early development but is getting there in maturity.
This is a 5 (almost 6)
year labour of love of over 1,300 commits just trying to keep up with Nouse as the society grew and its needs developed.
There are very few tests and documentation is fragmented if even there in the first place.
Linting has been a project to put in for some semblance of consistency but oh wow it has been a struggle
(coming from a current alum who is still dedicating their time to helping out).
For ease of development for future developers we are moving away from PHP as a language for easier to learn languages like TypeScript.
**Assume all documentation below is incorrect and wrong** and I will be doing more work to improve future developers'
experience as I have spent an ungodly number of hours just trying to understand the structure and trying to get dev working.

For performance reasons, the site does not use a router, and instead leaves routing to Apache.
Caddy sits in front of apache to terminate SSL and do some reverse proxying.
The project is structured around three directories within /html:

admin - The "backend" edit dashboard
common - (not publicly accessible) Classes, Functions & Templates shared by both other directories
frontend - "Public Site" nouse.co.uk

### Ajax?....

To improve user performance & error handling the backend site is not based around a conventional laravel-esque form structure for user interaction.
Instead, most data from the database is returned to the user through a normal dynamically loaded page,
generating html from a twig template.

When a user interacts with the page,
such as pressing a button,
this triggers a JQuery function (all defined in that pages' twig template) which makes an "api call"
to a php script within the `admin/api/` folder and executes the change
(such as an insert/delete/update).
Once this completes successfully two things can happen.
The first, a legacy behaviour, is that the page reloads to reflect the changes in the page itself.
The second option is that the page calls a function to update what's displayed, without needing a page re-load.
There are quite a few endpoints in `admin/api` that provide access to retrieving data as well,
as this is how the mobile app downloads its data which it then displays.

With hindsight this was not a great way to do this.

# Server Setup

## Docker

The whole stack runs off one docker-compose file which makes this all a lot simpler!

1. Make sure you're the root user `sudo su` then `cd /root/`
2. `apt update && apt install docker.io docker-compose`
3. `systemctl enable docker` to ensure docker boots on startup
4. Clone the repo `git clone git@github.com:yorknouse/website.git`
5. `cd website` to get into it
6. Download the Cloudflare Origin Certificate - place the certificate (`.crt` file) in the `ssl` directory, 
with the `ssl.key` file
7. Create `nouseprod.env` based on the example file, and fill out the details (do this with `nano nouseprod.env`)
8. Run `docker-compose up -d` to get the site running

## Deploy webhook

Some pages in the website are statically built, nominally the home page.
To rebuild them,
the host vm needs a webhook that can be triggered from the admin panel and causes the docker images to be rebuilt.

Setting up:

```sh
sudo apt-get install webhook
```

In the `/root` directory, create a `rebuild-webhook.json` file with the following content:

```json
[
  {
    "id": "rebuild-webhook",
    "execute-command": "/root/rebuild.sh",
    "command-working-directory": "/root/website"
  }
]
```

Still in the `/root` folder, create the `rebuild.sh` file with the following content:

```sh
#!/bin/sh
git pull && docker-compose -f docker-compose.yml build --no-cache nouse && docker-compose -f docker-compose.yml up -d
```

And make the script executable:

```bash
chmod +x /root/rebuild.sh
```

Now we need a service to start webhook on boot.
Create the `/etc/systemd/system/rebuild.service` file with the following content:

```sh
[Unit]
Description=Webhook Rebuild Service
After=network.target

[Service]
ExecStart=/usr/bin/webhook -hooks=/root/rebuild-webhook.json -hotreload=false -port=9000 -secure=false -verbose=true -nopanic
KillMode=process
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Finally, reload the systemd daemon, disable the default webhook service and enable ours:

```sh
systemctl daemon-reload && systemctl disable webhook.service && systemctl enable rebuild.service
```

## Updating

Watchtower does the updating for you anytime you push a new tag (which triggers a docker build) but if you update the docker compose file or the config you'll need to run `git pull && docker-compose up -d` (in the Nouse directory)

## Backblaze Setup

You need to setup the CORS on the bucket to allow uploads from any host, and downloads from any host

First download and authenticate the AWS Cli (using your Backblaze credentials),
then download the cors.json file from this repo and run:

`aws s3api put-bucket-cors --bucket=nousePublicBackendUploads --endpoint-url=https://s3.eu-central-003.backblazeb2.com  --cors-configuration=file://cors.json`

# Database

## MySQL Setup

To transfer a MySQL dump file (named `nouseBackup.sql`) run:

```
cat nouseBackup.sql | docker exec -i db /usr/bin/mysql -u root --password=rootPass nouse
```

## MySQL Backups

`mysql-backup` runs a backup every day at about 2:30am and pops it in our S3 bucket.
That's all automatic, but you do need to set up a lifecycle rule for the spaces/S3 bucket.
This is so the backups are deleted after 40 days and we don't get bankrupted by them.

- Set the lifecycle policy for the bucket using the `lifecycle.xml` file

## MySQL remote access

phpmyadmin is accessible at http://yusunouse01.york.ac.uk/tools/phpmyadmin, with login = nouseAdmin and password = [nouseAdminPassword set in nouseprod.env]

# Netdata

netdata is accessible at http://yusunouse01.york.ac.uk/tools/netdata, with login = nouseAdmin and password = [nouseAdminPassword set in nouseprod.env]

# Grafana

Grafana (stats.nouse.co.uk) runs as an instance inside the MySQL server.
It has full root access to the database due to Docker limitations so as such no users have edit permissions.
Instead, set up your queries and graphs in the text files under `"`docker/grafana/dashboards`.
You can also generate these locally by running grafana and using the UI to export JSON files.

Grafana security is managed by an oauth hook from the main admin site.

## Licence

Copyright (C) 2018-2025 Nouse, University of York Students' Union and its contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
