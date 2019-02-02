<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Home", "BREADCRUMB" => false];

$PAGEDATA['CHANGELOG'] = [];
exec("cd " . __DIR__ . "/../../ && git log -10", $PAGEDATA['CHANGELOG']);

echo $TWIG->render('index.twig', $PAGEDATA);
?>
