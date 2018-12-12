<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Website Credits"];

echo $TWIG->render('pages/websiteCredits.twig', $PAGEDATA);
?>
