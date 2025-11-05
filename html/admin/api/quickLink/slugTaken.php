<?php
global $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!isset($_GET['slug'])) die("404");

$DBLIB->where('quickLinks_string', strtolower($bCMS->sanitiseString($_GET['slug'])));
$DBLIB->where('quickLinks_deleted', 0);
if ($DBLIB->getValue("quickLinks", "COUNT(*)") > 0)
    die("TAKEN");

die("1");
