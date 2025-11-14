<?php

final readonly class Config {
    public function __construct(
        public string                $DB_HOSTNAME,
        public string                $DB_DATABASE,
        public string                $DB_USERNAME,
        public string                $DB_PASSWORD,
        public string                $PROJECT_NAME,
        public SendGridConfig|null   $SENDGRID,
        public ErrorsConfig|null     $ERRORS,
        public AnalyticsConfig|null  $ANALYTICS,
        public string                $nextHash,
        public string                $PROJECT_FROM_EMAIL,
        public string                $ROOTFRONTENDURL,
        public string|null           $DRAFT_VIEW_TOKEN,
        public string                $ROOTBACKENDURL,
        public string                $PROJECT_SUPPORT_EMAIL,
        public string                $FILESTOREURL,
        public string                $ARCHIVEFILESTOREURL,
        public RecaptchaConfig|null  $RECAPTCHA,
        public EmailConfig|null      $EMAIL,
        public AwsConfig|null        $AWS,
        public CloudflareConfig|null $CLOUDFLARE,
        public string|null           $IFTTT,
        public GoogleConfig          $GOOGLE,
        public string|null           $JIRAWIDGET,
        public bool                  $DEV,
        public string                $HOSTNAME,
        public VersionConfig         $VERSION,
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
        public string|null $SENTRYPublic,
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
