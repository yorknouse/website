<?php
require_once __DIR__ . '/apiHead.php';

//Log an article as having been read
if (!isset($_POST['commentid'])) finish(false, ["code" => "PARAM", "message"=> "No comment set"]);
elseif (!isset($_POST['recaptcha'])) finish(false, ["code" => "PARAM", "message"=> "No capatcah entered"]);
elseif (!isset($_POST['type'])) finish(false, ["code" => "PARAM", "message"=> "No type entered"]);

$recaptcha = new \ReCaptcha\ReCaptcha($CONFIG['RECAPTCHA']['SECRET']);
$resp = $recaptcha->verify($_POST['recaptcha'], isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"]);
if ($resp->isSuccess()) {
    $DBLIB->where("comments_id", $bCMS->sanitizestring($_POST['commentid']));
    if ($_POST['type'] == "UP") $type = "comments_upvotes";
    else $type = "comments_downvotes";

    $DBLIB->rawQuery("UPDATE comments SET " . $type . " = " . $type . "+1 WHERE comments_id='". $bCMS->sanitizeString($_POST['commentid']) . "'");
    $bCMS->cacheClear($_SERVER['HTTP_REFERER']);
    finish(true);

} else {
    finish(false, ["code" => "CAPATCA", "message"=> $resp->getErrorCodes()]);
}