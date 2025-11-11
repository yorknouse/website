<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(58) or !isset($_GET['id']) or !is_numeric($_GET['id'])) die("404");

$DBLIB->where('adverts_id', $_GET['id']);
$select = $DBLIB->getOne("adverts", ["adverts_id","adverts_enabled"]);
if (!$select) die("404");

if ($select['adverts_enabled'] == 1) $bCMS->auditLog("ENABLE", "adverts", $select['adverts_id'], $AUTH->data['users_userid']);
else $bCMS->auditLog("DISABLE", "adverts", $select['adverts_id'], $AUTH->data['users_userid']);

$DBLIB->where('adverts_id', $select['adverts_id']);
if ($DBLIB->update('adverts', ["adverts_enabled" => ($select['adverts_enabled'] == 1 ? 0 : 1)],1))
    die('2');

die('1');
