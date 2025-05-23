-- CreateIndex
CREATE INDEX `idx_articles_editions_admin` ON `articles`(`editions_id`, `articles_showInAdmin`);

-- CreateIndex
CREATE INDEX `idx_articles_admin_published` ON `articles`(`articles_showInAdmin`, `articles_published` DESC);

-- CreateIndex
CREATE INDEX `idx_articlesDrafts_article_timestamp` ON `articlesDrafts`(`articles_id`, `articlesDrafts_timestamp` DESC);

-- CreateIndex
CREATE INDEX `idx_categories_sort` ON `categories`(`categories_nestUnder`, `categories_order`, `categories_displayName`);

-- CreateIndex
CREATE INDEX `idx_editions_deleted_published` ON `editions`(`editions_deleted`, `editions_published`);

-- CreateIndex
CREATE INDEX `idx_users_userid_deleted` ON `users`(`users_userid`, `users_deleted`);
