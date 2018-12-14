<?php
header('Content-Type: text/xml');
require_once __DIR__ . '/../common/head.php';

echo $TWIG->render('feeds/index.twig', $PAGEDATA);
?>