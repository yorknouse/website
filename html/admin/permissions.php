<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Permissions", "BREADCRUMB" => false];

if (!in_array("83", $USERDATA['permissions'])) die(render404());

$DBLIB->orderBy("features_categories_order", "ASC");
$PAGEDATA['featuresCategories'] = $DBLIB->get("features_categories");

$PAGEDATA['features'] = [];
foreach ($PAGEDATA['featuresCategories'] as $category) {
    $DBLIB->orderBy("features_order", "ASC");
    $DBLIB->orderBy("id", "ASC");
    $DBLIB->orderBy("name", "ASC");
    $DBLIB->where("features_categories_id", $category["features_categories_id"]);
    $PAGEDATA['features'][] = ["category" => $category, "features" => $DBLIB->get("features")];
}

$DBLIB->where("eventid", $USERDATA['eventid']);
$PAGEDATA['positions'] = $DBLIB->get("positions");

echo $TWIG->render('permissions.twig', $PAGEDATA);
?>
