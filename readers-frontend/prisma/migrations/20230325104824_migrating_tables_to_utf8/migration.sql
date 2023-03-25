-- AlterTable actions to utf8mb4
ALTER TABLE `actions` CHANGE `actions_name` `actions_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `actions_dependent` `actions_dependent` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `actions_incompatible` `actions_incompatible` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable actionsCategories to utf8mb4
ALTER TABLE `actionsCategories` CHANGE `actionsCategories_name` `actionsCategories_name` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- AlterTable adverts to utf8mb4
ALTER TABLE `adverts` CHANGE `adverts_name` `adverts_name` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `adverts_notes` `adverts_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `adverts_link` `adverts_link` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable articles to utf8mb4
ALTER TABLE `articles` CHANGE `articles_categories` `articles_categories` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `articles_authors` `articles_authors` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articles_editionPage` `articles_editionPage` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT "Can't be a number as MUSE is like \"M4\" etc",
CHANGE `articles_slug` `articles_slug` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articles_extraMetadata` `articles_extraMetadata` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Stuff from the wordpress import',
CHANGE `articles_thumbnail` `articles_thumbnail` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articles_archiveFallback` `articles_archiveFallback` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articles_socialConfig` `articles_socialConfig` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1,0,1,0' COMMENT 'CSV of config of whether to post to social media - fields:\r\nShould it be posted on facebook?, has it been posted on facebook?, Should it be posted on twitter?, has it been posted on twitter?',
CHANGE `articles_socialExcerpt` `articles_socialExcerpt` VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Custom excerpt for social media posting';

-- AlterTable articlesDrafts to utf8mb4
ALTER TABLE `articlesDrafts` CHANGE `articlesDrafts_headline` `articlesDrafts_headline` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `articlesDrafts_excerpt` `articlesDrafts_excerpt` VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articlesDrafts_text` `articlesDrafts_text` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articlesDrafts_markdown` `articlesDrafts_markdown` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articlesDrafts_infoBox` `articlesDrafts_infoBox` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articlesDrafts_thumbnailCredit` `articlesDrafts_thumbnailCredit` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articlesDrafts_changelog` `articlesDrafts_changelog` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable auditLog to utf8mb4
ALTER TABLE `auditLog` CHANGE `auditLog_actionType` `auditLog_actionType` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `auditLog_actionTable` `auditLog_actionTable` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `auditLog_actionData` `auditLog_actionData` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable authTokens to utf8mb4
ALTER TABLE `authTokens` CHANGE `authTokens_token` `authTokens_token` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `authTokens_ipAddress` `authTokens_ipAddress` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable categories to utf8mb4
ALTER TABLE `categories` CHANGE `categories_displayName` `categories_displayName` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `categories_name` `categories_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `categories_featured` `categories_featured` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'The (normally 6) articles that are to be featured on the mosaic for that category ',
CHANGE `categories_facebook` `categories_facebook` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `categories_twitter` `categories_twitter` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `categories_instagram` `categories_instagram` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `categories_backgroundColor` `categories_backgroundColor` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'The colour for this category - MUSE is black for example',
CHANGE `categories_backgroundColorContrast` `categories_backgroundColorContrast` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT "What's the matching colour for this background? If it\'s black then this will be white etc.",
CHANGE `categories_customTheme` `categories_customTheme` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Filename of the custom twig theme for this category',
CHANGE `categories_socialMediaOverlay` `categories_socialMediaOverlay` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable comments to utf8mb4
ALTER TABLE `comments` CHANGE `comments_authorName` `comments_authorName` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `comments_authorEmail` `comments_authorEmail` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `comments_authorURL` `comments_authorURL` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `comments_authorIP` `comments_authorIP` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `comments_text` `comments_text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `comments_notes` `comments_notes` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Notes on the comment about why it was deleted etc',
CHANGE `comments_metadata` `comments_metadata` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable editions to utf8mb4
ALTER TABLE `editions` CHANGE `editions_name` `editions_name` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `editions_excerpt` `editions_excerpt` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `editions_slug` `editions_slug` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `editions_featuredHighlights` `editions_featuredHighlights` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `editions_type` `editions_type` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable emailSent to utf8mb4
ALTER TABLE `emailSent` CHANGE `emailSent_html` `emailSent_html` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `emailSent_subject` `emailSent_subject` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `emailSent_fromEmail` `emailSent_fromEmail` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `emailSent_fromName` `emailSent_fromName` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `emailSent_toName` `emailSent_toName` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `emailSent_toEmail` `emailSent_toEmail` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- AlterTable emailVerificationCodes to utf8mb4
ALTER TABLE `emailVerificationCodes` CHANGE `emailVerificationCodes_code` `emailVerificationCodes_code` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- AlterTable featuredHome to utf8mb4
ALTER TABLE `featuredHome` CHANGE `featuredHome_articles` `featuredHome_articles` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable passwordResetCodes to utf8mb4
ALTER TABLE `passwordResetCodes` CHANGE `passwordResetCodes_code` `passwordResetCodes_code` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- AlterTable positions to utf8mb4
ALTER TABLE `positions` CHANGE `positions_displayName` `positions_displayName` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `positions_positionsGroups` `positions_positionsGroups` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable positionsGroups to utf8mb4
ALTER TABLE `positionsGroups` CHANGE `positionsGroups_name` `positionsGroups_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `positionsGroups_actions` `positionsGroups_actions` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable quickLinks to utf8mb4
ALTER TABLE `quickLinks` CHANGE `quickLinks_string` `quickLinks_string` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `quickLinks_pointsTo` `quickLinks_pointsTo` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Include https:// etc. in case we want to use it for deep app linking',
CHANGE `quickLinks_notes` `quickLinks_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable s3files to utf8mb4
ALTER TABLE `s3files` CHANGE `s3files_path` `s3files_path` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'NO LEADING /',
CHANGE `s3files_filename` `s3files_filename` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_extension` `s3files_extension` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_original_name` `s3files_original_name` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'What was this file originally called when it was uploaded? For things like file attachments\r\n',
CHANGE `s3files_region` `s3files_region` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_endpoint` `s3files_endpoint` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_cdn_endpoint` `s3files_cdn_endpoint` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_bucket` `s3files_bucket` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `s3files_meta_caption` `s3files_meta_caption` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable userPositions to utf8mb4
ALTER TABLE `userPositions` CHANGE `userPositions_displayName` `userPositions_displayName` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `userPositions_extraPermissions` `userPositions_extraPermissions` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Allow a few extra permissions to be added just for this user for that exact permissions term\r\n';

-- AlterTable users to utf8mb4
ALTER TABLE `users` CHANGE `users_googleAppsUsernameYork` `users_googleAppsUsernameYork` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'University of York username',
CHANGE `users_googleAppsUsernameNouse` `users_googleAppsUsernameNouse` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Nouse google apps account username',
CHANGE `users_name1` `users_name1` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_name2` `users_name2` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_notes` `users_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Internal Notes - Not visible to user',
CHANGE `users_thumbnail` `users_thumbnail` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_social_facebook` `users_social_facebook` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_social_twitter` `users_social_twitter` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_social_instagram` `users_social_instagram` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_social_linkedin` `users_social_linkedin` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_social_snapchat` `users_social_snapchat` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_bio` `users_bio` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_archive_username` `users_archive_username` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_archive_email` `users_archive_email` VARCHAR(257) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `articles_featured` `articles_featured` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
CHANGE `users_pronouns` `users_pronouns` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;

-- AlterTable usersOauthCodes to utf8mb4
ALTER TABLE `usersOauthCodes` CHANGE `usersOauthCodes_code` `usersOauthCodes_code` VARCHAR(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `usersOauthCodes_client` `usersOauthCodes_client` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
CHANGE `usersOauthCodes_type` `usersOauthCodes_type` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;