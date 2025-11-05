<?php
global $USERDATA, $DBLIB, $bCMS, $AUTH;
require_once __DIR__ . '/../apiHeadSecure.php';

header('Content-Type:text/plain');

if (isset($_GET['forename'])) {
    if ($_GET['userid'] == "NEW" and $AUTH->permissionCheck(4)) $newUser = true; //Are we making a new user here?
    else $newUser = false;

    if ($AUTH->permissionCheck(5) && $USERDATA['users_userid'] != $_GET['userid'] && !$newUser) {
        $DBLIB->where("users_userid", $bCMS->sanitiseString($_GET['userid']));
        $thisUser = $DBLIB->getone("users", ["users_userid"]);
        if (!$thisUser) die("5");
        $userid = $thisUser["users_userid"];
    } else {
        $userid = $USERDATA['users_userid'];
        $thisUser = false;
    }

    $data = Array (
        'users_name1' => $bCMS->sanitiseString($_GET['forename']),
        'users_name2' => $bCMS->sanitiseString($_GET['lastname']),
        'users_pronouns' => $bCMS->sanitiseString($_GET['pronouns']),
        'users_bio' => $bCMS->cleanString($_GET['bio'])
    );
    if ($USERDATA['users_userid'] != $_GET['userid']) {
        $data['users_googleAppsUsernameYork'] = (strlen($_GET['yorkusername']) > 0 ? str_replace("@york.ac.uk","",$bCMS->sanitiseString($_GET['yorkusername'])) : '');
        $data['users_googleAppsUsernameNouse'] = (strlen($_GET['nouseusername']) > 0 ? str_replace("@nouse.co.uk","",$bCMS->sanitiseString($_GET['nouseusername'])) : '');
    }

    if (!$newUser) {
        $DBLIB->where('users_userid', $userid);
        if ($DBLIB->update('users', $data)) {
            $bCMS->auditLog("UPDATE", "users", json_encode($data), $AUTH->data['users_userid'],$userid);
            die("1");
        } else die("2");
    } else {
        $newUser = $DBLIB->insert("users", $data);
        if (!$newUser) die("6");
        else {
            $bCMS->auditLog("INSERT", "users", json_encode($data), $AUTH->data['users_userid'],$newUser);
            die("" . json_encode(["result" => true, "newUserId" => $newUser]));
        }
    }
} else die('3');
