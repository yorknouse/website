<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Macros", "BREADCRUMB" => true];

if (!$AUTH->permissionCheck(43)) die("Sorry - you can't access this page");

echo $TWIG->render('macros.twig', $PAGEDATA);
