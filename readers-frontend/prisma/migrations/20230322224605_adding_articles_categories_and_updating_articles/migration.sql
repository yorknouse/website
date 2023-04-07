-- CreateTable
CREATE TABLE `articlesCategories` (
    `articles_id` INTEGER NOT NULL,
    `categories_id` INTEGER NOT NULL,

    UNIQUE INDEX `articlesCategories_articles_id_categories_id_unique`(`articles_id`, `categories_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `articlesCategories` ADD CONSTRAINT `articlesCategories_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesCategories` ADD CONSTRAINT `articlesCategories_categories_id_fkey` FOREIGN KEY (`categories_id`) REFERENCES `categories`(`categories_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrating categories.articles_categories to articlesCategories
CREATE PROCEDURE IF NOT EXISTS UPDATECATEGORIES()
BEGIN
INSERT INTO articlesCategories (articles_id, categories_id)
SELECT articles.articles_id, categories.categories_id
FROM articles
JOIN categories ON FIND_IN_SET(categories.categories_id, articles.articles_categories) > 0;
END;

CALL UPDATECATEGORIES();

DROP PROCEDURE IF EXISTS UPDATECATEGORIES;

-- Updating the Nouse subsections

-- Updating the news subsections
-- Updating any articles with 3616 as its category to category 2 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 2 WHERE `categories_id` = 3616
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 2
  );

-- Deleting any articles with 3616 as its category if it already has the category 2
DELETE FROM `articlesCategories` WHERE `categories_id` = 3616
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 2
  );

-- Updating the comment subsections and moving cartoons under the comment section
-- Updating any articles with 15,248,288,3189 as its category to category 6 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 6 WHERE `categories_id` = 15
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

UPDATE `articlesCategories` SET `categories_id` = 6 WHERE `categories_id` = 248
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

UPDATE `articlesCategories` SET `categories_id` = 6 WHERE `categories_id` = 288
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

UPDATE `articlesCategories` SET `categories_id` = 6 WHERE `categories_id` = 3189
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

-- Deleting any articles with 15,248,288,3189 as its category if it already has the category 6
DELETE FROM `articlesCategories` WHERE `categories_id` IN (15,248,288,3189)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

-- Updating the cartoons category 248 to be under the comment section
UPDATE `categories` SET `categories_nestUnder` = 6
WHERE `categories_id` = 248;

-- Updating the politics subsections and moving cartoons under the comment section
-- Updating any articles with 3609,1857,2836,3612 as its category to category 3 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 3 WHERE `categories_id` = 3609
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

UPDATE `articlesCategories` SET `categories_id` = 3 WHERE `categories_id` = 1857
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

UPDATE `articlesCategories` SET `categories_id` = 3 WHERE `categories_id` = 2836
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

UPDATE `articlesCategories` SET `categories_id` = 3 WHERE `categories_id` IN (3609,1857,2836,3612)
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

-- Deleting any articles with 3609,1857,2836,3612 as its category if it already has the category 3
DELETE FROM `articlesCategories` WHERE `categories_id` IN (3609,1857,2836,3612)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

-- Renaming the Politics Column category to be Left Wing, Right Wing
UPDATE `categories` SET `categories_displayName` = 'Left Wing, Right Wing', `categories_name` = 'left-wing-right-wing'
WHERE `categories_id` = 242;

-- Updating the sports subsections
-- Updating any articles with sub categories to category 7 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 321
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 244
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 249
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 2540
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 254
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 1853
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 250
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 252
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 317
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 251
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 1782
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 3608
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 197
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 261
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 316
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 253
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 2843
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 45
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 3596
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

UPDATE `articlesCategories` SET `categories_id` = 7 WHERE `categories_id` = 3577
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

-- Deleting any articles with sports sub categories if it already has the category 7
DELETE FROM `articlesCategories` WHERE `categories_id` IN (321,244,249,2540,254,1853,250,252,317,251,1782,3608,197,261,316,253,2843,45,3596,3577)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 7
  );

-- Updating any articles with roses live blog as its category to the main roses category if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 270 WHERE `categories_id` = 271
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 270
  );

-- Deleting any articles with roses live blog as its category if it already has the main roses category
DELETE FROM `articlesCategories` WHERE `categories_id` = 271
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 270
  );

-- Updating the freshers subsections
-- Updating any articles with 3131 as its category to category 278 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 3131
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 2908
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 2917
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 2242
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 3145
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 2916
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 3132
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 3133
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

UPDATE `articlesCategories` SET `categories_id` = 278 WHERE `categories_id` = 2218
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

-- Deleting any articles with 3131 as its category if it already has the category 278
DELETE FROM `articlesCategories` WHERE `categories_id` IN (3131,2908,2917,2242,3145,2916,3132,3133,2218)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 278
  );

-- Updating the MUSE subsections

-- Updating the arts subsections
-- Updating any articles with 3613,237,3129,3614 as its category to category 11 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 11 WHERE `categories_id` = 3613
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 11
  );

UPDATE `articlesCategories` SET `categories_id` = 11 WHERE `categories_id` = 237
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 11
  );

UPDATE `articlesCategories` SET `categories_id` = 11 WHERE `categories_id` = 3129
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 11
  );

UPDATE `articlesCategories` SET `categories_id` = 11 WHERE `categories_id` = 3614
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 11
  );

-- Deleting any articles with 3613,237,3129,3614 as its category if it already has the category 11
DELETE FROM `articlesCategories` WHERE `categories_id` IN (3613,237,3129,3614)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 11
  );

-- Updating the You Are What You Read category
-- Updating any articles with 3610 as its category to category 1860 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 1860 WHERE `categories_id` = 3610
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 1860
  );

-- Deleting any articles with 3610 as its category if it already has the category 1860
DELETE FROM `articlesCategories` WHERE `categories_id` = 3610
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 1860
  );

-- Updating the Upcoming arts events category
-- Updating any articles with 307 as its category to category 1859 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 1859 WHERE `categories_id` = 307
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 1859
  );

-- Deleting any articles with 307 as its category if it already has the category 1859
DELETE FROM `articlesCategories` WHERE `categories_id` = 307
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 1859
  );

-- Updating the columns subsections
-- Updating any articles with 10 as its category to category 4 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 4 WHERE `categories_id` = 10
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 4
  );

-- Deleting any articles with 10 as its category if it already has the category 4
DELETE FROM `articlesCategories` WHERE `categories_id` = 10
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 4
  );

-- Updating the fashion subsections
-- Updating any articles with 195,239,1875,1873 as its category to category 168 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 168 WHERE `categories_id` = 195
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 168
  );

UPDATE `articlesCategories` SET `categories_id` = 168 WHERE `categories_id` = 239
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 168
  );

UPDATE `articlesCategories` SET `categories_id` = 168 WHERE `categories_id` = 1875
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 168
  );

-- Deleting any articles with 195,239,1875,1873 as its category if it already has the category 168
DELETE FROM `articlesCategories` WHERE `categories_id` IN (195,239,1875)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 168
  );

-- Updating Trends category to be Fasion Trends
UPDATE `categories` SET `categories_displayName` = 'Fashion Trends' WHERE `categories`.`categories_id` = 1873;

-- Updating the film & tv subsections
-- Updating any articles with 3600,3503,306,3601 as its category to category 76 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 76 WHERE `categories_id` = 3600
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 76
  );

UPDATE `articlesCategories` SET `categories_id` = 76 WHERE `categories_id` = 3503
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 76
  );

UPDATE `articlesCategories` SET `categories_id` = 76 WHERE `categories_id` = 306
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 76
  );

UPDATE `articlesCategories` SET `categories_id` = 76 WHERE `categories_id` = 3601
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 76
  );

-- Deleting any articles with 3600,3503,306,3601 as its category if it already has the category 76 ASK ABOUT THIS AND FASHION TRENDS
DELETE FROM `articlesCategories` WHERE `categories_id` IN (3600,3503,306,3601)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 76
  );

-- Updating the food & drink subsections
-- Updating any articles with 3394 as its category to category 169 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 169 WHERE `categories_id` = 3394
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 169
  );

-- Deleting any articles with 3394 as its category if it already has the category 169
DELETE FROM `articlesCategories` WHERE `categories_id` = 3394
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 169
  );

-- Updating the music subsections
-- Updating any articles with 301,160,241 as its category to category 24 if it doesn't already have it
UPDATE `articlesCategories` SET `categories_id` = 24 WHERE `categories_id` = 301
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 24
  );

UPDATE `articlesCategories` SET `categories_id` = 24 WHERE `categories_id` = 160
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 24
  );

UPDATE `articlesCategories` SET `categories_id` = 24 WHERE `categories_id` = 241
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 24
  );

-- Deleting any articles with 301,160,241 as its category if it already has the category 24
DELETE FROM `articlesCategories` WHERE `categories_id` IN (301,160,241)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 24
  );

-- Updating the shoot category to be Shoot
UPDATE `categories` SET `categories_displayName` = 'Shoot', `categories_name` = 'shoot', `categories_nestUnder` = '4' WHERE `categories`.`categories_id` = 1871;

-- Updating all deprecated subcategories above to be hidden
UPDATE `categories` SET `categories_showHome` = 0, `categories_showMenu` = 0, `categories_showPublic` = 0, `categories_showAdmin` = 0
WHERE `categories_id` IN (15,288,3189,3616,3609,1857,2836,3612,321,244,249,2540,254,1853,250,252,317,251,1782,3608,197,261,316,253,2843,45,3596,3577,271,3131,2908,2917,2242,3145,2916,3132,3133,2218,3613,237,3129,3614,3610,307,10,195,239,1875,3600,3503,306,3394,301,160,241); -- excludes 1873 and 3601

-- Updating all muse subcategories to be show on muse home page
UPDATE `categories` SET `categories_showHome` = 1
WHERE `categories_id` IN (11,3618,168,76,169,2180,24,322);

-- Update the category colours
-- News
UPDATE `categories` SET `categories_backgroundColor` = '#173B88'
WHERE `categories_id` = 2;

-- Comment
UPDATE `categories` SET `categories_backgroundColor` = '#7A1F6E'
WHERE `categories_id` = 6;

-- Politics
UPDATE `categories` SET `categories_backgroundColor` = '#E21615'
WHERE `categories_id` = 3;

-- Business
UPDATE `categories` SET `categories_backgroundColor` = '#008ACC'
WHERE `categories_id` = 397;

-- Science
UPDATE `categories` SET `categories_backgroundColor` = '#008E3B'
WHERE `categories_id` = 373;

-- Sport
UPDATE `categories` SET `categories_backgroundColor` = '#FDC300'
WHERE `categories_id` = 7;

-- Features
UPDATE `categories` SET `categories_backgroundColor` = '#72033F'
WHERE `categories_id` = 8;

-- Arts
UPDATE `categories` SET `categories_backgroundColor` = '#E992B2'
WHERE `categories_id` = 11;

-- Fashion
UPDATE `categories` SET `categories_backgroundColor` = '#843F71'
WHERE `categories_id` = 168;

-- Shoot
UPDATE `categories` SET `categories_backgroundColor` = '#FFF374'
WHERE `categories_id` = 1871;

-- Music
UPDATE `categories` SET `categories_backgroundColor` = '#D43F30'
WHERE `categories_id` = 24;

-- Film & TV
UPDATE `categories` SET `categories_backgroundColor` = '#6D6EA7'
WHERE `categories_id` = 76;

-- Gaming
UPDATE `categories` SET `categories_backgroundColor` = '#4792BF'
WHERE `categories_id` = 2180;

-- Travel
UPDATE `categories` SET `categories_backgroundColor` = '#E88A20'
WHERE `categories_id` = 322;

-- Food & Drink
UPDATE `categories` SET `categories_backgroundColor` = '#7C9464'
WHERE `categories_id` = 169;

-- Creative Writing
UPDATE `categories` SET `categories_backgroundColor` = '#9CD1BE'
WHERE `categories_id` = 3618;

-- Adding College Sport, University Sport, National Sport, Poetry, Prose
INSERT INTO `categories` (`categories_id`, `categories_showHome`, `categories_displayName`, `categories_showMenu`, `categories_name`, `categories_showPublic`, `categories_showAdmin`, `categories_featured`, `categories_order`, `categories_nestUnder`, `categories_showSub`, `categories_facebook`, `categories_twitter`, `categories_instagram`, `categories_backgroundColor`, `categories_backgroundColorContrast`, `categories_customTheme`, `categories_socialMediaOverlay`) VALUES 
('3621', '0', 'College Sport', '1', 'college-sport', '1', '1', NULL, NULL, '7', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3622', '0', 'University Sport', '1', 'university-sport', '1', '1', NULL, NULL, '7', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3623', '0', 'National Sport', '1', 'national-sport', '1', '1', NULL, NULL, '7', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3624', '0', 'Poetry', '1', 'poetry', '1', '1', NULL, NULL, '3618', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3625', '0', 'Prose', '1', 'prose', '1', '1', NULL, NULL, '3618', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3626', '0', 'Interviews', '1', 'fashion-interviews', '1', '1', NULL, NULL, '168', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3627', '0', 'Eating locally', '1', 'eating-locally', '1', '1', NULL, NULL, '169', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3628', '0', 'Music Interviews', '1', 'music-interviews', '1', '1', NULL, NULL, '24', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL);