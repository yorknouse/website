<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Account Settings", "BREADCRUMB" => true];

echo $TWIG->render('account.twig', $PAGEDATA);
?>
