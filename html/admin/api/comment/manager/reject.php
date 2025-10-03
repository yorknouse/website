<?php
global $AUTH, $DBLIB;
require_once __DIR__ . '/../../apiHeadSecure.php';

if (!$AUTH->permissionCheck(54) or !isset($_POST['commentid'])) finish(false, ["code" => null, "message" => "Auth fail"]);

$DBLIB->where("comments_id", $_POST['commentid']);
$update = $DBLIB->update("comments", ["comments_approved" => 6,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s")],1);
if (!$update) finish(false, ["code" => null, "message" => "Could not update comment"]);

finish(true);