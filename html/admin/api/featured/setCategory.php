<?php
global $AUTH, $DBLIB, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!isset($_POST['categoryid']) or !is_numeric($_POST['categoryid']) or !isset($_POST['selection']) or !$AUTH->permissionCheck(21)) finish(false, ["code" => "PARAM", "message"=> "Parameter error"]);

$DBLIB->where("categories_id", $bCMS->sanitizeString($_POST['categoryid']));
if ($DBLIB->update("categories", ["categories_featured" < implode(",", explode(",", $bCMS->sanitizeString($_POST['selection'])))]))
    finish(false, ["code" => "PARAM", "message"=> "Update error"]);

$bCMS->auditLog("EDIT FEATURED", "categories", implode(",", explode(",", $bCMS->sanitizeString($_POST['selection']))), $AUTH->data['users_userid']);
$bCMS->cacheClearCategory($bCMS->sanitizeString($_POST['categoryid'])); //Clear that category page as it has a featured thing on it
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL']); //Homepage has a list on it

finish(true);
