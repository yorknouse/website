<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "About"];

echo $TWIG->render('pages/about.twig', $PAGEDATA);
?>
