<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Edition Editor", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(51)) die("Sorry - you can't access this page");

if (isset($_GET['id'])) {
	$DBLIB->where("editions.editions_id", $bCMS->sanitizeString($_GET['id'])); //ie those that can actually be shown
	$DBLIB->where("editions.editions_deleted", 0); //ie those that can actually be shown
	$PAGEDATA['edition'] = $DBLIB->getone("editions");
	if (!$PAGEDATA['edition']) die("404 File not found");

	$PAGEDATA['edition']['featuredArticlesID'] = explode(",",$PAGEDATA['edition']['editions_featured']);
	$PAGEDATA['edition']['featuredArticles']=[];


	$DBLIB->where("categories_showPublic",1);
	$DBLIB->orderBy("categories_order", "ASC");
	$DBLIB->orderBy("categories_displayName", "ASC");
	$DBLIB->where("categories_nestUnder IS NULL");
	$PAGEDATA['CATEGORIES'] = $DBLIB->get("categories");

	$PAGEDATA['articles'] = [];

	foreach ($PAGEDATA['CATEGORIES'] as $category) {
		//Download all articles for edition
	    $DBLIB->orderBy("articles.articles_editionPage", "ASC");
	    $DBLIB->orderBy("articles.articles_published", "ASC");
		$DBLIB->orderBy("articles.articles_slug", "ASC");
		$DBLIB->where("FIND_IN_SET('" . $category['categories_id'] . "',articles_categories)");
		$DBLIB->where("editions_id", $PAGEDATA['edition']['editions_id']);
		$DBLIB->where("articles.articles_showInAdmin", 1); //ie those that can actually be shown
		$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
		$DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
		$articles = $DBLIB->get("articles", null, ["articles.articles_categories","articles.articles_slug", "articles.articles_authors", "articles.articles_published", "articles.articles_updated", "articles.articles_showInSearch", "articles.articles_showInLists","articles.articles_id","articles.articles_published", "articlesDrafts.articlesDrafts_headline", "articles.articles_editionPage"]);
		foreach ($articles as $article) {
			$article['articles_categories'] = explode(",", $article['articles_categories']);
			if (in_array($article['articles_id'], $PAGEDATA['edition']['featuredArticlesID'])) {
				$article['featuredKey'] = array_search($article['articles_id'], $PAGEDATA['edition']['featuredArticlesID']);
				$PAGEDATA['edition']['featuredArticles'][] = $article;
			}
			$PAGEDATA['articles'][] = $article;
		}
	}

	usort($PAGEDATA['edition']['featuredArticles'], function($a, $b) {
		return $a['featuredKey'] - $b['featuredKey'];
	});

} else die("404 File not found");

echo $TWIG->render('edition.twig', $PAGEDATA);
?>
