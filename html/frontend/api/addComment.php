<?php
require_once __DIR__ . '/apiHead.php';
//Log an article as having been read
if (!isset($_POST['articleid'])) finish(false, ["code" => "PARAM", "message"=> "No article id set"]);
elseif (!isset($_POST['text'])) finish(false, ["code" => "PARAM", "message"=> "No text set"]);
elseif (!isset($_POST['recaptcha'])) finish(false, ["code" => "PARAM", "message"=> "No capatcah entered"]);

$recaptcha = new \ReCaptcha\ReCaptcha($CONFIG['RECAPTCHA']['SECRET']);
$resp = $recaptcha->verify($_POST['recaptcha'], isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"]);
if ($resp->isSuccess()) {
    if ($DBLIB->insert("comments",
        ["articles_id" => $bCMS->sanitizeString($_POST['articleid']),
         "comments_created" => date('Y-m-d G:i:s'),
         "comments_authorName" => $bCMS->sanitizeString((isset($_POST['name']) ? $_POST['name'] : null)),
         "comments_authorEmail" => $bCMS->sanitizeString((isset($_POST['email']) ? $_POST['email'] : null)),
         "comments_text" => $bCMS->sanitizeString($_POST['text']),
         "comments_nestUnder"=> ($bCMS->sanitizeString((isset($_POST['commentid']) ? $_POST['commentid'] : null)) == "" ? null : $bCMS->sanitizeString($_POST['commentid'])),
         "comments_recaptcha" => 1,
         ])) {
            $bCMS->cacheClear($_SERVER['HTTP_REFERER']);
            finish(true);
        } else finish(false, ["code" => "DB", "message"=> "Could not insert"]);
} else {
    finish(false, ["code" => "CAPATCA", "message"=> $resp->getErrorCodes()]);
}

