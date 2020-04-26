<?php
require_once __DIR__ . '/../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Editions"];

$DBLIB->orderBy("editions_published", "DESC");
$DBLIB->where("editions_deleted", 0); //ie those that can actually be shown
$DBLIB->where("(editions_thumbnail IS NOT NULL)");
$DBLIB->where("editions.editions_show",1);
$PAGEDATA['editions'] = $DBLIB->get("editions", null, ["editions_slug", "editions_published","editions_printNumber","editions_thumbnail","editions_name","editions_excerpt"]);

echo $TWIG->render('editions.twig', $PAGEDATA);
?>
