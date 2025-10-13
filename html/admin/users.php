<?php
global $AUTH, $DBLIB, $bCMS, $TWIG;
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Users", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(2)) die("Sorry - you can't access this page");

$PAGEDATA["mailings"] = [];

if (isset($_GET['q'])) $PAGEDATA['search'] = $bCMS->sanitizeString($_GET['q']);
else $PAGEDATA['search'] = null;

if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
else $page = 1;
$DBLIB->pageLimit = 20; //Users per page
$DBLIB->orderBy("(SELECT COUNT(DISTINCT users_userid) FROM userPositions WHERE users_userid=users.users_userid AND userPositions_end >= '" . date('Y-m-d H:i:s') . "' AND userPositions_start <= '" . date('Y-m-d H:i:s') . "')", "DESC");
$DBLIB->orderBy("users.users_name1", "ASC");
$DBLIB->orderBy("users.users_name2", "ASC");
$DBLIB->orderBy("users.users_created", "ASC");
$DBLIB->where("users_deleted", 0);
if (strlen($PAGEDATA['search']) > 0) {
	//Search
	$DBLIB->where("(
		users_googleAppsUsernameYork LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR users_name1 LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR users_name2 LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'	
		OR CONCAT( users_name1,  ' ', users_name2 ) LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR users_googleAppsUsernameNouse LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
    )");
}
//if (!isset($_GET['suspended'])) $DBLIB->where("users.users_suspended", "0");
$users = $DBLIB->arraybuilder()->paginate('users', $page, ["users.*"]);
$PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages];
foreach ($users as $user) {
    // Decode any HTML entities in user name fields
    $user['users_name1'] = html_entity_decode($user['users_name1'] ?? '', ENT_QUOTES);
    $user['users_name2'] = html_entity_decode($user['users_name2'] ?? '', ENT_QUOTES);

	$DBLIB->where('users_userid', $user['users_userid']);
	$PAGEDATA["mailings"][$user['users_userid']] = $DBLIB->get('emailSent'); //Get user's E-Mails
	$user['emails'] = [];
	foreach ($PAGEDATA["mailings"][$user['users_userid']] as $email) {
		$user['emails'][] = $email['emailSent_id'];
	}
	$user['users_emails'] = implode(",", $user['emails']);

	$DBLIB->where("users_userid", $user['users_userid']);
	$DBLIB->where("userPositions_end >= '" . date('Y-m-d H:i:s') . "'");
	$DBLIB->where("userPositions_start <= '" . date('Y-m-d H:i:s') . "'");
	$DBLIB->orderBy("positions_rank", "ASC");
	$DBLIB->orderBy("positions_displayName", "ASC");
	$DBLIB->join("positions", "positions.positions_id=userPositions.positions_id", "LEFT");
	$user['currentPositions'] = $DBLIB->get("userPositions",null,["positions.positions_displayName","userPositions.userPositions_displayName"]);


	$PAGEDATA["users"][] = $user;
}

echo $TWIG->render('users.twig', $PAGEDATA);
