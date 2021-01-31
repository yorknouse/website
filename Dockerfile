FROM php:7.4-apache
RUN apt-get update
COPY docker/php.ini /var/www/php.ini
RUN mv "/var/www/php.ini" "$PHP_INI_DIR/php.ini"

RUN a2dissite 000-default.conf
RUN a2dismod autoindex -f
RUN a2enmod rewrite

COPY docker/apache/apache2site.conf /etc/apache2/sites-available/apache2site.conf
RUN a2ensite apache2site.conf
COPY docker/apache/apache2admin.conf /etc/apache2/sites-available/apache2admin.conf
RUN a2ensite apache2admin.conf
COPY docker/apache/001default-apache2.conf /etc/apache2/sites-available/001default-apache2.conf
RUN a2ensite 001default-apache2.conf

RUN apt-get install -y -qq \
        software-properties-common \
		libfreetype6-dev \
		libjpeg62-turbo-dev \
		libpng-dev \
		libjpeg-dev \
		libzip-dev \
		libonig-dev \
		zlib1g-dev \
		libicu-dev \
		unzip \
		git \
		nano \
		cron \
		dos2unix \
		&& apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --enable-gd
RUN docker-php-ext-install -j$(nproc) gd zip mbstring mysqli intl

COPY docker/job-cron /etc/cron.d/job-cron
RUN chmod 0644 /etc/cron.d/job-cron
RUN dos2unix /etc/cron.d/job-cron
RUN crontab /etc/cron.d/job-cron
RUN touch /var/log/cron.log
RUN chmod 0777 /var/log/cron.log

COPY . /var/www/

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www
RUN composer install

COPY docker/start.sh /var/www/start.sh
RUN dos2unix /var/www/start.sh

# To get in container - docker exec -t -i nouse-container /bin/bash

CMD ["bash","/var/www/start.sh"]