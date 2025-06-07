<?php
require_once __DIR__ . '/../../common/coreHead.php';

function finish($result = false, $error = ["code" => null, "message" => null], $response = []) {
    $dataReturn = ["result" => $result];
    if ($error && !$result) {
        $dataReturn["error"] = $error;
    } else {
        $dataReturn["response"] = $response;
    }
    die(json_encode($dataReturn));
}

// Get top 4 read article IDs from summary table
$readArticlesIds = array_column(
    $DBLIB->rawQuery("SELECT articles_id FROM articlesReadsSummary ORDER BY read_count DESC LIMIT 4"),
    "articles_id"
);

// If nothing found, exit early
if (empty($readArticlesIds)) {
    finish(true, null, []);
}

// Step 1: Build a subquery that gets the latest draft per article
$latestDraftsSubquery = "
    SELECT t1.*
    FROM articlesDrafts t1
    INNER JOIN (
        SELECT articles_id, MAX(articlesDrafts_timestamp) AS max_ts
        FROM articlesDrafts
        GROUP BY articles_id
    ) t2 ON t1.articles_id = t2.articles_id AND t1.articlesDrafts_timestamp = t2.max_ts
";

// Step 2: Prepare the query
$DBLIB->where("articles.articles_id", $readArticlesIds, "IN");
$DBLIB->join("( $latestDraftsSubquery ) ad", "articles.articles_id = ad.articles_id", "LEFT");
$DBLIB->setQueryOption("DISTINCT");

$articles = $DBLIB->get("articles", null, [
    "articles.articles_id",
    "articles.articles_published",
    "articles.articles_slug",
    "articles.articles_thumbnail",
    "articles.articles_isThumbnailPortrait",
    "ad.articlesDrafts_headline"
]);

if (!$articles) {
    finish(true, null, []);
}

$output = [];
foreach ($articles as $article) {
    // Get categories
    $DBLIB->where("articlesCategories.articles_id", $bCMS->sanitizeString($article['articles_id']));
    $articleCategories = array_column($DBLIB->get("articlesCategories"), 'categories_id');
    if (!empty($articleCategories)) {
        $DBLIB->where("categories_id", $articleCategories, "IN");
        $DBLIB->where("categories_nestUnder IS NULL");
        $category = $DBLIB->getOne("categories");
        $article['categories_name'] = $category['categories_name'] ?? null;
    }

    $DBLIB->where("articlesAuthors.articles_id", $bCMS->sanitizeString($article['articles_id']));
    $DBLIB->join("users", "users.users_userid=articlesAuthors.users_userid", "LEFT");
    $DBLIB->where("users_deleted", 0);
    $article['articles_authors'] = $DBLIB->get(
        "articlesAuthors",
        null,
        ["users.users_name1", "users.users_name2", "users.users_userid"]
    );

    $article['url'] = '/' . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'];

    $article['image'] = $bCMS->s3URL($article['articles_thumbnail'], "medium");

    $output[] = $article;
}

finish(true, null, $output);