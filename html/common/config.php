<?php
/*
 * This page must not be edited for each install as it's required by the updater
 *
 * Any settings must go in the environment variables
 */

if(file_exists(__DIR__ . '/../../keys.php')) require_once (__DIR__ . '/../../keys.php'); //Some instances can't define environment variables so use this PHP file as a workaround

if (getenv('bCMS__ERRORS') == "true") {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL);
}


require_once(__DIR__ . '/../../composer/vendor/autoload.php'); //Composer
require_once(__DIR__ . '/libs/Email/main.php'); //Email sending lib
$CONFIG = array(
    'DB_HOSTNAME' => getenv('MYSQL_HOSTNAME'),
    'DB_DATABASE' => getenv('MYSQL_DATABASE'),
    'DB_USERNAME' => getenv('MYSQL_USER'), //CREATE INSERT SELECT UPDATE DELETE needed
    'DB_PASSWORD' => getenv('MYSQL_PASSWORD'),
    'PROJECT_NAME' => "Nouse",
    'SENDGRID' => ['APIKEY' => getenv('bCMS__SendGridAPIKEY')],
    'ERRORS' => ['SENTRY' => getenv('bCMS__SENTRYLOGIN'), "SENTRYPublic" => getenv('bCMS__SENTRYLOGINPUBLIC')],
    'ANALYTICS' => ['FRONTENDTRACKINGID' => getenv('bCMS__GoogleAnalyticsFrontend'),'BACKENDTRACKINGID' => getenv('bCMS__GoogleAnalyticsBackend')],
    "nextHash" => "sha256", //Hashing algorithm to put new passwords in
    "PROJECT_FROM_EMAIL" => getenv('bCMS__EMAIL'),
    "ROOTFRONTENDURL" => getenv('bCMS__FRONTENDURL'), //Set on a frontend/backend basis
    "ROOTBACKENDURL" => getenv('bCMS__BACKENDURL'), //Set on a frontend/backend basis
    "PROJECT_SUPPORT_EMAIL" => getenv('bCMS__SUPPORTEMAIL'),
    "FILESTOREURL" => "https://bbcdn.nouse.co.uk/file",
    "ARCHIVEFILESTOREURL" => "https://bbcdn.nouse.co.uk/file/nouseOldImageLibrary/archive/public", //Images pre 2019
    "RECAPTCHA" => ['KEY' => getenv('bCMS__RECAPTCHA_KEY'), 'SECRET' => getenv('bCMS__RECAPTCHA_SECRET')],
    'EMAIL' => [
        'HOST' => getenv('EMAIL_HOST'),
        'USERNAME' => getenv('EMAIL_USERNAME'),
        'PASSWORD' => getenv('EMAIL_PASSWORD'),
        'FROM' => getenv('EMAIL_FROM'),
    ],
    'AWS' => [
        'UPLOAD' => true,
        'KEY' => getenv('AWS_ACCESS_KEY_ID'),
        'SECRET' => getenv('AWS_SECRET_ACCESS_KEY'),
        'DEFAULTUPLOADS' => [
            'BUCKET' => getenv('AWS_BUCKET'),
            'ENDPOINT' =>  str_replace("https://","",getenv('AWS_ENDPOINT_URL')),
            'REGION' => getenv('AWS_DEFAULT_REGION'),
            'CDNEndpoint' => getenv('AWS_CDN')
        ], "UPLOADER" => [
            "KEY" => getenv('AWS_ACCESS_KEY_ID'),
            "SECRET" =>  getenv('AWS_SECRET_ACCESS_KEY')
        ]
    ],
    "CLOUDFLARE" => ['EMAIL' => getenv('bCMS__CLOUDFLARE_EMAIL'), 'KEY' => getenv('bCMS__CLOUDFLARE_SECRET')],
    "IFTTT" => getenv('bCMS__IFTTT'),
    "GOOGLE" => ["AUTH" => ["CLIENT" => getenv('bCMS__OAUTHCLIENT'),  "SECRET" => getenv('bCMS__OAUTHSECRET')]],
    'JIRAWIDGET' => getenv("bCMS__JIRAWIDGET"),
    'DEV' => (getenv('bCMS__ERRORS') == "true" ? true : false),
    'HOSTNAME' => $_SERVER['HTTP_HOST'],
    'VERSION' => ['COMMIT' => exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%h\" -n1 HEAD"), 'TAG' => exec("cd " . __DIR__ . "/../../ && git describe --tags --abbrev=0"), "COMMITFULL" => exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%H\" -n1 HEAD")],
);
# Temporary override
if ($CONFIG['VERSION']['COMMIT'] == null) $CONFIG['VERSION']['COMMIT'] = 'v1.14.0';
if ($CONFIG['VERSION']['TAG'] == null) $CONFIG['VERSION']['TAG'] = 'vDEV';
if ($CONFIG['VERSION']['COMMITFULL'] == null) $CONFIG['VERSION']['COMMITFULL'] = 'DEVFULL';

date_default_timezone_set("UTC");
