FROM php:7.4-apache
RUN apt-get update
COPY docker/php.ini /var/www/php.ini
RUN mv "/var/www/php.ini" "$PHP_INI_DIR/php.ini"

RUN a2dissite 000-default.conf
COPY docker/apache2site.conf /etc/apache2/sites-available/apache2site.conf
RUN a2ensite apache2site.conf
COPY docker/apache2admin.conf /etc/apache2/sites-available/apache2admin.conf
RUN a2ensite apache2admin.conf
RUN a2dismod autoindex -f
RUN a2enmod rewrite

RUN apt-get install -y \
        software-properties-common \
		libfreetype6-dev \
		libjpeg62-turbo-dev \
		libpng-dev \
		libzip-dev \
		libonig-dev \
		zlib1g-dev \
		libicu-dev \
		unzip \
		git \
		nano \
	&& docker-php-ext-configure gd --with-freetype --with-jpeg \
	&& docker-php-ext-install -j$(nproc) gd
RUN docker-php-ext-install zip
RUN docker-php-ext-install mbstring
RUN docker-php-ext-install mysqli
RUN docker-php-ext-install intl
RUN docker-php-ext-install gd

COPY . /var/www/

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www
RUN composer install
# RUN chown -R www-data:www-data html/admin/common/twigCache


# To get in container - docker exec -t -i nouse-container /bin/bash

# docker stats
