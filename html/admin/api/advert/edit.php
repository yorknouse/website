<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(58) or !isset($_POST['id']) or !is_numeric($_POST['id'])) die("404");

$DBLIB->where('adverts_id', $bCMS->sanitizeString($_POST['id']));
$advert = $DBLIB->getOne("adverts");
if (!$advert) die("404");

$newData = [];
$newData["adverts_name"] = $bCMS->cleanString($_POST["adverts_name"]);
$newData["adverts_notes"] = $bCMS->cleanString($_POST["adverts_notes"]);
$newData["adverts_link"] = $bCMS->cleanString($_POST["adverts_link"]);
$newData["adverts_enabled"] = $bCMS->cleanString($_POST["adverts_enabled"]);
if ($_POST["adverts_link"] == null or $_POST["adverts_bannerImage"] == null) $newData["adverts_enabled"] = 0;
$newData["adverts_start"] = ($_POST['adverts_start'] != null ? date("Y-m-d H:i:s", strtotime($bCMS->cleanString($_POST["adverts_start"]))) : null);
$newData["adverts_end"] = ($_POST['adverts_end'] != null ? date("Y-m-d H:i:s", strtotime($bCMS->cleanString($_POST["adverts_end"]))) : null);
$newData["adverts_bannerImageMob"] = ($_POST["adverts_bannerImageMob"] != null ? $_POST["adverts_bannerImageMob"] : null);
$newData["adverts_bannerImage"] = ($_POST["adverts_bannerImage"] != null ? $_POST["adverts_bannerImage"] : null);

$DBLIB->where('adverts_id', $advert['adverts_id']);
if ($DBLIB->update('adverts', $newData))
    finish(false, ["code" => null, "message" => "Edit error"]);

$bCMS->auditLog("EDIT", "advert", json_encode(["adverts_id" => $advert['adverts_id'], "newData" => $newData]), $AUTH->data['users_userid']);
finish(true);
