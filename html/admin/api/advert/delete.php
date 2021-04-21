<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(58) or !isset($_GET['id']) or !is_numeric($_GET['id'])) die("404");

$DBLIB->where ('adverts_id', $_GET['id']);
$select = $DBLIB->getOne("adverts", ["adverts_id"]);
if (!$select) die("404");

$bCMS->auditLog("DELETE", "adverts", $select['adverts_id'], $AUTH->data['users_userid']);

$DBLIB->where ('adverts_id', $select['adverts_id']);
if ($DBLIB->update ('adverts', ["adverts_deleted" => 1],1)) die('1');
else die('2');
