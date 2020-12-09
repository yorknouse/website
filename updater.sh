git pull
docker build -t nouse .
docker-compose up -d
docker system prune -f