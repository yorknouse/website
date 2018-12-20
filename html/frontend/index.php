<?php
require_once __DIR__ . '/common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => null, "FEATURED" => true, "showLoader" => true];

foreach ($PAGEDATA['CATEGORIES'] as $key=>$category) {
    if ($category['categories_showHome'] != 1) continue; //We're doing this for the homepage after all....

    $DBLIB->where("FIND_IN_SET(articles.articles_id, '" . $category['categories_featured'] . "') > 0");
    $DBLIB->orderBy("articles_published", "DESC");
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $category['FEATUREDARTICLES'] = $DBLIB->get("articles", 6, ["articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);

    $PAGEDATA['CATEGORIES'][$key] = $category;
}



$DBLIB->orderBy("(SELECT COUNT(*) FROM articlesReads WHERE articlesReads_timestamp > '" .  date("Y-m-d H:i:s", strtotime("-7 days")) . "')", "DESC");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$PAGEDATA['weeklyMostRead'] = $DBLIB->get("articles", 6, ["articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline"]);


$DBLIB->orderBy("articles_lifetimeViews", "DESC");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$PAGEDATA['allTimeMostRead'] = $DBLIB->get("articles", 4, ["articles.articles_lifetimeViews","articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline"]);



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
        $article = $DBLIB->getone("articles", ["articles.articles_categories", "articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);

        $DBLIB->where("(categories_id IN (" . $article['articles_categories'] . "))");
        $article["CATEGORIES"] = $DBLIB->get("categories", 1, ["categories_displayName","categories_id","categories_backgroundColor","categories_backgroundColorContrast"]);

        $PAGEDATA['FEATUREDHOME'][] = $article;
    }
} else  $PAGEDATA['FEATUREDHOME'] =null;




echo $TWIG->render('index.twig', $PAGEDATA);
?>
