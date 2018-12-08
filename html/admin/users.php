<?php
	require_once __DIR__ . '/common/headSecure.php';

	$PAGEDATA['pageConfig'] = ["TITLE" => "Users", "BREADCRUMB" => false];

	if (!$AUTH->permissionCheck(2)) die("Sorry - you can't access this page");

	$PAGEDATA["mailings"] = [];

	$DBLIB->orderBy("users.users_name1", "ASC");
	$DBLIB->orderBy("users.users_name2", "ASC");
	$DBLIB->orderBy("users.users_created", "ASC");
	//if (!isset($_GET['suspended'])) $DBLIB->where ("users.users_suspended", "0");
	$users = $DBLIB->get('users');

	foreach ($users as $user) {
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
?>
