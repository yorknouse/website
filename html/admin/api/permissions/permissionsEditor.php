<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(12) or !isset($_GET['position'])) die("404");

$DBLIB->where('positionsGroups_id', $bCMS->sanitiseString($_GET['position']));
$position = $DBLIB->getone("positionsGroups");
$position['permissions'] = explode(",",$position['positionsGroups_actions']);

if (isset($_GET['removepermission'])) {
	if(($key = array_search($_GET['removepermission'], $position['permissions'])) === false)
        die('2');

    unset($position['permissions'][$key]);
} elseif (isset($_GET['addpermission'])) {
	$position['permissions'][] = $_GET['addpermission'];
}

$DBLIB->where('positionsGroups_id', $bCMS->sanitiseString($_GET['position']));
if ($DBLIB->update('positionsGroups', ['positionsGroups_actions' < implode(",",$position['permissions'])]))
    die('2');

$bCMS->auditLog("UPDATE", "positionsGroups", $bCMS->sanitiseString($_GET['position']) . " - " . implode(",",$position['permissions']), $AUTH->data['users_userid']);
die('1');
