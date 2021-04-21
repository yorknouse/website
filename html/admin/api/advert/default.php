<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(58) or !isset($_GET['id']) or !is_numeric($_GET['id'])) die("404");

$DBLIB->where ('adverts_id', $_GET['id']);
$select = $DBLIB->getOne("adverts", ["adverts_id"]);
if (!$select) die("404");

$bCMS->auditLog("SETDEFAULT", "adverts", $select['adverts_id'], $AUTH->data['users_userid']);


$update = $DBLIB->update ('adverts', ["adverts_default" => 0]); //Clear all the other defaults - there can only be 1
if (!$update) die("2");

$DBLIB->where ('adverts_id', $select['adverts_id']);
if ($DBLIB->update ('adverts', ["adverts_default" => 1,"adverts_start"=>null,"adverts_end"=>null],1)) die('1');
else die('2');
