-- CreateTable
CREATE TABLE `actions` (
    `actions_id` INTEGER NOT NULL AUTO_INCREMENT,
    `actions_name` VARCHAR(255) NOT NULL,
    `actionsCategories_id` INTEGER NOT NULL,
    `actions_dependent` VARCHAR(500) NULL,
    `actions_incompatible` VARCHAR(500) NULL,

    INDEX `actions_actionsCategories_id_index`(`actionsCategories_id`),
    PRIMARY KEY (`actions_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actionsCategories` (
    `actionsCategories_id` INTEGER NOT NULL AUTO_INCREMENT,
    `actionsCategories_name` VARCHAR(500) NOT NULL,
    `actionsCategories_order` INTEGER NULL DEFAULT 0,

    INDEX `actionsCategories_actionsCategories_id_index`(`actionsCategories_id`),
    INDEX `actionsCategories_actionsCategories_order_index`(`actionsCategories_order`),
    PRIMARY KEY (`actionsCategories_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adverts` (
    `adverts_id` INTEGER NOT NULL AUTO_INCREMENT,
    `adverts_name` VARCHAR(500) NOT NULL,
    `adverts_notes` TEXT NULL,
    `adverts_default` BOOLEAN NOT NULL DEFAULT false,
    `adverts_bannerImage` INTEGER NULL,
    `adverts_bannerImageMob` INTEGER NULL,
    `adverts_impressions` INTEGER NULL DEFAULT 0,
    `adverts_clicks` INTEGER NULL DEFAULT 0,
    `adverts_enabled` BOOLEAN NOT NULL DEFAULT true,
    `adverts_deleted` BOOLEAN NOT NULL DEFAULT false,
    `adverts_start` TIMESTAMP(0) NULL,
    `adverts_end` TIMESTAMP(0) NULL,
    `adverts_link` VARCHAR(500) NULL,

    INDEX `adverts_s3files_s3files_id_fk`(`adverts_bannerImage`),
    INDEX `adverts_s3files_s3files_id_fk_2`(`adverts_bannerImageMob`),
    PRIMARY KEY (`adverts_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `articles_id` INTEGER NOT NULL AUTO_INCREMENT,
    `articles_published` TIMESTAMP(0) NULL,
    `editions_id` INTEGER NULL,
    `articles_editionPage` VARCHAR(100) NULL,
    `articles_updated` TIMESTAMP(0) NULL,
    `articles_showInLists` BOOLEAN NOT NULL DEFAULT false,
    `articles_showInSearch` BOOLEAN NOT NULL DEFAULT false,
    `articles_showInAdmin` BOOLEAN NOT NULL DEFAULT true,
    `articles_type` INTEGER NOT NULL DEFAULT 1,
    `articles_slug` VARCHAR(255) NULL,
    `articles_extraMetadata` TEXT NULL,
    `articles_thumbnail` VARCHAR(500) NULL,
    `articles_lifetimeViews` INTEGER NULL DEFAULT 0,
    `articles_archiveFallback` VARCHAR(255) NULL,
    `articles_socialConfig` VARCHAR(50) NOT NULL DEFAULT '1,0,1,0',
    `articles_mediaCharterDone` TINYINT NOT NULL DEFAULT 0,
    `articles_socialExcerpt` VARCHAR(2000) NULL,
    `articles_dropCapital` BOOLEAN NOT NULL DEFAULT false,
    `articles_displayImages` BOOLEAN NULL DEFAULT true,
    `articles_isThumbnailPortrait` BOOLEAN NOT NULL DEFAULT false,

    INDEX `articles_articles_id_index`(`articles_id`),
    INDEX `articles_articles_lifetimeViews_index`(`articles_lifetimeViews`),
    INDEX `articles_articles_pdfFallback_index`(`articles_archiveFallback`),
    INDEX `articles_articles_published_index`(`articles_published`),
    INDEX `articles_articles_showInAdmin_index`(`articles_showInAdmin`),
    INDEX `articles_articles_showInLists_index`(`articles_showInLists`),
    INDEX `articles_articles_showInSearch_index`(`articles_showInSearch`),
    INDEX `articles_articles_slug_index`(`articles_slug`),
    INDEX `idx_articles_editions_admin`(`editions_id`, `articles_showInAdmin`),
    INDEX `idx_articles_admin_published`(`articles_showInAdmin`, `articles_published` DESC),
    INDEX `idx_articles_search_published`(`articles_showInSearch`, `articles_published` DESC),
    INDEX `idx_articles_search_publish_id`(`articles_showInSearch`, `articles_published` DESC, articles_id),
    INDEX `idx_articles_editions_id`(`editions_id`),
    FULLTEXT INDEX `articles_articles_slug_idx`(`articles_slug`),
    PRIMARY KEY (`articles_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articlesAuthors` (
    `articles_id` INTEGER NOT NULL,
    `users_userid` INTEGER NOT NULL,

    UNIQUE INDEX `articlesAuthors_articles_id_users_userid_unique`(`articles_id`, `users_userid`),
    INDEX `idx_articlesAuthors_user_articles`(`users_userid`, `articles_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articlesCategories` (
    `articles_id` INTEGER NOT NULL,
    `categories_id` INTEGER NOT NULL,

    UNIQUE INDEX `articlesCategories_articles_id_categories_id_unique`(`articles_id`, `categories_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articlesDrafts` (
    `articlesDrafts_id` INTEGER NOT NULL AUTO_INCREMENT,
    `articles_id` INTEGER NULL,
    `articlesDrafts_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `articlesDrafts_userid` INTEGER NULL,
    `articlesDrafts_headline` VARCHAR(500) NOT NULL,
    `articlesDrafts_excerpt` VARCHAR(2000) NULL,
    `articlesDrafts_text` LONGTEXT NULL,
    `articlesDrafts_markdown` LONGTEXT NULL,
    `articlesDrafts_infoBox` LONGTEXT NULL,
    `articlesDrafts_thumbnailCredit` VARCHAR(500) NULL,
    `articlesDrafts_changelog` TEXT NULL,

    INDEX `articlesDrafts_articles_articles_id_fk`(`articles_id`),
    INDEX `articlesDrafts_users_users_userid_fk`(`articlesDrafts_userid`),
    INDEX `idx_articlesDrafts_article_timestamp`(`articles_id`, `articlesDrafts_timestamp` DESC),
    FULLTEXT INDEX `fts_articleDrafts_headline_excerpt`(`articlesDrafts_headline`, `articlesDrafts_excerpt`),
    PRIMARY KEY (`articlesDrafts_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articlesReads` (
    `articles_id` INTEGER NOT NULL,
    `articlesReads_id` INTEGER NOT NULL AUTO_INCREMENT,
    `articlesReads_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `articlesReads_articles_articles_id_fk`(`articles_id`),
    INDEX `idx_reads_timestamp_id`(`articlesReads_timestamp`, `articles_id`),
    PRIMARY KEY (`articlesReads_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articlesReadsSummary` (
    `articles_id` INTEGER NOT NULL,
    `read_count` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `articlesReadsSummary_articles_articles_id_fk`(`articles_id`),
    INDEX `idx_articlesReadsSummary_readcount_desc`(`read_count` DESC),
    PRIMARY KEY (`articles_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditLog` (
    `auditLog_id` INTEGER NOT NULL AUTO_INCREMENT,
    `auditLog_actionType` VARCHAR(500) NULL,
    `auditLog_actionTable` VARCHAR(500) NULL,
    `auditLog_actionData` VARCHAR(500) NULL,
    `auditLog_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `users_userid` INTEGER NULL,
    `auditLog_actionUserid` INTEGER NULL,

    INDEX `auditLog_users_users_userid_fk`(`users_userid`),
    INDEX `auditLog_users_users_userid_fk_2`(`auditLog_actionUserid`),
    PRIMARY KEY (`auditLog_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authTokens` (
    `authTokens_id` INTEGER NOT NULL AUTO_INCREMENT,
    `authTokens_token` VARCHAR(500) NOT NULL,
    `authTokens_created` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `authTokens_ipAddress` VARCHAR(500) NULL,
    `users_userid` INTEGER NOT NULL,
    `authTokens_valid` BOOLEAN NOT NULL DEFAULT true,
    `authTokens_adminId` INTEGER NULL,

    UNIQUE INDEX `token`(`authTokens_token`),
    INDEX `authTokens_users_users_userid_fk`(`users_userid`),
    INDEX `authTokens_users_users_userid_fk_2`(`authTokens_adminId`),
    PRIMARY KEY (`authTokens_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `categories_id` INTEGER NOT NULL AUTO_INCREMENT,
    `categories_showHome` BOOLEAN NOT NULL DEFAULT true,
    `categories_displayName` VARCHAR(255) NULL,
    `categories_showMenu` BOOLEAN NOT NULL DEFAULT true,
    `categories_name` VARCHAR(255) NOT NULL,
    `categories_showPublic` BOOLEAN NOT NULL DEFAULT false,
    `categories_showAdmin` BOOLEAN NOT NULL DEFAULT true,
    `categories_featured` VARCHAR(500) NULL,
    `categories_order` INTEGER NULL,
    `categories_nestUnder` INTEGER NULL,
    `categories_showSub` BOOLEAN NOT NULL DEFAULT true,
    `categories_facebook` VARCHAR(200) NULL,
    `categories_twitter` VARCHAR(200) NULL,
    `categories_instagram` VARCHAR(200) NULL,
    `categories_backgroundColor` VARCHAR(20) NULL,
    `categories_backgroundColorContrast` VARCHAR(20) NULL,
    `categories_customTheme` VARCHAR(200) NULL,
    `categories_socialMediaOverlay` VARCHAR(200) NULL,

    INDEX `categories_categories_name_index`(`categories_name`),
    INDEX `categories_categories_nestUnder_index`(`categories_nestUnder`),
    INDEX `categories_categories_order_index`(`categories_order`),
    INDEX `categories_categories_showMenu_index`(`categories_showMenu`),
    INDEX `categories_show_index`(`categories_showPublic`, `categories_showAdmin`),
    INDEX `idx_categories_sort`(`categories_nestUnder`, `categories_order`, `categories_displayName`),
    PRIMARY KEY (`categories_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `articles_id` INTEGER NULL,
    `comments_id` INTEGER NOT NULL AUTO_INCREMENT,
    `comments_authorName` VARCHAR(500) NULL,
    `comments_authorEmail` VARCHAR(500) NULL,
    `comments_authorURL` VARCHAR(500) NULL,
    `comments_authorIP` VARCHAR(500) NULL,
    `comments_created` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `comments_text` TEXT NULL,
    `comments_show` BOOLEAN NOT NULL DEFAULT true,
    `comments_approved` BOOLEAN NOT NULL DEFAULT false,
    `comments_approved_userid` INTEGER NULL,
    `comments_approved_timestamp` TIMESTAMP(0) NULL,
    `comments_notes` VARCHAR(1000) NULL,
    `comments_nestUnder` INTEGER NULL,
    `users_userid` INTEGER NULL,
    `comments_upvotes` INTEGER NULL DEFAULT 0,
    `comments_downvotes` INTEGER NULL DEFAULT 0,
    `comments_metadata` TEXT NULL,
    `comments_recaptcha` BOOLEAN NOT NULL DEFAULT true,
    `comments_recaptchaScore` FLOAT NULL,

    INDEX `comments_articles_articles_id_fk`(`articles_id`),
    INDEX `comments_comments_approved_index`(`comments_approved`),
    INDEX `comments_comments_created_index`(`comments_created`),
    INDEX `comments_comments_show_index`(`comments_show`),
    INDEX `comments_comments_upvotes_comments_downvotes_index`(`comments_upvotes`, `comments_downvotes`),
    PRIMARY KEY (`comments_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `editions` (
    `editions_id` INTEGER NOT NULL AUTO_INCREMENT,
    `editions_name` VARCHAR(500) NOT NULL,
    `editions_excerpt` VARCHAR(500) NULL,
    `editions_slug` VARCHAR(200) NOT NULL,
    `editions_printNumber` INTEGER NULL,
    `editions_deleted` BOOLEAN NOT NULL DEFAULT false,
    `editions_published` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editions_show` BOOLEAN NOT NULL DEFAULT true,
    `editions_showHome` BOOLEAN NOT NULL DEFAULT true,
    `editions_thumbnail` INTEGER NULL,
    `editions_headerImage` INTEGER NULL,
    `editions_pdf` INTEGER NULL,
    `editions_pdfOriginal` INTEGER NULL,
    `editions_featuredHighlights` LONGTEXT NULL,
    `editions_type` VARCHAR(100) NULL,

    UNIQUE INDEX `editions_slug`(`editions_slug`),
    INDEX `idx_editions_deleted_published`(`editions_deleted`, `editions_published`),
    PRIMARY KEY (`editions_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emailSent` (
    `emailSent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `users_userid` INTEGER NULL,
    `emailSent_html` LONGTEXT NOT NULL,
    `emailSent_subject` VARCHAR(255) NOT NULL,
    `emailSent_sent` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `emailSent_fromEmail` VARCHAR(200) NOT NULL,
    `emailSent_fromName` VARCHAR(200) NOT NULL,
    `emailSent_toName` VARCHAR(200) NOT NULL,
    `emailSent_toEmail` VARCHAR(200) NOT NULL,

    INDEX `emailSent_users_users_userid_fk`(`users_userid`),
    PRIMARY KEY (`emailSent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emailVerificationCodes` (
    `emailVerificationCodes_id` INTEGER NOT NULL AUTO_INCREMENT,
    `emailVerificationCodes_code` VARCHAR(1000) NOT NULL,
    `emailVerificationCodes_used` BOOLEAN NOT NULL DEFAULT false,
    `emailVerificationCodes_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `emailVerificationCodes_valid` INTEGER NOT NULL DEFAULT 1,
    `users_userid` INTEGER NOT NULL,

    INDEX `emailVerificationCodes_users_users_userid_fk`(`users_userid`),
    PRIMARY KEY (`emailVerificationCodes_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `featuredHome` (
    `featuredHome_id` INTEGER NOT NULL AUTO_INCREMENT,
    `featuredHome_articles` VARCHAR(200) NULL,
    `featuredHome_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `users_userid` INTEGER NULL,

    INDEX `featuredHome_featuredHome_articles_index`(`featuredHome_articles`),
    INDEX `featuredHome_featuredHome_timestamp_index`(`featuredHome_timestamp`),
    INDEX `featuredHome_users_users_userid_fk`(`users_userid`),
    PRIMARY KEY (`featuredHome_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordResetCodes` (
    `passwordResetCodes_id` INTEGER NOT NULL AUTO_INCREMENT,
    `passwordResetCodes_code` VARCHAR(1000) NOT NULL,
    `passwordResetCodes_used` BOOLEAN NOT NULL DEFAULT false,
    `passwordResetCodes_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `passwordResetCodes_valid` INTEGER NOT NULL DEFAULT 1,
    `users_userid` INTEGER NOT NULL,

    INDEX `passwordResetCodes_users_users_userid_fk`(`users_userid`),
    PRIMARY KEY (`passwordResetCodes_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `positions_id` INTEGER NOT NULL AUTO_INCREMENT,
    `positions_displayName` VARCHAR(255) NOT NULL,
    `positions_positionsGroups` VARCHAR(500) NULL,
    `positions_rank` TINYINT UNSIGNED NOT NULL DEFAULT 254,
    `positions_teamPageGroup` INTEGER NOT NULL DEFAULT 4,

    INDEX `positions_positions_id_index`(`positions_id`),
    INDEX `positions_positions_positionsGroups_index`(`positions_positionsGroups`),
    INDEX `positions_positions_rank_index`(`positions_rank`),
    PRIMARY KEY (`positions_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positionsGroups` (
    `positionsGroups_id` INTEGER NOT NULL AUTO_INCREMENT,
    `positionsGroups_name` VARCHAR(255) NOT NULL,
    `positionsGroups_actions` VARCHAR(1000) NULL,

    INDEX `positionsGroups_positionsGroups_id_index`(`positionsGroups_id`),
    PRIMARY KEY (`positionsGroups_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quickLinks` (
    `quickLinks_id` INTEGER NOT NULL AUTO_INCREMENT,
    `quickLinks_string` VARCHAR(100) NOT NULL,
    `quickLinks_pointsTo` VARCHAR(500) NOT NULL,
    `quickLinks_deleted` BOOLEAN NOT NULL DEFAULT false,
    `quickLinks_deletable` BOOLEAN NOT NULL DEFAULT true,
    `quickLinks_created` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `users_userid` INTEGER NOT NULL,
    `quickLinks_notes` TEXT NULL,

    INDEX `quickLinks_quickLinks_created_index`(`quickLinks_created`),
    INDEX `quickLinks_quickLinks_deleted_index`(`quickLinks_deleted`),
    INDEX `quickLinks_quickLinks_string_index`(`quickLinks_string`),
    PRIMARY KEY (`quickLinks_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s3files` (
    `s3files_id` INTEGER NOT NULL AUTO_INCREMENT,
    `s3files_path` VARCHAR(255) NULL,
    `s3files_filename` VARCHAR(255) NOT NULL,
    `s3files_extension` VARCHAR(255) NOT NULL,
    `s3files_original_name` VARCHAR(500) NULL,
    `s3files_region` VARCHAR(255) NOT NULL,
    `s3files_endpoint` VARCHAR(255) NOT NULL,
    `s3files_cdn_endpoint` VARCHAR(255) NOT NULL,
    `s3files_bucket` VARCHAR(255) NOT NULL,
    `s3files_compressed` BOOLEAN NOT NULL DEFAULT false,
    `s3files_meta_size` BIGINT NOT NULL,
    `s3files_meta_public` BOOLEAN NOT NULL DEFAULT false,
    `s3files_meta_type` TINYINT NOT NULL DEFAULT 0,
    `s3files_meta_subType` INTEGER NULL,
    `s3files_meta_uploaded` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `users_userid` INTEGER NULL,
    `s3files_meta_deleteOn` DATE NULL,
    `s3files_meta_physicallyStored` BOOLEAN NOT NULL DEFAULT true,
    `s3files_meta_caption` VARCHAR(500) NULL,

    INDEX `s3files_s3files_id_index`(`s3files_id`),
    INDEX `s3files_s3files_meta_physicallyStored_index`(`s3files_meta_physicallyStored`),
    INDEX `s3files_s3files_meta_public_index`(`s3files_meta_public`),
    INDEX `s3files_s3files_meta_uploaded_index`(`s3files_meta_uploaded`),
    PRIMARY KEY (`s3files_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userPositions` (
    `userPositions_id` INTEGER NOT NULL AUTO_INCREMENT,
    `users_userid` INTEGER NULL,
    `userPositions_start` TIMESTAMP(0) NOT NULL DEFAULT '2000-01-01 00:00:00',
    `userPositions_end` TIMESTAMP(0) NULL,
    `positions_id` INTEGER NULL,
    `userPositions_displayName` VARCHAR(255) NULL,
    `userPositions_extraPermissions` VARCHAR(500) NULL,
    `userPositions_show` BOOLEAN NOT NULL DEFAULT true,

    INDEX `userPositions_positions_positions_id_fk`(`positions_id`),
    INDEX `userPositions_userPositions_show_index`(`userPositions_show`),
    INDEX `userPositions_userPositions_start_userPositions_end_index`(`userPositions_start`, `userPositions_end`),
    INDEX `userPositions_users_users_userid_fk`(`users_userid`),
    PRIMARY KEY (`userPositions_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `users_googleAppsUsernameYork` VARCHAR(200) NULL,
    `users_googleAppsUsernameNouse` VARCHAR(200) NULL,
    `users_name1` VARCHAR(100) NULL,
    `users_name2` VARCHAR(100) NULL,
    `users_userid` INTEGER NOT NULL AUTO_INCREMENT,
    `users_created` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `users_notes` TEXT NULL,
    `users_thumbnail` VARCHAR(200) NULL,
    `users_changepass` BOOLEAN NOT NULL DEFAULT false,
    `users_deleted` BOOLEAN NULL DEFAULT false,
    `users_suspended` BOOLEAN NOT NULL DEFAULT false,
    `users_social_facebook` VARCHAR(100) NULL,
    `users_social_twitter` VARCHAR(100) NULL,
    `users_social_instagram` VARCHAR(100) NULL,
    `users_social_linkedin` VARCHAR(100) NULL,
    `users_social_snapchat` VARCHAR(100) NULL,
    `users_bio` TEXT NULL,
    `users_archive_username` VARCHAR(200) NULL,
    `users_archive_email` VARCHAR(257) NULL,
    `articles_featured` VARCHAR(1000) NULL,
    `users_pronouns` TEXT NULL,

    INDEX `username_2`(`users_userid`),
    INDEX `users_users_created_index`(`users_created`),
    INDEX `users_users_googleAppsUsernameNouse_index`(`users_googleAppsUsernameNouse`),
    INDEX `users_users_googleAppsUsernameYork_index`(`users_googleAppsUsernameYork`),
    INDEX `users_users_suspended_index`(`users_suspended`),
    INDEX `idx_users_userid_deleted`(`users_userid`, `users_deleted`),
    FULLTEXT INDEX `idx_users_name1_fulltext`(`users_name1`),
    FULLTEXT INDEX `idx_users_name2_fulltext`(`users_name2`),
    FULLTEXT INDEX `idx_users_name_fulltext`(`users_name1`, `users_name2`),
    PRIMARY KEY (`users_userid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usersOauthCodes` (
    `usersOauthCodes_id` INTEGER NOT NULL AUTO_INCREMENT,
    `usersOauthCodes_code` VARCHAR(250) NOT NULL,
    `usersOauthCodes_valid` TINYINT NOT NULL,
    `usersOauthCodes_expiry` TIMESTAMP(0) NOT NULL,
    `usersOauthCodes_client` VARCHAR(200) NOT NULL,
    `usersOauthCodes_type` VARCHAR(200) NULL,
    `users_userid` INTEGER NOT NULL,

    PRIMARY KEY (`usersOauthCodes_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_actionsCategories_actionsCategories_id_fk` FOREIGN KEY (`actionsCategories_id`) REFERENCES `actionsCategories`(`actionsCategories_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `adverts` ADD CONSTRAINT `adverts_s3files_s3files_id_fk` FOREIGN KEY (`adverts_bannerImage`) REFERENCES `s3files`(`s3files_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adverts` ADD CONSTRAINT `adverts_s3files_s3files_id_fk_2` FOREIGN KEY (`adverts_bannerImageMob`) REFERENCES `s3files`(`s3files_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `idx_articles_editions_id` FOREIGN KEY (`editions_id`) REFERENCES `editions`(`editions_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesAuthors` ADD CONSTRAINT `articlesAuthors_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesAuthors` ADD CONSTRAINT `articlesAuthors_users_userid_fkey` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesCategories` ADD CONSTRAINT `articlesCategories_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesCategories` ADD CONSTRAINT `articlesCategories_categories_id_fkey` FOREIGN KEY (`categories_id`) REFERENCES `categories`(`categories_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesDrafts` ADD CONSTRAINT `articlesDrafts_users_users_userid_fk` FOREIGN KEY (`articlesDrafts_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `articlesDrafts` ADD CONSTRAINT `articlesDrafts_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditLog` ADD CONSTRAINT `auditLog_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `auditLog` ADD CONSTRAINT `auditLog_users_users_userid_fk_2` FOREIGN KEY (`auditLog_actionUserid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `authTokens` ADD CONSTRAINT `authTokens_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `authTokens` ADD CONSTRAINT `authTokens_users_users_userid_fk_2` FOREIGN KEY (`authTokens_adminId`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_categories_nestUnder_fkey` FOREIGN KEY (`categories_nestUnder`) REFERENCES `categories`(`categories_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emailSent` ADD CONSTRAINT `emailSent_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `emailVerificationCodes` ADD CONSTRAINT `emailVerificationCodes_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `featuredHome` ADD CONSTRAINT `featuredHome_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `passwordResetCodes` ADD CONSTRAINT `passwordResetCodes_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `userPositions` ADD CONSTRAINT `userPositions_positions_positions_id_fk` FOREIGN KEY (`positions_id`) REFERENCES `positions`(`positions_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `userPositions` ADD CONSTRAINT `userPositions_users_users_userid_fk` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE RESTRICT;
