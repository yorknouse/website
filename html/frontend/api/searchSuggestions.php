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

//Log an article as having been read
if (!isset($_POST['searchterm'])) {
    finish(false, ["code" => "PARAM", "message" => "No term set"]);
}

$term = $bCMS->sanitizeString($_POST['searchterm']);

if (strlen($term) < 1) {
    finish(true, null, null);
}

$DBLIB->where(
    "(articlesDrafts.articlesDrafts_excerpt LIKE '%" .
    $term .
    "%' OR articlesDrafts.articlesDrafts_headline LIKE '%" .
    $term . "%')"
);
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInSearch", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where(
    "articlesDrafts_id =
    (SELECT articlesDrafts_id
    FROM articlesDrafts
    WHERE articlesDrafts.articles_id=articles.articles_id
    ORDER BY articlesDrafts_timestamp DESC LIMIT 1)"
);
$DBLIB->join("users", "articlesDrafts.articlesDrafts_userid=users.users_userid");
$DBLIB->join("categories", "articles.articles_categories=categories.categories_id");
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
        "articlesDrafts.articlesDrafts_excerpt",
        "users.users_name1",
        "users.users_name2",
        "users.users_userid",
        "categories.categories_name",
        "categories.categories_displayName",
        "categories.categories_backgroundColor",
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
