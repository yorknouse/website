-- CreateTable
CREATE TABLE `articlesAuthors` (
    `articles_id` INTEGER NOT NULL,
    `users_userid` INTEGER NOT NULL,

    UNIQUE INDEX `articlesAuthors_articles_id_users_userid_unique`(`articles_id`, `users_userid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `articlesAuthors` ADD CONSTRAINT `articlesAuthors_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articlesAuthors` ADD CONSTRAINT `articlesAuthors_users_userid_fkey` FOREIGN KEY (`users_userid`) REFERENCES `users`(`users_userid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrating categories.articles_authors to articlesAuthors
CREATE PROCEDURE IF NOT EXISTS UPDATEAUTHORS()
BEGIN
INSERT INTO articlesAuthors (articles_id, users_userid)
SELECT articles.articles_id, users.users_userid
FROM articles
JOIN users ON FIND_IN_SET(users.users_userid, articles_authors) > 0;
END;

CALL UPDATEAUTHORS();

DROP PROCEDURE IF EXISTS UPDATEAUTHORS;