<?php
global $AUTH, $DBLIB;
require_once __DIR__ . '/../../apiHeadSecure.php';

if (!$AUTH->permissionCheck(54)) finish(false, ["code" => null, "message" => "Auth fail"]);

$DBLIB->where('comments_approved', 0);
$DBLIB->orderBy("comments_created", "ASC");
$DBLIB->where("comments_show", 1);
$comment = $DBLIB->getone("comments", ["comments_id", "comments_authorName", "comments_text", "comments_recaptchaScore","comments_created"]);

$DBLIB->where('comments_approved', 0);
$DBLIB->where("comments_show", 1);
$commentCount = $DBLIB->getvalue("comments", "COUNT(*)");

finish(true, null, ["comment" => $comment, "remaining" => $commentCount]);
