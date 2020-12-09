ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts # Has to be done so Composer can download our dependency from Github
git pull
docker build -t nouse .
docker-compose up -d
docker system prune -f