<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Banned Commenters", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(53)) die("Sorry - you can't access this page");

$DBLIB->orderBy("COUNT(*)", "DESC");
$DBLIB->orderBy("comments_authorEmail", "ASC");
$DBLIB->where("comments_approved", 4); //ie those that can actually be shown
$DBLIB->groupBy ("comments_authorEmail");
$PAGEDATA['list'] = $DBLIB->get("comments",null, ["COUNT(*)","comments_authorEmail"]);

echo $TWIG->render('commentersBanned.twig', $PAGEDATA);
?>
