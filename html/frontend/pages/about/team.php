<?php
require_once __DIR__ . '/../../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Current Team"];

echo $TWIG->render('pages/team.twig', $PAGEDATA);
?>
