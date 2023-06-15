<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Edition Editor", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(51)) die("Sorry - you can't access this page");

if (isset($_GET['id'])) {
	$DBLIB->where("editions.editions_id", $bCMS->sanitizeString($_GET['id'])); //ie those that can actually be shown
	$DBLIB->where("editions.editions_deleted", 0); //ie those that can actually be shown
	$PAGEDATA['edition'] = $DBLIB->getone("editions");
	if (!$PAGEDATA['edition']) die("404 File not found");

	$DBLIB->where("editions_deleted", 0);
	$PAGEDATA['editionTypes'] = $DBLIB->get("editions", null, ["DISTINCT editions_type"]);

	$DBLIB->where("categories_showPublic",1);
	$DBLIB->orderBy("categories_order", "ASC");
	$DBLIB->orderBy("categories_displayName", "ASC");
	$DBLIB->where("categories_nestUnder IS NULL");
	$PAGEDATA['CATEGORIES'] = $DBLIB->get("categories");

	$PAGEDATA['articlesIDs'] = [];
	$PAGEDATA['articles'] = [];

	foreach ($PAGEDATA['CATEGORIES'] as $category) {
		//Download all articles for edition
	    $DBLIB->orderBy("articles.articles_editionPage", "ASC");
	    $DBLIB->orderBy("articles.articles_published", "ASC");
		$DBLIB->orderBy("articles.articles_slug", "ASC");
		$DBLIB->where("articles.articles_id IN (SELECT articles_id FROM articlesCategories WHERE categories_id = " . $bCMS->sanitizeString($category['categories_id']) . ")");
		$DBLIB->where("editions_id", $PAGEDATA['edition']['editions_id']);
		$DBLIB->where("articles.articles_showInAdmin", 1); //ie those that can actually be shown
		$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
		$DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
		$articles = $DBLIB->get("articles", null, ["articles.articles_slug", "articles.articles_published", "articles.articles_updated", "articles.articles_showInSearch", "articles.articles_showInLists","articles.articles_id","articles.articles_published", "articlesDrafts.articlesDrafts_headline", "articles.articles_editionPage"]);
		foreach ($articles as $article) {
			if (in_array($article['articles_id'], $PAGEDATA['articlesIDs'])) continue; //Don't add it twice if it's already been added for another category

			$DBLIB->where("articlesCategories.articles_id", $bCMS->sanitizeString($article['articles_id']));
			$article['articles_categories'] = array_column($DBLIB->get("articlesCategories"), 'categories_id');
			array_push($PAGEDATA['articlesIDs'],$article['articles_id']);
			$PAGEDATA['articles'][] = $article;
		}
	}
} else die("404 File not found");

echo $TWIG->render('edition.twig', $PAGEDATA);
?>
