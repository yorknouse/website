-- AlterTable
ALTER TABLE `articles` MODIFY `articles_mediaCharterDone` TINYINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `comments` MODIFY `comments_created` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0);
