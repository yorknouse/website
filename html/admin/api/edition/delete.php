<?php
global $AUTH, $DBLIB, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(52) or !isset($_GET['editionid']) or !is_numeric($_GET['editionid'])) die("404");

$DBLIB->where('editions_id', $bCMS->sanitizeString($_GET['editionid']));
$edition = $DBLIB->getOne("editions", ["editions_id","editions_slug"]);
if (!$edition) die("404");

$bCMS->auditLog("DELETE", "editions", $edition['editions_id'], $AUTH->data['users_userid']);

$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/edition/" . $edition['editions_slug']);
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL']);

$DBLIB->where('editions_id', $edition['editions_id']);
if (!$DBLIB->update('editions', ["editions_deleted" => 1]))
    die('2');

die('1');
