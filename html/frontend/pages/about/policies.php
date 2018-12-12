<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Website Policies"];

echo $TWIG->render('pages/websitePolicies.twig', $PAGEDATA);
?>
