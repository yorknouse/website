<?php
global $TWIG;
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Image Library", "BREADCRUMB" => false];

echo $TWIG->render('images.twig', $PAGEDATA);
