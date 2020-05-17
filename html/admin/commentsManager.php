<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Comments Manager", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(54)) die("Sorry - you can't access this page");

$PAGEDATA['allTimeComments'] = $DBLIB->getValue("comments", "COUNT(*)");
$DBLIB->where("comments_show",1);
$DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
$PAGEDATA['allTimeCommentsApproved'] = $DBLIB->getValue("comments", "COUNT(*)");
$PAGEDATA['allTimeCommentsApprovedPercentage'] = ($PAGEDATA['allTimeCommentsApproved']/$PAGEDATA['allTimeComments'])*100;
$DBLIB->where("comments_show",1);
$DBLIB->where("comments_approved",1);
$PAGEDATA['allTimeCommentsManual'] = $DBLIB->getValue("comments", "COUNT(*)");
$PAGEDATA['allTimeCommentsManualPercentage'] = ($PAGEDATA['allTimeCommentsManual']/$PAGEDATA['allTimeComments'])*100;

$DBLIB->where("comments_approved", 4);
$PAGEDATA['allTimeCommentersBanned'] = $DBLIB->getValue("comments", "COUNT(DISTINCT comments_authorEmail)");

$DBLIB->where("(comments_approved = 6 OR comments_approved = 4)");
$PAGEDATA['allTimeCommentsManualReject'] = $DBLIB->getValue("comments", "COUNT(*)");

$DBLIB->where("comments_show",1);
$DBLIB->where("comments_approved",5);
$PAGEDATA['allTimeCommentsAutoApprovedBasedOnPreviousRep'] = $DBLIB->getValue("comments", "COUNT(*)");

$DBLIB->where("comments_approved_userid", $AUTH->data['users_userid']);
$PAGEDATA['allTimeYourModerated'] = $DBLIB->getValue("comments", "COUNT(*)");


echo $TWIG->render('commentsManager.twig', $PAGEDATA);
?>