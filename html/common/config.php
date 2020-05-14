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
    'DB_HOSTNAME' => getenv('bCMS__DB_HOSTNAME'),
    'DB_DATABASE' => getenv('bCMS__DB_DATABASE'),
    'DB_USERNAME' => getenv('bCMS__DB_USERNAME'), //CREATE INSERT SELECT UPDATE DELETE needed
    'DB_PASSWORD' => getenv('bCMS__DB_PASSWORD'),
    'PROJECT_NAME' => getenv('bCMS__SITENAME'),
    'SENDGRID' => ['APIKEY' => getenv('bCMS__SendGridAPIKEY')],
    'ERRORS' => ['SENTRY' => getenv('bCMS__SENTRYLOGIN'), "SENTRYPublic" => getenv('bCMS__SENTRYLOGINPUBLIC')],
    'ANALYTICS' => ['FRONTENDTRACKINGID' => getenv('bCMS__GoogleAnalyticsFrontend'),'BACKENDTRACKINGID' => getenv('bCMS__GoogleAnalyticsBackend')],
    "nextHash" => "sha256", //Hashing algorithm to put new passwords in
    "PROJECT_FROM_EMAIL" => getenv('bCMS__EMAIL'),
    "ROOTFRONTENDURL" => getenv('bCMS__FRONTENDURL'), //Set on a frontend/backend basis
    "ROOTBACKENDURL" => getenv('bCMS__BACKENDURL'), //Set on a frontend/backend basis
    "PROJECT_SUPPORT_EMAIL" => getenv('bCMS__SUPPORTEMAIL'),
    "FILESTOREURL" => getenv('bCMS__FILESTOREURL'),
    "RECAPTCHA" => ['KEY' => getenv('bCMS__RECAPTCHA_KEY'), 'SECRET' => getenv('bCMS__RECAPTCHA_SECRET')],
    'AWS' => ['UPLOAD' => true, 'KEY' => getenv('bCMS__S3_KEY'), 'SECRET' => getenv('bCMS__S3_SECRET'), 'DEFAULTUPLOADS' => ['BUCKET' => getenv('bCMS__S3_BUCKET'), 'ENDPOINT' =>  getenv('bCMS__S3_ENDPOINT'), 'REGION' => getenv('bCMS__S3_REGION'), 'CDNEndpoint' => getenv('bCMS__S3_CDN')], "FINEUPLOADER" => ["KEY" => getenv('bCMS__S3_KEY'), "SECRET" =>  getenv('bCMS__S3_SECRET')]],
    "CLOUDFLARE" => ['EMAIL' => getenv('bCMS__CLOUDFLARE_EMAIL'), 'KEY' => getenv('bCMS__CLOUDFLARE_SECRET')],
    "IFTTT" => getenv('bCMS__IFTTT'),
    "GOOGLE" => ["AUTH" => ["CLIENT" => getenv('bCMS__OAUTHCLIENT'),  "SECRET" => getenv('bCMS__OAUTHSECRET')]],
    "APPLE" => ["NEWS" => ["CHANNEL" => getenv('bCMS__APPLENEWSCHANNEL'), "KEY" => getenv('bCMS__APPLENEWSKEY'), "SECRET" => getenv('bCMS__APPLENEWSSECRET')]],
    'DEV' => (getenv('bCMS__ERRORS') == "true" ? true : false),
    'VERSION' => ['COMMIT' => exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%h\" -n1 HEAD"), 'TAG' => exec("cd " . __DIR__ . "/../../ && git describe --tags --abbrev=0"), "COMMITFULL" => exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%H\" -n1 HEAD")],
);
if ($CONFIG['VERSION']['COMMIT'] == null) $CONFIG['VERSION']['COMMIT'] = 'DEV';
if ($CONFIG['VERSION']['TAG'] == null) $CONFIG['VERSION']['TAG'] = 'vDEV';
if ($CONFIG['VERSION']['COMMITFULL'] == null) $CONFIG['VERSION']['COMMITFULL'] = 'DEVFULL';

date_default_timezone_set("UTC");
