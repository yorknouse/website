<?php
global $AUTH, $DBLIB;
require_once __DIR__ . '/../../apiHeadSecure.php';

if (!$AUTH->permissionCheck(54) or !isset($_POST['commentid'])) finish(false, ["code" => null, "message" => "Auth fail"]);

$DBLIB->where("comments_id", $_POST['commentid']);
$comment = $DBLIB->getone("comments", ["comments_id", "comments_text"]);
if (!$comment) finish(false, ["code" => null, "message" => "Comment not found"]);

$DBLIB->where("comments_id", $comment['comments_id']);
$update = $DBLIB->update("comments", ["comments_approved" => 6,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s")],1);
if (!$update) finish(false, ["code" => null, "message" => "Could not update comment"]);

$DBLIB->where("comments_show", 1);
$DBLIB->where("(comments_approved != 1)");
$DBLIB->where("(comments_id != " . $comment['comments_id'] . ")");
$DBLIB->where("comments_text", $comment['comments_text']);
$update2 = $DBLIB->update("comments", ["comments_approved" => 6,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s"),"comments_notes"=>"This comment text was mass banned because of comment "  . $_POST['commentid']]);
if (!$update2) finish(false, ["code" => null, "message" => "Could not block other comments that match text"]);

finish(true);