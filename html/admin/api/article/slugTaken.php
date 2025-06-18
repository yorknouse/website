<?php
global $AUTH, $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(31) or !$AUTH->permissionCheck(32) or !isset($_GET['slug'])) die("404");

$DBLIB->where('articles_slug', $bCMS->sanitizeString($_GET['slug']));
if ($DBLIB->getValue("articles", "COUNT(*)") > 0) die("TAKEN");

die("1");