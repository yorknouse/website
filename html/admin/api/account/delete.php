<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(15) or !isset($_GET['userid'])) die("404");

$DBLIB->where ('users_userid', $bCMS->sanitizeString($_GET['userid']));
if (!$DBLIB->update ('users', ["users_deleted" => 1]))
    die('2');

$bCMS->auditLog("UPDATE", "users", "DELETE USER", $AUTH->data['users_userid'],$bCMS->sanitizeString($_GET['userid']));
die('1');
