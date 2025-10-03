<?php
global $AUTH, $DBLIB, $TWIG;
require_once __DIR__ . '/common/headSecure.php';
if (!$AUTH->permissionCheck(58) or !isset($_GET['id'])) die("Sorry - you can't access this page");

$DBLIB->where("adverts_id",$_GET['id']);
$DBLIB->where("adverts_deleted", 0); //ie those that can actually be shown
$PAGEDATA['advert'] = $DBLIB->getOne("adverts");

$PAGEDATA['pageConfig'] = ["TITLE" => "Edit Advert " . $PAGEDATA['advert']['adverts_name'], "BREADCRUMB" => false];

echo $TWIG->render('advert.twig', $PAGEDATA);
