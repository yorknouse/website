<?php
global $AUTH, $DBLIB, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(45)) die("404");

$DBLIB->where('quickLinks_string', $bCMS->sanitiseString($_GET['string']));
$DBLIB->where('quickLinks_deleted', 0);
if ($DBLIB->getValue("quickLinks", "COUNT(*)") > 0) die("TAKEN");

$data = [
    "quickLinks_string" => str_replace('&amp;', '&', strtolower($bCMS->sanitiseString(urldecode($_GET['string'])))),
    "quickLinks_pointsTo" => str_replace('&amp;', '&', str_replace($CONFIG['ROOTFRONTENDURL'], '', $bCMS->sanitiseString(urldecode($_GET['destination'])))),
    "quickLinks_notes" => $bCMS->sanitiseString($_GET['notes']),
    "quickLinks_created" => date("Y-m-d H:i:s"),
    "users_userid" => $AUTH->data['users_userid']
];
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . $bCMS->sanitiseString($_GET['string']));
$bCMS->auditLog("CREATE", "quickLink", "", $AUTH->data['users_userid']);
if (!$DBLIB->insert("quickLinks", $data))
    die("404");

die("1");
