<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(46) or !isset($_GET['id']) or !is_numeric($_GET['id'])) die("404");

$DBLIB->where ('quickLinks_id', $_GET['id']);
$DBLIB->where ('quickLinks_deletable', 1);
$DBLIB->where ('quickLinks_deleted', 0);
$link = $DBLIB->getOne("quickLinks", ["quickLinks_id", "quickLinks_string"]);

if ($link) {
    $DBLIB->where ('quickLinks_id', $link['quickLinks_id']);
    if ($DBLIB->update ('quickLinks', ["quickLinks_deleted" => 1])) {
        $bCMS->auditLog("DELETE", "quickLinks", $bCMS->sanitizeString($_GET['id']), $AUTH->data['users_userid']);
        $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . $link['quickLinks_string']);
        die("1");
    } else die("2");
} else die("404");