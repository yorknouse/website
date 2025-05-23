-- CreateIndex
CREATE FULLTEXT INDEX `articles_articles_slug_idx` ON `articles`(`articles_slug`);

-- CreateIndex
CREATE FULLTEXT INDEX `articlesDrafts_articlesDrafts_headline_articlesDrafts_excerp_idx` ON `articlesDrafts`(`articlesDrafts_headline`, `articlesDrafts_excerpt`);
