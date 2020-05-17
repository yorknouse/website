<?php
require_once __DIR__ . '/../../apiHeadSecure.php';

if (!$AUTH->permissionCheck(54) or !isset($_POST['commentid'])) finish(false, ["code" => null, "message" => "Auth fail"]);


$DBLIB->where("comments_id", $_POST['commentid']);
$comment = $DBLIB->getone("comments", ["comments_id", "articles_id","comments_text",'comments_authorName']);
if (!$comment) finish(false, ["code" => null, "message" => "Comment not found"]);

$DBLIB->where("comments_id", $comment['comments_id']);
$update = $DBLIB->update("comments", ["comments_approved" => 1,"comments_approved_userid"=>$AUTH->data['users_userid'],"comments_approved_timestamp"=>date("Y-m-d H:i:s")],1);
if (!$update) finish(false, ["code" => null, "message" => "Could not update comment"]);

$DBLIB->where("articles_id", $comment['articles_id']);
$article = $DBLIB->getone("articles", ["articles_id","articles_authors","articles_published","articles_slug"]);
//Send an email notification
$article['articles_authors_array'] = explode(",", $article['articles_authors']);
if (count($article['articles_authors_array']) > 0) {
    foreach ($article['articles_authors_array'] as $author) {
        $html = "<b>Name: </b>" . $comment['comments_authorName'] . "<br/>";
        $html .= "<b>Text: </b>" . $bCMS->cleanString($comment['comments_text']) . "<br/>";
        $html .= "<b>Article Link: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "</a>";
        $html .= "<br/><br/><br/>If you have any concerns about this comment please contact web@nouse.co.uk.<br/><br/>Nouse Technical Team<br/><i>Server " . gethostname() . " (sent at  " . date("Y-m-d H:i:s") . " UTC)</i>";
        sendemail($author, "New comment added to your article on Nouse.co.uk", $html);
    }
}
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug']);
finish(true);