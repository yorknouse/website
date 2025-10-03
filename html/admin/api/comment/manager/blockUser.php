<?php
global $AUTH, $DBLIB;
require_once __DIR__ . '/../../apiHeadSecure.php';

if (!$AUTH->permissionCheck(54) or !isset($_POST['commentid'])) finish(false, ["code" => null, "message" => "Auth fail"]);

$DBLIB->where("comments_id", $_POST['commentid']);
$comment = $DBLIB->getone("comments", ["comments_authorEmail","comments_id", "articles_id"]);
if (!$comment) finish(false, ["code" => null, "message" => "Comment not found"]);

$DBLIB->where("comments_id", $comment['comments_id']);
$update = $DBLIB->update("comments", ["comments_approved" => 4,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s")],1);
if (!$update) finish(false, ["code" => null, "message" => "Could not update comment"]);

if ($comment["comments_authorEmail"] != null) {
    $DBLIB->where("comments_authorEmail",$comment["comments_authorEmail"]);
    $DBLIB->where("comments_show", 1);
    $DBLIB->where("(comments_approved != 1)");
    $update2 = $DBLIB->update("comments", ["comments_approved" => 4,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s"),"comments_notes"=>"User was banned for comment "  . $comment['comments_id'] . " so this comment was unapproved retroactively"]);
    if (!$update2) finish(false, ["code" => null, "message" => "Could not revoke old comments"]);
}

finish(true);