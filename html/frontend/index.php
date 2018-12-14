<?php
require_once __DIR__ . '/common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => null, "FEATURED" => true, "showLoader" => true];

echo $TWIG->render('index.twig', $PAGEDATA);
?>
