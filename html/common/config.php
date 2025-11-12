<?php
/*
 * This page must not be edited for each install as it's required by the updater
 *
 * Any settings must go in the environment variables
 */

if (file_exists(__DIR__ . '/../../keys.php')) require_once(__DIR__ . '/../../keys.php'); //Some instances can't define environment variables so use this PHP file as a workaround

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
require_once(__DIR__ . '/libs/email/main.php'); //Email sending lib

final readonly class Config {
    public function __construct(
        public string           $DB_HOSTNAME,
        public string           $DB_DATABASE,
        public string           $DB_USERNAME,
        public string           $DB_PASSWORD,
        public string           $PROJECT_NAME,
        public SendGridConfig   $SENDGRID,
        public ErrorsConfig     $ERRORS,
        public AnalyticsConfig  $ANALYTICS,
        public string           $nextHash,
        public string           $PROJECT_FROM_EMAIL,
        public string           $ROOTFRONTENDURL,
        public string           $DRAFT_VIEW_TOKEN,
        public string           $ROOTBACKENDURL,
        public string           $PROJECT_SUPPORT_EMAIL,
        public string           $FILESTOREURL,
        public string           $ARCHIVEFILESTOREURL,
        public RecaptchaConfig  $RECAPTCHA,
        public EmailConfig      $EMAIL,
        public AwsConfig        $AWS,
        public CloudflareConfig $CLOUDFLARE,
        public string           $IFTTT,
        public GoogleConfig     $GOOGLE,
        public string           $JIRAWIDGET,
        public bool             $DEV,
        public string           $HOSTNAME,
        public VersionConfig    $VERSION,
    ) {}
}

final readonly class SendGridConfig {
    public function __construct(
        public string $APIKEY,
    ) {}
}

final readonly class ErrorsConfig {
    public function __construct(
        public string $SENTRY,
        public string $SENTRYPublic,
    ) {}
}

final readonly class AnalyticsConfig {
    public function __construct(
        public string $FRONTENDTRACKINGID,
        public string $BACKENDTRACKINGID,
    ) {}
}

final readonly class RecaptchaConfig {
    public function __construct(
        public string $KEY,
        public string $SECRET,
    ) {}
}

final readonly class EmailConfig {
    public function __construct(
        public string $HOST,
        public string $USERNAME,
        public string $PASSWORD,
        public string $FROM,
    ) {}
}

final readonly class AwsConfig {
    public function __construct(
        public bool                    $UPLOAD,
        public string                  $KEY,
        public string                  $SECRET,
        public AwsDefaultUploadsConfig $DEFAULTUPLOADS,
        public AwsUploaderConfig       $UPLOADER,
    ) {}
}

final readonly class AwsDefaultUploadsConfig {
    public function __construct(
        public string $BUCKET,
        public string $ENDPOINT,
        public string $REGION,
        public string $CDNEndpoint,
    ) {}
}

final readonly class AwsUploaderConfig {
    public function __construct(
        public string $KEY,
        public string $SECRET,
    ) {}
}

final readonly class CloudflareConfig {
    public function __construct(
        public string $EMAIL,
        public string $KEY,
    ) {}
}

final readonly class GoogleConfig {
    public function __construct(
        public GoogleAuthConfig $AUTH,
    ) {}
}

final readonly class GoogleAuthConfig {
    public function __construct(
        public string $CLIENT,
        public string $SECRET,
    ) {}
}

final class VersionConfig {
    public function __construct(
        public string $COMMIT,
        public string $TAG,
        public string $COMMITFULL,
    ) {}
}

$CONFIG = new Config(
    DB_HOSTNAME: getenv('MYSQL_HOSTNAME'),
    DB_DATABASE: getenv('MYSQL_DATABASE'),
    DB_USERNAME: getenv('MYSQL_USER'),
    DB_PASSWORD: getenv('MYSQL_PASSWORD'),
    PROJECT_NAME: "Nouse",
    SENDGRID: new SendGridConfig(
        APIKEY: getenv('bCMS__SendGridAPIKEY'),
    ),
    ERRORS: new ErrorsConfig(
        SENTRY: getenv('bCMS__SENTRYLOGIN'),
        SENTRYPublic: getenv('bCMS__SENTRYLOGINPUBLIC'),
    ),
    ANALYTICS: new AnalyticsConfig(
        FRONTENDTRACKINGID: getenv('bCMS__GoogleAnalyticsFrontend'),
        BACKENDTRACKINGID: getenv('bCMS__GoogleAnalyticsBackend'),
    ),
    nextHash: "sha256", //Hashing algorithm to put new passwords in
    PROJECT_FROM_EMAIL: getenv('bCMS__EMAIL'),
    ROOTFRONTENDURL: getenv('bCMS__FRONTENDURL'), //Set on a frontend/backend basis
    DRAFT_VIEW_TOKEN: getenv('DRAFT_VIEW_TOKEN'),
    ROOTBACKENDURL: getenv('bCMS__BACKENDURL'), //Set on a frontend/backend basis
    PROJECT_SUPPORT_EMAIL: getenv('bCMS__SUPPORTEMAIL'),
    FILESTOREURL: "https://bbcdn.nouse.co.uk/file",
    ARCHIVEFILESTOREURL: "https://bbcdn.nouse.co.uk/file/nouseOldImageLibrary/archive/public", //Images pre 2019
    RECAPTCHA: new RecaptchaConfig(
        KEY: getenv('bCMS__RECAPTCHA_KEY'),
        SECRET: getenv('bCMS__RECAPTCHA_SECRET'),
    ),
    EMAIL: new EmailConfig(
        HOST: getenv('EMAIL_HOST'),
        USERNAME: getenv('EMAIL_USERNAME'),
        PASSWORD: getenv('EMAIL_PASSWORD'),
        FROM: getenv('EMAIL_FROM'),
    ),
    AWS: new AwsConfig(
        UPLOAD: true,
        KEY: getenv('AWS_ACCESS_KEY_ID'),
        SECRET: getenv('AWS_SECRET_ACCESS_KEY'),
        DEFAULTUPLOADS: new AwsDefaultUploadsConfig(
            BUCKET: getenv('AWS_BUCKET'),
            ENDPOINT: str_replace("https://", "", getenv('AWS_ENDPOINT_URL')),
            REGION: getenv('AWS_DEFAULT_REGION'),
            CDNEndpoint: getenv('AWS_CDN')
        ),
        UPLOADER: new AwsUploaderConfig(
            KEY: getenv('AWS_ACCESS_KEY_ID'),
            SECRET: getenv('AWS_SECRET_ACCESS_KEY')
        ),
    ),
    CLOUDFLARE: new CloudFlareConfig(
        EMAIL: getenv('bCMS__CLOUDFLARE_EMAIL'),
        KEY: getenv('bCMS__CLOUDFLARE_SECRET'),
    ),
    IFTTT: getenv('bCMS__IFTTT'),
    GOOGLE: new GoogleConfig(
        AUTH: new GoogleAuthConfig(
            CLIENT: getenv('bCMS__OAUTHCLIENT'),
            SECRET: getenv('bCMS__OAUTHSECRET'),
        ),
    ),
    JIRAWIDGET: getenv("bCMS__JIRAWIDGET"),
    DEV: getenv('bCMS__ERRORS') == "true",
    HOSTNAME: $_SERVER['HTTP_HOST'],
    VERSION: new VersionConfig(
        COMMIT: exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%h\" -n1 HEAD"),
        TAG: exec("cd " . __DIR__ . "/../../ && git describe --tags --abbrev=0"),
        COMMITFULL: exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%H\" -n1 HEAD"),
    ),
);
# Temporary override
if ($CONFIG->VERSION->COMMIT == null) $CONFIG->VERSION->COMMIT = 'v1.14.0';
if ($CONFIG->VERSION->TAG == null) $CONFIG->VERSION->TAG = 'vDEV';
if ($CONFIG->VERSION->COMMITFULL == null) $CONFIG->VERSION->COMMITFULL = 'DEVFULL';

date_default_timezone_set("UTC");
