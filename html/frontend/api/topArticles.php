<?php
require_once __DIR__ . '/../../common/coreHead.php';

function finish($result = false, $error = ["code" => null, "message" => null], $response = [])
{
    $dataReturn = ["result" => $result];
    if ($error && !$result) {
        $dataReturn["error"] = $error;
    } else {
        $dataReturn["response"] = $response;
    }
    die(json_encode($dataReturn));
}


// Get read article IDs in month
$readArticlesIds =
    array_column(
        $DBLIB->rawQuery("SELECT articlesReads.articles_id, count(*) as count " .
            "FROM articlesReads WHERE articlesReads.articlesReads_timestamp BETWEEN DATE_SUB(NOW(), INTERVAL 1 WEEK)" .
            " AND NOW() GROUP BY articlesReads.articles_id ORDER BY count DESC LIMIT 4;"),
        "articles_id"
    );

// Get articles
$DBLIB->where("articles.articles_id", $readArticlesIds, "IN");
$DBLIB->join("users", "users.users_userid=articles.articles_authors");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->setQueryOption("DISTINCT");
$articles = $DBLIB->get(
    "articles",
    null,
    [
        "articles.articles_id",
        "articles.articles_published",
        "articles.articles_slug",
        "articles.articles_thumbnail",
        "articles.articles_isThumbnailPortrait",
        "articlesDrafts.articlesDrafts_headline",
        "users.users_name1",
        "users.users_name2",
        "users.users_userid",
    ]
);

if (!$articles) {
    finish(true, null, null);
}

$output = [];
foreach ($articles as $article) {
    $DBLIB->where("articlesCategories.articles_id", $bCMS->sanitizeString($article['articles_id']));
	$articleCategories = array_column($DBLIB->get("articlesCategories"), 'categories_id');
    if (count($articleCategories) > 0) {
        $DBLIB->where("categories_id", $articleCategories, "IN");
        $DBLIB->where("categories_nestUnder IS NULL");
        $category = $DBLIB->getOne("categories");
        $article['categories_name'] = $category['categories_name'];
    }

    $article['url'] = '/' . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'];

    $article['image'] = $bCMS->s3URL($article['articles_thumbnail'], "medium");

    $output[] = $article;
}

finish(true, null, $output);