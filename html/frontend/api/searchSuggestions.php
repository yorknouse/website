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

//Log an article as having been read
if (!isset($_POST['searchterm'])) {
    finish(false, ["code" => "PARAM", "message" => "No term set"]);
}

$term = $bCMS->sanitizeString($_POST['searchterm']);

if (strlen($term) < 1) {
    finish(true, null, null);
}

// Create generic term
$term = '%' . $term . '%';

// Get matching authors
$DBLIB->where("CONCAT(TRIM(users_name1), ' ', TRIM(users_name2))", $term, "LIKE");
$matchingAuthorsIds = $DBLIB->get("users", null, ["users.users_userid"]);
if (is_array(($matchingAuthorsIds)) && (count($matchingAuthorsIds) > 0)) {
    foreach ($matchingAuthorsIds as $i => $author) {
        $matchingAuthorsIds[$i] = $author["users_userid"];
    }
} else {
    $matchingAuthorsIds = array(-1);
}
$matchingAuthorsIds = "(" . implode(",", $matchingAuthorsIds) . ")";

$DBLIB->where(
    "(articlesDrafts.articlesDrafts_excerpt LIKE ? OR articlesDrafts.articlesDrafts_headline LIKE ? OR articles_published LIKE ? OR articles.articles_id IN (SELECT articles_id FROM articlesAuthors WHERE articlesAuthors.users_userid IN" . $matchingAuthorsIds . "))",
    array($term, $term, $term)
);
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInSearch", 1);
$DBLIB->where("articles_published <= ?", array(date("Y-m-d H:i:s")));
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where(
    "articlesDrafts_id =
    (SELECT articlesDrafts_id
    FROM articlesDrafts
    WHERE articlesDrafts.articles_id=articles.articles_id
    ORDER BY articlesDrafts_timestamp DESC LIMIT 1)"
);
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
        $article['categories_displayName'] = $category['categories_displayName'];
        $article['categories_backgroundColor'] = $category['categories_backgroundColor'];
    }

    $DBLIB->where("articlesAuthors.articles_id", $bCMS->sanitizeString($article['articles_id']));
    $DBLIB->join("users", "users.users_userid=articlesAuthors.users_userid", "LEFT");
    $DBLIB->where("users_deleted", 0);
    $article['articles_authors'] = $DBLIB->get("articlesAuthors", null, ["users.users_name1", "users.users_name2", "users.users_userid"]);

    $article['url'] = '/' . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'];

    $article['image'] = $bCMS->s3URL($article['articles_thumbnail'], "medium");

    $output[] = $article;
}

finish(true, null, $output);
