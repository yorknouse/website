<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(58) or !isset($_GET['title']) or (strlen($_GET['title']) < 1)) die("404");

$result = $DBLIB->insert("adverts", [
    "adverts_name" => $bCMS->cleanString($_GET['title']),
    "adverts_deleted" => 0,
    "adverts_enabled" => 0,
    "adverts_default" => 0
]);
if (!$result) {
    echo $DBLIB->getLastError();
    finish(false, ["code" => null, "message" => "Insert error"]);
}

$bCMS->auditLog("INSERT", "adverts", $result, $AUTH->data['users_userid']);
finish(true, null, ["id" => $result]);
