<?php
global $AUTH, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$AUTH->permissionCheck(10)) die("Sorry - you can't access this page");
if (!(isset($_GET['userid']))) die("No uid passed");

if ($AUTH->generateToken($bCMS->sanitiseString($_GET['userid']), false, $AUTH->data['users_userid'])) {
    $bCMS->auditLog("VIEWSITEAS", "users", null, $AUTH->data['users_userid'],$bCMS->sanitiseString($_GET['userid']));
    header('Location: '. $CONFIG->ROOTBACKENDURL);
    exit;
}
