<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Advertising"];

echo $TWIG->render('pages/advertising.twig', $PAGEDATA);
?>
