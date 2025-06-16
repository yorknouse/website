<?php
global $AUTH, $DBLIB, $TWIG;
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Comments Manager", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(54)) die("Sorry - you can't access this page");

$stats = $DBLIB->rawQuery("
  SELECT
    COUNT(*) AS allTimeComments,
    SUM(CASE WHEN comments_show = 1 AND comments_approved IN (1,2,3,5) THEN 1 ELSE 0 END) AS allTimeCommentsApproved,
    SUM(CASE WHEN comments_show = 1 AND comments_approved = 1 THEN 1 ELSE 0 END) AS allTimeCommentsManual,
    SUM(CASE WHEN comments_show = 1 AND comments_approved = 5 THEN 1 ELSE 0 END) AS allTimeCommentsAutoApprovedBasedOnPreviousRep,
    SUM(CASE WHEN comments_approved IN (4,6) THEN 1 ELSE 0 END) AS allTimeCommentsManualReject
  FROM comments
")[0];

$PAGEDATA = array_merge($PAGEDATA, $stats);

$PAGEDATA['allTimeCommentsApprovedPercentage'] =
    ($PAGEDATA['allTimeCommentsApproved'] / $PAGEDATA['allTimeComments']) * 100;

$PAGEDATA['allTimeCommentsManualPercentage'] =
    ($PAGEDATA['allTimeCommentsManual'] / $PAGEDATA['allTimeComments']) * 100;

$PAGEDATA['allTimeCommentersBanned'] = $DBLIB->rawQueryValue("
  SELECT COUNT(DISTINCT comments_authorEmail)
  FROM comments
  WHERE comments_approved = 4
");

$PAGEDATA['allTimeYourModerated'] = $DBLIB->rawQueryValue("
  SELECT COUNT(*)
  FROM comments
  WHERE comments_approved_userid = ?
", [$AUTH->data['users_userid']]);

echo $TWIG->render('commentsManager.twig', $PAGEDATA);
