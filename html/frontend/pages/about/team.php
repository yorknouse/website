<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Current Team", "VIEW" => (isset($_GET['g']) ? "grid" : "table")];

$completedUsers = [];

if ($PAGEDATA['pageConfig']['VIEW'] == "table") {
    $PAGEDATA['POSITIONS'] = [];
    $DBLIB->orderBy("positions.positions_rank", "ASC");
    $positions = $DBLIB->get("positions");
    foreach ($positions as $position) {
        $position['USERS'] = [];
        $DBLIB->where("userPositions.userPositions_end > '" . date("Y-m-d H:i:s") . "'");
        $DBLIB->where("userPositions.positions_id", $position['positions_id']);
        $DBLIB->where("users.users_deleted", 0);
        $DBLIB->orderBy("users.users_name1", "ASC");
        $DBLIB->orderBy("users.users_name2", "ASC");
        $DBLIB->join("users","userPositions.users_userid=users.users_userid", "LEFT");
        $PAGEDATA['USERS'] = [];
        foreach ($DBLIB->get("userPositions", null, ["users_name1", "users_name2",
            "users_bio",
            "users_social_facebook",
            "users_social_instagram",
            "users_social_twitter",
            "users_social_snapchat",
            "users.users_userid",
            "users_googleAppsUsernameYork",
            "users_googleAppsUsernameNouse"
        ]) as $user) {
            $position['USERS'][] = $user;
        }
        if (count($position['USERS']) > 0) $PAGEDATA['POSITIONS'][] = $position; //Don't show a position if it's unfilled
    }
} else {
    $DBLIB->where("userPositions.userPositions_end > '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("positions", "userPositions.positions_id=positions.positions_id", "LEFT");
    $DBLIB->orderBy("positions.positions_rank", "ASC");
    $PAGEDATA['USERS'] = [];
    foreach ($DBLIB->get("userPositions", null, ["userPositions.users_userid"]) as $user) {
        if (in_array($user['users_userid'], $completedUsers)) continue;
        else array_push($completedUsers, $user['users_userid']);

        $DBLIB->where("users_deleted", 0);
        $DBLIB->where("users_userid", $user['users_userid']);
        $user = $DBLIB->getone("users", [
            "users_name1", "users_name2",
            "users_bio",
            "users_social_facebook",
            "users_social_instagram",
            "users_social_twitter",
            "users_social_snapchat",
            "users_userid",
            "users_googleAppsUsernameYork",
            "users_googleAppsUsernameNouse"
        ]);
        $user['POSITIONS'] = userPositions($user['users_userid']);
        $user['IMAGE'] = userImage($user['users_userid']);
        $PAGEDATA['USERS'][] = $user;
    }
}

echo $TWIG->render('pages/team.twig', $PAGEDATA);
?>
