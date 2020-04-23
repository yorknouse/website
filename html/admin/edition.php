<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Edition Editor", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(51)) die("Sorry - you can't access this page");

if (isset($_GET['id'])) {
	$DBLIB->where("editions.editions_id", $bCMS->sanitizeString($_GET['id'])); //ie those that can actually be shown
	$DBLIB->where("editions.editions_deleted", 0); //ie those that can actually be shown
	$PAGEDATA['edition'] = $DBLIB->getone("editions");
	if (!$PAGEDATA['edition']) die("404 File not found");

	//Download all articles for edition
	$DBLIB->orderBy("articles.articles_editionPage", "ASC");
	$DBLIB->orderBy("articles.articles_id", "ASC");
	$DBLIB->where("editions_id", $PAGEDATA['edition']['editions_id']);
	$DBLIB->where("articles.articles_showInAdmin", 1); //ie those that can actually be shown
	$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
	$DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
	$articles = $DBLIB->get("articles", null, ["articles.articles_categories","articles.articles_slug", "articles.articles_authors", "articles.articles_published", "articles.articles_updated", "articles.articles_showInSearch", "articles.articles_showInLists","articles.articles_id","articles.articles_published", "articlesDrafts.articlesDrafts_headline", "articles.articles_editionPage"]);
	$PAGEDATA['articles'] = [];
	foreach ($articles as $article) {
		$article['articles_categories'] = explode(",", $article['articles_categories']);
		$PAGEDATA['articles'][] = $article;
	}

	$DBLIB->orderBy("categories_nestUnder", "ASC");
	$DBLIB->orderBy("categories_order", "ASC");
	$DBLIB->orderBy("categories_displayName", "ASC");
	$PAGEDATA['CATEGORIES'] = $DBLIB->get("categories",null, ["categories_id","categories_displayName","categories_backgroundColor","categories_backgroundColorContrast"]);
} else die("404 File not found");

echo $TWIG->render('edition.twig', $PAGEDATA);
?>
