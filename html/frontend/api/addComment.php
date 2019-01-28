<?php
require_once __DIR__ . '/apiHead.php';
//Log an article as having been read
if (!isset($_POST['articleid'])) finish(false, ["code" => "PARAM", "message"=> "No article id set"]);
elseif (!isset($_POST['text'])) finish(false, ["code" => "PARAM", "message"=> "No text set"]);
elseif (!isset($_POST['recaptcha'])) finish(false, ["code" => "PARAM", "message"=> "No capatcah entered"]);

$recaptcha = new \ReCaptcha\ReCaptcha($CONFIG['RECAPTCHA']['SECRET']);
$resp = $recaptcha->verify($_POST['recaptcha'], isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"]);
if ($resp->isSuccess()) {
    $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
    $article = $DBLIB->getone("articles", ["articles_id","articles_authors","articles_published","articles_slug"]);
    if ($article) {
        if ($DBLIB->insert("comments",
            ["articles_id" => $article['articles_id'],
                "comments_created" => date('Y-m-d G:i:s'),
                "comments_authorName" => $bCMS->sanitizeString((isset($_POST['name']) ? $_POST['name'] : null)),
                "comments_authorEmail" => $bCMS->sanitizeString((isset($_POST['email']) ? $_POST['email'] : null)),
                "comments_text" => $bCMS->cleanString($_POST['text']),
                "comments_nestUnder"=> ($bCMS->sanitizeString((isset($_POST['commentid']) ? $_POST['commentid'] : null)) == "" ? null : $bCMS->sanitizeString($_POST['commentid'])),
                "comments_recaptcha" => 1,
            ])) {

            //Send an email notification
            $article['articles_authors_array'] = explode(",", $article['articles_authors']);
            if (count($article['articles_authors_array']) > 0) {
                //$DBLIB->where("(users_userid IN (" . $article['articles_authors'] . "))");
                //$DBLIB->where("(users_googleAppsUsernameYork IS NOT NULL OR users_googleAppsUsernameNouse IS NOT NULL OR users_archive_email IS NOT NULL)");
                //$DBLIB->get("users", null, ["users_googleAppsUsernameYork", "users_googleAppsUsernameNouse", "users_archive_email","users_name1", "users_name2"]);
                //foreach ($article['articles_authors'] as $author) {
                foreach ($article['articles_authors_array'] as $author) {
                    $html = "<b>Name: </b>" . (isset($_POST['name']) ? $_POST['name'] : "<i>Posted anonymously</i>") . "<br/>";
                    $html .= "<b>Text: </b>" . $bCMS->cleanString($_POST['text']) . "<br/>";
                    $html .= "<b>Article Link: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/". $article['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/". $article['articles_slug'] . "</a>";
                    $html .= "<br/><br/><br/>If you have any concerns about this comment please contact web@nouse.co.uk.<br/><br/>Nouse Technical Team<br/><i>Server " . gethostname() . " (sent at  " . date("Y-m-d H:i:s") . " UTC)</i>";
                    sendemail($author, "New comment added to your article on Nouse.co.uk", $html);
                }
            }

            $bCMS->cacheClear($_SERVER['HTTP_REFERER']);
            finish(true);
        } else finish(false, ["code" => "DB", "message"=> "Could not insert"]);
    } else finish(false, ["code" => "DB", "message"=> "Could not find article"]);
} else {
    finish(false, ["code" => "CAPATCA", "message"=> $resp->getErrorCodes()]);
}

