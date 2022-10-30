# Local Development

To set up a local development environment run:

```
docker-compose -f local-docker-compose.yml up -d
```

Whenever you make a change to the code or any of the configuration files run:

```
docker-compose -f local-docker-compose.yml up -d --build
```

# Database set-up

Grab a copy of the current production database by visiting the phpmyadmin production page and clicking on the `Export` button. You should be able to download a `db.sql` file. Once you get the file, run:

```
docker cp ~/Downloads/db.sql db:/home/db.sql
```

The command above will copy the database dump from your download folder onto the database container filesystem.
You now need to open a shell within the container and run:

```
mysql -u userDocker -p nouse < /home/db.sql
```

You will be asked to enter a password. It's the MYSQL_PASSWORD defined in the Dockerfile.local. `passDocker` if you did not make any changes. After entering the password the container will most likely freeze. If you don't see an increase in CPU and/or RAM usage something went wrong. Otherwise, in about 2 minutes (depending on your machine) you should see the `docker_compressor` container come online. You are now all set.

# PHP MYADMIN

PHPMYADMIN is available at `localhost:800`.
