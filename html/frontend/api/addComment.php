<?php
require_once __DIR__ . '/apiHead.php';
//Log an article as having been read
if (!isset($_POST['articleid'])) finish(false, ["code" => "PARAM", "message"=> "No article id set"]);
elseif (!isset($_POST['text'])) finish(false, ["code" => "PARAM", "message"=> "No text set"]);
elseif (!isset($_POST['recaptcha'])) finish(false, ["code" => "PARAM", "message"=> "No capatcah entered"]);
elseif (!isset($_POST['token'])) finish(false, ["code" => "PARAM", "message"=> "Please login to Google"]);

$recaptcha = new \ReCaptcha\ReCaptcha($CONFIG['RECAPTCHA']['SECRET']);
$resp = $recaptcha->verify($_POST['recaptcha'], isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"]);
if ($resp->isSuccess()) {
    $client = new Google_Client(['client_id' => $CONFIG['GOOGLE']['AUTH']['CLIENT']]);
    $payload = $client->verifyIdToken($_POST['token']); //verifies the JWT signature, the aud claim, the exp claim, and the iss claim.
    if ($payload and $payload["email_verified"] == true) {
        $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
        $article = $DBLIB->getone("articles", ["articles_id","articles_authors","articles_published","articles_slug"]);
        if ($article) {
            $DBLIB->where("comments_authorEmail", $payload['email']);
            $DBLIB->where("comments_approved", 4); //A 4 means that the comment was rejected AND the google account is blocked
            $bannedAccount = $DBLIB->getValue("comments", "COUNT(*)");

            $DBLIB->where("comments_authorEmail", $payload['email']);
            $DBLIB->where("comments_approved", 1); //A 4 means that the comment was rejected AND the google account is blocked
            $approvedAccount = $DBLIB->getValue("comments", "COUNT(*)");

            $approvalStatus = 0;
            if ($bannedAccount > 0) $approvalStatus = 4;
            elseif ($payload['hd'] == 'york.ac.uk') $approvalStatus = 2; //Auto trust york.ac.uk
            elseif ($approvedAccount > 0) $approvalStatus = 5; //If they've had a post approved before, then let's auto approve it as they're probably to be trusted

            if ($DBLIB->insert("comments", [
                    "articles_id" => $article['articles_id'],
                    "comments_created" => date('Y-m-d G:i:s'),
                    "comments_authorName" => $payload['name'],
                    "comments_authorEmail" => $payload['email'],
                    "comments_approved" => $approvalStatus, //Auto approve all york.ac.uk comments
                    "comments_text" => $bCMS->cleanString($_POST['text']),
                    "comments_nestUnder" => ($bCMS->sanitizeString((isset($_POST['commentid']) ? $_POST['commentid'] : null)) == "" ? null : $bCMS->sanitizeString($_POST['commentid'])),
                    "comments_recaptcha" => 1,
                    "comments_recaptchaScore" => $resp->getScore(),
                    "comments_authorIP" => (isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"])
                ])) {

                if ($approvalStatus == 2 or $approvalStatus = 5) {
                    //Send an email notification
                    $article['articles_authors_array'] = explode(",", $article['articles_authors']);
                    if (count($article['articles_authors_array']) > 0) {
                        foreach ($article['articles_authors_array'] as $author) {
                            $html = "<b>Name: </b>" . $payload['name'] . "<br/>";
                            $html .= "<b>Text: </b>" . $bCMS->cleanString($_POST['text']) . "<br/>";
                            $html .= "<b>Article Link: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "</a>";
                            $html .= "<br/><br/><br/>If you have any concerns about this comment please contact web@nouse.co.uk.<br/><br/>Nouse Technical Team<br/><i>Server " . gethostname() . " (sent at  " . date("Y-m-d H:i:s") . " UTC)</i>";
                            sendemail($author, "New comment added to your article on Nouse.co.uk", $html);
                        }
                    }
                    $bCMS->cacheClear($_SERVER['HTTP_REFERER']);
                    finish(true, null, ["message" => "Comment posted"]);
                } else finish(true, null, ["message" => "Comment is pending approval"]);
            } else finish(false, ["code" => "DB", "message" => "Could not insert"]);
        }
    } else finish(false, ["code" => "DB", "message"=> "Could not find article"]);
} else {
    finish(false, ["code" => "CAPATCA", "message"=> $resp->getErrorCodes()]);
}

