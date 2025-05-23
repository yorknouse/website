<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Users", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(40)) die("Sorry - you can't access this page");

if (isset($_GET['q']) and isset($_GET['id']) and (strlen($_GET['id']) > 0 or strlen($_GET['q']) > 0)) {
	if (strlen($_GET['id']) > 0) $DBLIB->where("comments_id", $bCMS->sanitizeString($_GET['id']));
	else $DBLIB->where("comments_text LIKE '%" . $bCMS->sanitizeString($_GET['q']) . "%'");
	$PAGEDATA['comments'] = $DBLIB->get("comments", null, ["comments.*"]);

	echo $TWIG->render('comments.twig', $PAGEDATA);
} else {
	echo $TWIG->render('commentsSearch.twig', $PAGEDATA);
}
