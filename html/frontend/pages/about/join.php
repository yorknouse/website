<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Join Nouse"];

echo $TWIG->render('pages/join.twig', $PAGEDATA);
?>
