<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Editions", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(49)) die("Sorry - you can't access this page");

if (isset($_GET['q'])) $PAGEDATA['search'] = $bCMS->sanitizeString($_GET['q']);
else $PAGEDATA['search'] = null;

if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
else $page = 1;
$DBLIB->pageLimit = 100;
if (strlen($PAGEDATA['search']) > 0) {
	//Search
	$DBLIB->where("
		(editions.editions_excerpt LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR editions.editions_name LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR editions.editions_printNumber LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR editions.editions_slug LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%')
    ");
}
$DBLIB->orderBy("editions_published", "DESC");
$DBLIB->where("editions_deleted", 0); //ie those that can actually be shown
$editions = $DBLIB->arraybuilder()->paginate("editions", $page, ["editions.*"]);
$PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages];
$PAGEDATA['editions'] = [];
foreach ($editions as $edition) {
	$DBLIB->where("editions_id", $edition['editions_id']);
	$DBLIB->where("articles.articles_showInAdmin", 1); //ie those that can actually be shown
	$edition['count'] = $DBLIB->getValue("articles", "count(*)");
	$PAGEDATA['editions'][] = $edition;
}


echo $TWIG->render('editions.twig', $PAGEDATA);
