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
