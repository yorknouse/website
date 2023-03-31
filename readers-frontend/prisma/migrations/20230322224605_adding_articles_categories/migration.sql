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

-- Updating the news subsections
-- Updating any articles with 3616 as its category to category 2 if it doesn't already have it
DELETE FROM `articlesCategories` WHERE `categories_id` = 3616
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 2
  );

-- Deleting any articles with 3616 as its category if it already has the category 2
UPDATE `articlesCategories` SET `categories_id` = 2 WHERE `categories_id` = 3616
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 2
  );

-- Updating the comment subsections and moving cartoons under the comment section
-- Updating any articles with 15,248,288,3189 as its category to category 6 if it doesn't already have it
DELETE FROM `articlesCategories` WHERE `categories_id` IN (15,248,288,3189)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

-- Deleting any articles with 15,248,288,3189 as its category if it already has the category 6
UPDATE `articlesCategories` SET `categories_id` = 6 WHERE `categories_id` IN (15,248,288,3189)
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 6
  );

-- Updating the cartoons category 248 to be under the comment section
UPDATE `categories` SET `categories_nestUnder` = 6
WHERE `categories_id` = 248;

-- Updating the politics subsections and moving cartoons under the comment section
-- Updating any articles with 3609,1857,2836,3612 as its category to category 3 if it doesn't already have it
DELETE FROM `articlesCategories` WHERE `categories_id` IN (3609,1857,2836,3612)
  AND `articles_id` IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

-- Deleting any articles with 3609,1857,2836,3612 as its category if it already has the category 3
UPDATE `articlesCategories` SET `categories_id` = 3 WHERE `categories_id` IN (3609,1857,2836,3612)
  AND `articles_id` NOT IN (
    SELECT `articles_id`
    FROM (SELECT * FROM `articlesCategories`) AS a
    WHERE `categories_id` = 3
  );

-- Renaming the Politics Column category to be Left Wing, Right Wing
UPDATE `categories` SET `categories_displayName` = 'Left Wing, Right Wing', `categories_name` = 'left-wing-right-wing'
WHERE `categories_id` = 242;

-- Updating categories 15,288,3189,3616,3609,1857,2836,3612 to be hidden
UPDATE `categories` SET `categories_showHome` = 0, `categories_showMenu` = 0, `categories_showPublic` = 0, `categories_showAdmin` = 0
WHERE `categories_id` IN (15,288,3189,3616,3609,1857,2836,3612);