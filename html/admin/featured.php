<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Featured Articles", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(20)) die("Sorry - you can't access this page");

$DBLIB->where("categories_showPublic",1);
$DBLIB->where("categories_showHome", 1);
$DBLIB->orderBy("categories_order", "ASC");
$DBLIB->orderBy("categories_displayName", "ASC");
$DBLIB->where("categories_nestUnder IS NULL");
$PAGEDATA['CATEGORIES'] = [];

foreach ($DBLIB->get("categories",null, ["categories_id", "categories_displayName"]) as $category) {
    $PAGEDATA['CATEGORIES'][] = $category;
}


echo $TWIG->render('featured.twig', $PAGEDATA);
?>
