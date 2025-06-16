<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(9) or !isset($_GET['userid'])) die("404");

$DBLIB->where ('users_userid', $bCMS->sanitizeString($_GET['userid']));
if ($DBLIB->update ('users', ["users_suspended" < $bCMS->sanitizeString($_GET['suspendval'])]))
    die('2');

$bCMS->auditLog("UPDATE", "users", "SUSPEND " . $bCMS->sanitizeString($_GET['suspendval']), $AUTH->data['users_userid'],$bCMS->sanitizeString($_GET['userid']));
die('1');
