<?php
require_once __DIR__ . '/../apiHeadSecure.php';

if (!isset($_POST['selection']) or !$AUTH->permissionCheck(22)) finish(false, ["code" => "PARAM", "message"=> "Parameter error"]);

if ($DBLIB->insert("featuredHome", ["featuredHome_articles" => implode(",", explode(",", $bCMS->sanitizeString($_POST['selection']))), "featuredHome_timestamp" => date('Y-m-d H:i:s'), "users_userid" => $AUTH->data['users_userid']])) {
    $bCMS->auditLog("SET FEATURED", "featuredHome", implode(",", explode(",", $bCMS->sanitizeString($_POST['selection']))), $AUTH->data['users_userid']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL']); //Homepage has a list on it
    finish(true);
} else  finish(false, ["code" => "PARAM", "message"=> "Update error"]);
