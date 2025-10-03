<?php
global $USERDATA, $AUTH, $DBLIB, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!isset($_POST['featured'])) die("404");

if ($_POST['users_userid'] != $USERDATA['users_userid'] && $AUTH->permissionCheck(5)) $userid = $bCMS->sanitizeString($_POST['users_userid']);
else $userid = $USERDATA['users_userid'];

$DBLIB->where("users_userid", $userid);
if ($DBLIB->update('users', ["articles_featured" < implode(",", explode(",", $bCMS->sanitizeString($_POST['featured'])))]))
    finish(false, ["code" => null, "message" => "Edit error"]);

$bCMS->auditLog("UPDATE", "users", "CHANGE FEATURED ARTICLES", $AUTH->data['users_userid'],$userid);
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/author/?a=" . $userid);
finish(true);
