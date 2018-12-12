<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Archives"];

echo $TWIG->render('pages/archives.twig', $PAGEDATA);
?>
