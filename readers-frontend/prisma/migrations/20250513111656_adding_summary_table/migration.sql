-- AlterTable
ALTER TABLE `editions` MODIFY `editions_showHome` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `positions` MODIFY `positions_teamPageGroup` INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE `userPositions` MODIFY `userPositions_start` TIMESTAMP(0) NOT NULL DEFAULT '2000-01-01 00:00:00';

-- CreateTable
CREATE TABLE `articlesReadsSummary` (
    `articles_id` INTEGER NOT NULL,
    `read_count` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `articlesReadsSummary_articles_articles_id_fk`(`articles_id`),
    PRIMARY KEY (`articles_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_reads_timestamp_id` ON `articlesReads`(`articlesReads_timestamp`, `articles_id`);
