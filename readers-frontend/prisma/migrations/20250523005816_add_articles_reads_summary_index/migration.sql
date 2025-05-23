-- RenameTable
RENAME TABLE articleReadsSummary TO articlesReadsSummary;

-- CreateTable
CREATE INDEX `idx_articlesReadsSummary_readcount_desc` ON `articlesReadsSummary` (`read_count` DESC);
