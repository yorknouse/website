<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Contact"];

echo $TWIG->render('pages/contact.twig', $PAGEDATA);
?>
