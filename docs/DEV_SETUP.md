
# Set up a local development environment 


New docs for the 2025/26 rewrite.

## Edit backend

This is a replacement for the old php site written using Next.js.

It connects to the database, provides an article management user interface for the committee and serves api endpoints to the frontend website.

To get up and running for local development you'll need to set a few things up first.

Todo: finish writing set up docs!

* Next auth
* db connection
* more...


## Reader's frontend

The frontend of the website built using Astro.

It uses the edit-backend api endpoints to fetch articles to display on the website.


## MYSQL Database

After having the environment variables created, start the database by docker compose:
```shell
docker volume create website_db_data
docker compose -f local-docker-compose.yml up -d db
```
_Please note: the volume create is there as the volume is registered as external to prevent accidental deletion_

Run the following commands:
```shell
cd edit-backend
export $(grep -v '^#' .env | xargs) # load environment variables into the shell session
npx prisma db seed
npx tsx scripts/create-user.ts
```

The export loads envs into the shell, the second runs the seed script to get the default data

## PHPMYADMIN

Web UI for managing the mysql database

Todo, write docs.


## Valkey

This does not need any setup or configuration, simply start it and point Next.js to it and the code does the rest

## Grafana

Grafana is configured to use Next.js as its own auth server so no users need to be setup.

In addition, the database datasource is preconfigured so there is no need to work out authentication






