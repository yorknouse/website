<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Featured Articles", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(20)) die("Sorry - you can't access this page");

$DBLIB->where("categories_showPublic",1);
$DBLIB->where("categories_showHome", 1);
$DBLIB->orderBy("categories_order", "ASC");
$DBLIB->orderBy("categories_displayName", "ASC");
$DBLIB->where("categories_nestUnder IS NULL");
$PAGEDATA['CATEGORIES'] = [];

foreach ($DBLIB->get("categories",null, ["categories_id", "categories_displayName","categories_featured"]) as $category) {
    if (strlen($category['categories_featured']) > 0) {
        $category['ARTICLES'] = [];
        foreach (explode(",",$category['categories_featured']) as $article) { //Has to be done like this otherwise it won't come out in the correct order
            $DBLIB->where("articles.articles_id", $article);
            $DBLIB->where("articles_showInLists", 1);
            $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
            $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
            $category['ARTICLES'][] = $DBLIB->getone("articles", ["articles.articles_id", "articlesDrafts.articlesDrafts_headline"]);
        }
    } else  $category['ARTICLES'] =null;
    $PAGEDATA['CATEGORIES'][] = $category;
}


// Homepage featured
$DBLIB->orderBy("featuredHome_timestamp", "DESC");
$featuredHomeArticles = $DBLIB->getone("featuredHome");
if ($featuredHomeArticles) {
    $PAGEDATA['FEATUREDHOME'] = [];
   foreach (explode(",",$featuredHomeArticles['featuredHome_articles']) as $article) { //Has to be done like this otherwise it won't come out in the correct order
        $DBLIB->where("articles.articles_id", $article);
        $DBLIB->where("articles_showInLists", 1);
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $PAGEDATA['FEATUREDHOME'][] = $DBLIB->getone("articles", ["articles.articles_id", "articlesDrafts.articlesDrafts_headline"]);
    }
} else  $PAGEDATA['FEATUREDHOME'] =null;


echo $TWIG->render('featured.twig', $PAGEDATA);
?>
