<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Articles", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(32)) die("Sorry - you can't access this page");

if (isset($_GET['id'])) {
	$DBLIB->where("articles.articles_id", $bCMS->sanitizeString($_GET['id'])); //ie those that can actually be shown
	$DBLIB->orderBy("articles_published", "DESC");
	$DBLIB->where("articles_showInAdmin", 1); //ie those that can actually be shown
	$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
	$DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
	$PAGEDATA['article'] = $DBLIB->getone("articles");
	if (!$PAGEDATA['article']) die("404 File not found");
	$DBLIB->where("articlesAuthors.articles_id", $bCMS->sanitizeString($_GET['id']));
	$PAGEDATA['article']['articles_authors'] = array_column($DBLIB->get("articlesAuthors"), 'users_userid');
	$DBLIB->where("articlesCategories.articles_id", $bCMS->sanitizeString($_GET['id']));
	$PAGEDATA['article']['articles_categories'] = array_column($DBLIB->get("articlesCategories"), 'categories_id');
	if ($PAGEDATA['article']['articles_type'] == 2) {
		$PAGEDATA['article']['galleryImages'] = [];
		if (strlen($PAGEDATA['article']['articlesDrafts_text']) > 0) {
			foreach (explode(",", $PAGEDATA['article']['articlesDrafts_text']) as $image) {
				$PAGEDATA['article']['galleryImages'][] = $bCMS->s3URL($image, "small", false, null, true);
			}
		}
	}
	$DBLIB->orderBy("articlesDrafts_timestamp", "DESC");
	$DBLIB->join("users", "users.users_userid=articlesDrafts.articlesDrafts_userid", "LEFT");
	$DBLIB->where("articles_id",$PAGEDATA['article']['articles_id']);
	$PAGEDATA['article']['drafts'] = $DBLIB->get("articlesDrafts");
} else {
	$PAGEDATA['article'] = [];
	if (isset($_GET['type'])) $PAGEDATA['article']['articles_type'] = $_GET['type']; //So the new one is created in the right format
	else $PAGEDATA['article']['articles_type'] = 1;
}



//              CATEGORIES
//		Here only have 2 levels of nesting
$DBLIB->where("categories_showPublic",1);
$DBLIB->orderBy("categories_order", "ASC");
$DBLIB->orderBy("categories_displayName", "ASC");
$DBLIB->where("categories_nestUnder IS NULL");
$PAGEDATA['CATEGORIES'] = [];
foreach ($DBLIB->get("categories") as $category) {
	$DBLIB->orderBy("categories_order", "ASC");
	$DBLIB->orderBy("categories_displayName", "ASC");
	$DBLIB->where("categories_showPublic",1);
	$DBLIB->where("categories_nestUnder", $category["categories_id"]);
	$category['SUB'] = [];
	foreach ($DBLIB->get("categories") as $subcategory) {
		$category['SUB'][] = $subcategory;
		$DBLIB->orderBy("categories_order", "ASC");
		$DBLIB->orderBy("categories_displayName", "ASC");
		$DBLIB->where("categories_showPublic",1);
		$DBLIB->where("categories_nestUnder", $subcategory["categories_id"]);
		foreach ($DBLIB->get("categories") as $subsubcategory) {
			$category['SUB'][] = $subsubcategory;
		}
	}
	$PAGEDATA['CATEGORIES'][] = $category;
}



//              Authors
$DBLIB->orderBy("users.users_name1", "ASC");
$DBLIB->orderBy("users.users_name2", "ASC");
$DBLIB->orderBy("users.users_created", "ASC");
$DBLIB->where("users_deleted", 0);
$PAGEDATA['USERS'] = $DBLIB->get("users", null, ["users_name1","users_name2","users_userid"]);

//				Editions
$DBLIB->orderBy("editions_published", "DESC");
$DBLIB->where("editions_deleted", 0); //ie those that can actually be shown
$PAGEDATA['EDITIONS'] = $DBLIB->get("editions", null, ["editions.editions_id", "editions.editions_name", "editions.editions_printNumber"]);

echo $TWIG->render('article.twig', $PAGEDATA);
?>
