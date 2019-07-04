<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Redirect Links", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(44)) die("Sorry - you can't access this page");

if (isset($_GET['q'])) $PAGEDATA['search'] = $bCMS->sanitizeString($_GET['q']);
else $PAGEDATA['search'] = null;

if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
else $page = 1;
$DBLIB->pageLimit = 20; //Users per page
$DBLIB->orderBy("quickLinks.quickLinks_created", "DESC");
$DBLIB->join("users", "quickLinks.users_userid=users.users_userid", "LEFT");
if (strlen($PAGEDATA['search']) > 0) {
	//Search
	$DBLIB->where("(
		quickLinks.quickLinks_string LIKE '%" . $PAGEDATA['search'] . "%'
		OR quickLinks.quickLinks_pointsTo LIKE '%" . $PAGEDATA['search'] . "%'
		OR quickLinks.quickLinks_notes LIKE '%" . $PAGEDATA['search'] . "%'
		OR CONCAT( users.users_name1,  ' ', users.users_name2 ) LIKE '%" . $PAGEDATA['search'] . "%'
    )");
}
$quickLinks = $DBLIB->arraybuilder()->paginate('quickLinks', $page, ["quickLinks.*, users.users_name1, users.users_name2, users.users_userid"]);
$PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages];
$PAGEDATA['quickLinks'] = [];
foreach ($quickLinks as $link) {
	if (substr($link['quickLinks_pointsTo'], 0, 1) == "/") {
		$link['quickLinks_pointsTo_pretty'] = $PAGEDATA['CONFIG']['ROOTFRONTENDURL'] . $link['quickLinks_pointsTo'];
	} else {
		$link['quickLinks_pointsTo_pretty'] = $link['quickLinks_pointsTo'];
	}
	$PAGEDATA['quickLinks'][] = $link;
}

echo $TWIG->render('quicklinks.twig', $PAGEDATA);
?>
