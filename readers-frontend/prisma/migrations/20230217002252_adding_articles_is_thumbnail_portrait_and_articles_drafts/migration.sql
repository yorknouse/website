-- AlterTable
ALTER TABLE `articles` ADD COLUMN `articles_isThumbnailPortrait` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `articlesDrafts` ADD CONSTRAINT `articlesDrafts_articles_id_fkey` FOREIGN KEY (`articles_id`) REFERENCES `articles`(`articles_id`) ON DELETE SET NULL ON UPDATE CASCADE;
