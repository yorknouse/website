<?php
/*
 * This page must not be edited for each install as it's required by the updater
 *
 * Any settings must go in the environment variables
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once (__DIR__ . '/../../keys.php');
require_once(__DIR__ . '/../../composer/vendor/autoload.php'); //Composer
require_once(__DIR__ . '/libs/Auth/main.php');
require_once(__DIR__ . '/libs/Email/main.php');
$CONFIG = array(
    'DB_HOSTNAME' => getenv('bCMS__DB_HOSTNAME'),
    'DB_DATABASE' => getenv('bCMS__DB_DATABASE'),
    'DB_USERNAME' => getenv('bCMS__DB_USERNAME'), //CREATE INSERT SELECT UPDATE DELETE
    'DB_PASSWORD' => getenv('bCMS__DB_PASSWORD'),
    'PROJECT_NAME' => getenv('bCMS__SITENAME'),
    'SENDGRID' => ['APIKEY' => getenv('bCMS__SendGridAPIKEY')],
    //'ERRORS' => ['SENTRY' => getenv('bCMS__SENTRYLOGIN'), "SENTRYPublic" => getenv('bCMS__SENTRYLOGINPUBLIC'), 'URL' => 'https://google.com'],
    'ANALYTICS' => ['TRACKINGID' => getenv('bCMS__GoogleAnalytics')],
    "nextHash" => "sha256", //Hashing algorithm to put new passwords in
    "PROJECT_FROM_EMAIL" => "tech@nouse.co.uk",
    "ROOTURL" => "http://139.59.170.70/admin",
    "PROJECT_SUPPORT_EMAIL" => "support@nouse.co.uk",
);
date_default_timezone_set("UTC");
