<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$AUTH->permissionCheck(42) or !isset($_GET['id'])) finish(false, ["code" => null, "message" => "No data specified or auth fail"]);

$DBLIB->where('comments_id', $bCMS->sanitiseString($_GET['id']));
if ($DBLIB->update('comments', ["comments_show" => 1])) {
    $bCMS->auditLog("RESTORE", "comments", $bCMS->sanitiseString($_GET['id']), $AUTH->data['users_userid']);
    finish(true);
}

finish(false, ["code" => null, "message" => "DB Error"]);
