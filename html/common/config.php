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

require_once(__DIR__ . '/configClasses.php');
require_once(__DIR__ . '/../../composer/vendor/autoload.php'); //Composer
require_once(__DIR__ . '/libs/email/main.php'); //Email sending lib

function missingVariable(bool $dev, string $message): void {
    if ($dev) {
        echo $message;
    } else {
        die($message);
    }
}

/** @var bool $dev */
$dev = filter_var(getenv('bCMS__ERRORS'), FILTER_VALIDATE_BOOL);

/** @var string|false $dbHostname */
$dbHostname = getenv('MYSQL_HOSTNAME');
if (!$dbHostname) {
    die("MYSQL_HOSTNAME not set");
}

/** @var string|false $dbDatabase */
$dbDatabase = getenv('MYSQL_DATABASE');
if (!$dbDatabase) {
    die("MYSQL_DATABASE not set");
}

/** @var string|false $dbUsername */
$dbUsername = getenv('MYSQL_USERNAME');
if (!$dbUsername) {
    die("MYSQL_USERNAME not set");
}

/** @var string|false $dbPassword */
$dbPassword = getenv('MYSQL_PASSWORD');
if (!$dbPassword) {
    die("MYSQL_PASSWORD not set");
}

/** @var string|false $googleAuthClient */
$googleAuthClient = getenv('bCMS__OAUTHCLIENT');
if (!$googleAuthClient) {
    die("bCMS__OAUTHCLIENT not set");
}
/** @var string|false $googleAuthSecret */
$googleAuthSecret = getenv('bCMS__OAUTHSECRET');
if (!$googleAuthSecret) {
    die("bCMS__OAUTHSECRET not set");
}
$googleConfig = new GoogleConfig(
    AUTH: new GoogleAuthConfig(
        CLIENT: $googleAuthClient,
        SECRET: $googleAuthSecret,
    ),
);

/** @var string|false $recaptchaKey */
$recaptchaKey = getenv('bCMS__RECAPTCHA_KEY');
/** @var string|false $recaptchaSecret */
$recaptchaSecret = getenv('bCMS__RECAPTCHA_SECRET');
/** @var RecaptchaConfig|null $recaptchaConfig */
$recaptchaConfig = null;
if ($recaptchaKey && $recaptchaSecret) {
    $recaptchaConfig = new RecaptchaConfig(
        KEY: $recaptchaKey,
        SECRET: $recaptchaSecret,
    );
}

/** @var string|false $emailHost */
$emailHost = getenv('EMAIL_HOST');
if ($emailHost === false) {
    missingVariable($dev, "EMAIL_HOST not set");
}
/** @var string|false $emailUsername */
$emailUsername = getenv('EMAIL_USERNAME');
if ($emailUsername === false) {
    missingVariable($dev, "EMAIL_USERNAME not set");
}
/** @var string|false $emailPassword */
$emailPassword = getenv('EMAIL_PASSWORD');
if ($emailPassword === false) {
    missingVariable($dev, "EMAIL_PASSWORD not set");
}
/** @var string|false $emailFrom */
$emailFrom = getenv('EMAIL_FROM');
if ($emailFrom === false) {
    missingVariable($dev, "EMAIL_FROM not set");
}
/** @var EmailConfig|null $emailConfig */
$emailConfig = null;
if ($emailHost && $emailUsername && $emailPassword && $emailFrom) {
    $emailConfig = new EmailConfig(
        HOST: $emailHost,
        USERNAME: $emailUsername,
        PASSWORD: $emailPassword,
        FROM: $emailFrom,
    );
}

/** @var string|false $awsAccessKey */
$awsAccessKey = getenv('AWS_ACCESS_KEY_ID');
if ($awsAccessKey === false) {
    missingVariable($dev, "AWS_ACCESS_KEY_ID not set");
}
/** @var string|false $awsAccessSecret */
$awsAccessSecret = getenv('AWS_SECRET_ACCESS_KEY');
if ($awsAccessSecret === false) {
    missingVariable($dev, "AWS_SECRET_ACCESS_KEY not set");
}
/** @var string|false $awsBucket */
$awsBucket = getenv('AWS_BUCKET');
if ($awsBucket === false) {
    missingVariable($dev, "AWS_BUCKET not set");
}
/** @var string|false $awsEndpointRaw */
$awsEndpointRaw = getenv('AWS_ENDPOINT_URL');
if ($awsEndpointRaw === false) {
    missingVariable($dev, "AWS_ENDPOINT_URL not set");
    $awsEndpointRaw = "";
}
/** @var string $awsEndpoint */
$awsEndpoint = str_replace("https://", "", $awsEndpointRaw);
if (strlen($awsEndpoint) == 0) {
    missingVariable($dev, "AWS_ENDPOINT_URL not set");
}
/** @var string|false $awsRegion */
$awsRegion = getenv('AWS_DEFAULT_REGION');
if ($awsRegion === false) {
    missingVariable($dev, "AWS_DEFAULT_REGION not set");
}
/** @var string|false $awsCDN */
$awsCDN = getenv('AWS_CDN');
if ($awsCDN === false) {
    missingVariable($dev, "AWS_CDN not set");
}
/** @var AwsConfig|null $awsConfig */
$awsConfig = null;
if ($awsAccessKey && $awsAccessSecret && $awsBucket && $awsEndpoint && $awsRegion && $awsCDN) {
    $awsConfig = new AwsConfig(
        UPLOAD: true,
        KEY: $awsAccessKey,
        SECRET: $awsAccessSecret,
        DEFAULTUPLOADS: new AwsDefaultUploadsConfig(
            BUCKET: $awsBucket,
            ENDPOINT: $awsEndpoint,
            REGION: $awsRegion,
            CDNEndpoint: $awsCDN,
        ),
        UPLOADER: new AwsUploaderConfig(
            KEY: $awsAccessKey,
            SECRET: $awsAccessSecret,
        ),
    );
}

/** @var string|false $sendGridApiKey */
$sendGridApiKey = getenv('bCMS__SendGridAPIKEY');
/** @var SendGridConfig|null $sendGridConfig */
$sendGridConfig = null;
if ($sendGridApiKey) {
    $sendGridConfig = new SendGridConfig(
        $sendGridApiKey,
    );
}

/** @var string|false $sentryLogin */
$sentryLogin = getenv('bCMS__SENTRYLOGIN');
/** @var string|false $sentryPublicLogin */
$sentryPublicLogin = getenv('bCMS__SENTRYLOGINPUBLIC');
/** @var ErrorsConfig|null $sentryConfig */
$sentryConfig = null;
if ($sentryLogin) {
    $sentryConfig = new ErrorsConfig(
        $sentryLogin,
        $sentryPublicLogin ?: null,
    );
}

/** @var string|false $frontendTrackingId */
$frontendTrackingId = getenv('bCMS__GoogleAnalyticsFrontend');
/** @var string|false $backendTrackingId */
$backendTrackingId = getenv('bCMS__GoogleAnalyticsBackend');
/** @var AnalyticsConfig|null $analyticsConfig */
$analyticsConfig = null;
if ($frontendTrackingId && $backendTrackingId) {
    $analyticsConfig = new AnalyticsConfig(
        $frontendTrackingId,
        $backendTrackingId,
    );
}

/** @var string|false $projectFromEmail */
$projectFromEmail = getenv('bCMS__EMAIL');
if (!$projectFromEmail) {
    $projectFromEmail = "support@nouse.co.uk";
}

/** @var string|false $projectSupportEmail */
$projectSupportEmail = getenv('bCMS__SUPPORTEMAIL');
if (!$projectSupportEmail) {
    $projectSupportEmail = $projectFromEmail;
}

/** @var string|false $rootFrontend */
$rootFrontend = getenv('bCMS__FRONTENDURL');
if (!$rootFrontend) {
    $rootFrontend = "https://nouse.co.uk";
}

/** @var string|false $draftViewToken */
$draftViewToken = getenv('DRAFT_VIEW_TOKEN');

/** @var string|false $rootBackend */
$rootBackend = getenv('bCMS__BACKENDURL');
if (!$rootBackend) {
    $rootBackend = "https://edit.nouse.co.uk";
}

/** @var string|false $cloudflareEmail */
$cloudflareEmail = getenv('bCMS__CLOUDFLARE_EMAIL');
/** @var string|false $cloudflareKey */
$cloudflareKey = getenv('bCMS__CLOUDFLARE_SECRET');
/** @var CloudflareConfig|null $cloudflareConfig */
$cloudflareConfig = null;
if ($cloudflareEmail && $cloudflareKey) {
    $cloudflareConfig = new CloudflareConfig(
        EMAIL: $cloudflareEmail,
        KEY: $cloudflareKey,
    );
}

/** @var string|false $ifttt */
$ifttt = getenv('bCMS__IFTTT');

/** @var string|false $jiraWidget */
$jiraWidget = getenv("bCMS__JIRAWIDGET");

$commit = exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%h\" -n1 HEAD");
if (!$commit) $commit = "v1.14.0";

$tag = exec("cd " . __DIR__ . "/../../ && git describe --tags --abbrev=0");
if (!$tag) $tag = "vDEV";

$commitFull = exec("cd " . __DIR__ . "/../../ && git log --pretty=\"%H\" -n1 HEAD");
if (!$commitFull) $commitFull = "DEVFULL";

$versionConfig = new VersionConfig(
    COMMIT: $commit,
    TAG: $tag,
    COMMITFULL: $commitFull,
);

$CONFIG = new Config(
    DB_HOSTNAME: $dbHostname,
    DB_DATABASE: $dbDatabase,
    DB_USERNAME: $dbUsername,
    DB_PASSWORD: $dbPassword,
    PROJECT_NAME: "Nouse",
    SENDGRID: $sendGridConfig,
    ERRORS: $sentryConfig,
    ANALYTICS: $analyticsConfig,
    nextHash: "sha256", //Hashing algorithm to put new passwords in
    PROJECT_FROM_EMAIL: $projectFromEmail,
    ROOTFRONTENDURL: $rootFrontend, //Set on a frontend/backend basis
    DRAFT_VIEW_TOKEN: $draftViewToken ?: null,
    ROOTBACKENDURL: $rootBackend, //Set on a frontend/backend basis
    PROJECT_SUPPORT_EMAIL: $projectSupportEmail,
    FILESTOREURL: "https://bbcdn.nouse.co.uk/file",
    ARCHIVEFILESTOREURL: "https://bbcdn.nouse.co.uk/file/nouseOldImageLibrary/archive/public", //Images pre 2019
    RECAPTCHA: $recaptchaConfig,
    EMAIL: $emailConfig,
    AWS: $awsConfig,
    CLOUDFLARE: $cloudflareConfig,
    IFTTT: $ifttt ?: null,
    GOOGLE: $googleConfig,
    JIRAWIDGET: $jiraWidget ?: null,
    DEV: $dev,
    HOSTNAME: $_SERVER['HTTP_HOST'],
    VERSION: $versionConfig,
);

date_default_timezone_set("UTC");
