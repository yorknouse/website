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
            "FROM articlesReads WHERE articlesReads.articlesReads_timestamp BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH)" .
            " AND NOW() GROUP BY articlesReads.articles_id ORDER BY count DESC;"),
        "articles_id"
    );

// Get articles
$DBLIB->where("articles.articles_id", $readArticlesIds, "IN");
$DBLIB->join("users", "users.users_userid=articles.articles_authors");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
//$DBLIB->join("articlesCategories", "articles.articles_id=articlesCategories.articles_id", "LEFT");
$DBLIB->setQueryOption("DISTINCT");
$articles = $DBLIB->get(
    "articles",
    4,
    [
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
    $article['url'] = '/' . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'];

    $article['image'] = $bCMS->s3URL($article['articles_thumbnail'], "medium");

    $output[] = $article;
}

finish(true, null, $output);