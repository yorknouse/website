<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Current Team"];

$completedUsers = [];

$DBLIB->where("userPositions.userPositions_end > '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("positions","userPositions.positions_id=positions.positions_id", "LEFT");
$DBLIB->orderBy("positions.positions_rank", "ASC");
$PAGEDATA['USERS'] = [];
foreach ($DBLIB->get("userPositions", null, ["userPositions.users_userid"]) as $user) {
    if (in_array($user['users_userid'], $completedUsers)) continue;
    else array_push($completedUsers,$user['users_userid']);

    $DBLIB->where("users_deleted", 0);
    $DBLIB->where("users_userid", $user['users_userid']);
    $user = $DBLIB->getone("users", [
        "users_name1", "users_name2",
        "users_bio",
        "users_social_facebook",
        "users_social_instagram",
        "users_social_twitter",
        "users_social_snapchat",
        "users_userid"
    ]);
    $user['POSITIONS'] = userPositions($user['users_userid']);
    $user['IMAGE'] =  userImage($user['users_userid']);
    $PAGEDATA['USERS'][] = $user;
}

echo $TWIG->render('pages/team.twig', $PAGEDATA);
?>
