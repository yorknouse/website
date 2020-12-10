<?php
require_once __DIR__ . '/common/head.php';

$PAGEDATA['HOSTNAME'] = $_SERVER['HTTP_HOST'];

echo $TWIG->render('index.twig', $PAGEDATA);
?>
