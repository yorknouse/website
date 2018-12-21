<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

$articleData = [
    "articles_published" => date("Y-m-d H:i:s", strtotime($bCMS->sanitizeString($_POST['published']))),
    "articles_updated" => date("Y-m-d H:i:s"),
    "articles_type" => $bCMS->sanitizeString($_POST['type']),
    "articles_slug" => $bCMS->sanitizeString($_POST['slug']),
];

$articleData["articles_categories"] = [];
if ($_POST['categories'] != null) {
    foreach (explode(",", $bCMS->sanitizeString($_POST['categories'])) as $category) {
        if (is_numeric($category)) {
            $articleData["articles_categories"][] = $category;
        }
    }
}
$articleData["articles_categories"] = implode(",", $articleData["articles_categories"]);

$articleData["articles_authors"] = [];
if ($_POST['authors'] != null) {
    foreach (explode(",", $bCMS->sanitizeString($_POST['authors'])) as $category) {
        if (is_numeric($category)) {
            $articleData["articles_authors"][] = $category;
        }
    }
}
$articleData["articles_authors"] = implode(",", $articleData["articles_authors"]);


if ($_POST['thumbnail'] != null) {
    $articleData["articles_thumbnail"] = $bCMS->sanitizeString($_POST['thumbnail']);
}

if ($_POST['status'] == 1) {
    $articleData["articles_showInLists"] = 0;
    $articleData["articles_showInSearch"] = 0;
    $articleData["articles_showInAdmin"] = 1;
} elseif ($_POST['status'] == 2) {
    $articleData["articles_showInLists"] = 0;
    $articleData["articles_showInSearch"] = 1;
    $articleData["articles_showInAdmin"] = 1;
} else {
    $articleData["articles_showInLists"] = 1;
    $articleData["articles_showInSearch"] = 1;
    $articleData["articles_showInAdmin"] = 1;
}
$articleDraftsData = [
    "articlesDrafts_timestamp" => date("Y-m-d H:i:s"),
    "articlesDrafts_userid" => $AUTH->data['users_userid'],
    "articlesDrafts_headline" => $bCMS->cleanString($_POST['headline']),
    "articlesDrafts_excerpt"=> $bCMS->cleanString($_POST['excerpt']),
    "articlesDrafts_text" => $bCMS->cleanString($_POST['text'])
];



if (isset($_POST['articleid']) and $AUTH->permissionCheck(32)) {

    //Edit an existing article

    $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
    $article = $DBLIB->getone("articles",["articles_socialConfig","articles_id",'articles_published',"articles_slug","articles_mediaCharterDone","articles_showInSearch"]);
    if (!$article) finish(false, ["code" => null, "message" => "No data specified"]);

    $bCMS->auditLog("EDIT", "articles", $article['articles_id'], $AUTH->data['users_userid']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug']);


    //Establish if this action by this user will make the article public - in which case YUSU need to be notified
    if ($article['articles_showInSearch'] != 1 and $article['articles_mediaCharterDone'] != 1 and $articleData["articles_showInSearch"] == 1) {
        //YUSU Notification email html
        $html = "You are receiving this email as a notification of a new article being uploaded to the Nouse.co.uk website in compliance with section 5.3 of the YUSU Media Charter.<br/><br/>";
        if (strtotime($articleData["articles_published"]) > time()) $html .= "This article will be published at " . $articleData["articles_published"] . " GMT and this email is an advanced notification of publication. No further notifications will follow and this article will be automatically published.<br/><br/>";
        $html .= "<b>Headline: </b>" . $bCMS->sanitizeString($_POST['headline']) . "<br/>";
        if (strtotime($articleData["articles_published"]) > time()) $html .= "This article hasn't been published yet, so it's not accessible on our website. A secret link has been generated for you to preview it, but please don't share this externally: <a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "?key=" . md5($article['articles_id']) . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "</a>";
        else $html .= "<b>Link to article: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "</a>";
        $html .= "<br/><br/><br/>If you have any questions about this notification please do not hesitate to contact us on support@nouse.co.uk.<br/>For queries relating to this article itself (for example concerns about its content) please contact editor@nouse.co.uk. <br/><br/><br/>Nouse Technical Team<br/><i>" . gethostname() . " (compliance tracked at  " . date("Y-m-d H:i:s") . " UTC)</i>";

        if (sendemail("media-charter-notifications@nouse.co.uk", "New article on Nouse.co.uk", $html)) $articleData['articles_mediaCharterDone'] = 1;
    }

    $socialMedia = explode(",", $article['articles_socialConfig']);
    if ($_POST['postToTwitter'] == 1 and $socialMedia['2'] != 1 and $socialMedia['3'] != 1) { //If it's not yet been posted to twitter but the checkbox has now been checked we should post it to twitter
        $socialMedia['2'] = 1; //Say that they've chosen to post to twitter - set this to 1 so we know that
    }
    if ($_POST['postToFacebook'] == 1 and $socialMedia['0'] != 1 and $socialMedia['1'] != 1) { //If it's not yet been posted to fb but the checkbox has now been checked we should post it to fb
        $socialMedia['0'] = 1; //Say that they've chosen to post to fb - set this to 1 so we know that
    }
    if ($_POST['postToTwitter'] == 0 and $socialMedia['2'] == 1 and $socialMedia['3'] != 1) { //They no longer want it to go on FB
        $socialMedia['2'] = 0;
    }
    if ($_POST['postToFacebook'] == 0 and $socialMedia['0'] == 1 and $socialMedia['1'] != 1) { //They no longer want it to go on FB
        $socialMedia['0'] = 0;
    }




    $articleData['articles_socialConfig'] = implode(",", $socialMedia); //Update the social media thing with whatever we've changed

    $articleDraftsData["articles_id"] = $article['articles_id'];
    $DBLIB->where("articles_id", $article['articles_id']);
    if (!$DBLIB->update("articles", $articleData)) finish(false, ["code" => null, "message" => "Update error"]);
    if ($DBLIB->insert("articlesDrafts", $articleDraftsData)) {

        //Social Media automation
        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['2'] == 1 and $socialMedia['3'] != 1) { //It's backdated so tweet now
            $bCMS->postSocial($article['articles_id'], false, true);
        }
        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['0'] == 1 and $socialMedia['1'] != 1) { //It's backdated so post now
            $bCMS->postSocial($article['articles_id'], true, false);
        }

        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['2'] == 1 and $socialMedia['3'] != 1 and $article['articles_showInSearch'] != 1 and $articleData["articles_showInSearch"] ==  1){
            //They've decided to make this article public when it wasn't before which means it needs to be posted on facebook/twitter
            $bCMS->postSocial($article['articles_id'], false, true);
        }
        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['0'] == 1 and $socialMedia['1'] != 1 and $article['articles_showInSearch'] != 1 and $articleData["articles_showInSearch"] ==  1){
            //They've decided to make this article public when it wasn't before which means it needs to be posted on facebook/twitter
            $bCMS->postSocial($article['articles_id'], true, false);
        }

        foreach (explode(",", $articleData['articles_categories']) as $category) {
            $bCMS->cacheClearCategory($category);
        }
        finish(true);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} elseif ($AUTH->permissionCheck(31)) {
    //Create a new article

    $socialMedia = [1,0,1,0]; //Default
    if ($_POST['postToTwitter'] != 1) { //They dont want it to go on FB
        $socialMedia['2'] = 0;
    } else {
        $socialMedia['2'] = 1; //Say that they've chosen to post to twitter - set this to 1 so we know that

    }

    if ($_POST['postToFacebook'] != 1) { //They dont want it to go on FB
        $socialMedia['0'] = 0;
    } else {
        $socialMedia['0'] = 1; //Say that they've chosen to post to fb - set this to 1 so we know that
    }
    $articleData['articles_socialConfig'] = implode(",", $socialMedia); //Update the social media thing with whatever we've changed



    $articleID = $DBLIB->insert("articles", $articleData);
    if (!$articleID) finish(false, ["code" => null, "message" => "Insert error"]);
    $articleDraftsData["articles_id"] = $articleID;
    if ($DBLIB->insert("articlesDrafts", $articleDraftsData)) {

        //Establish if this will make the public - in which case YUSU need to be notified
        //This version is different because the article has to be updated
        if ($articleData["articles_showInSearch"] == 1) {
            //YUSU Notification email html
            $html = "You are receiving this email as a notification of a new article being uploaded to the Nouse.co.uk website in compliance with section 5.3 of the YUSU Media Charter.<br/><br/>";
            if (strtotime($articleData["articles_published"]) > time()) $html .= "This article will be published at " . $articleData["articles_published"] . " GMT and this email is an advanced notification of publication. No further notifications will follow and this article will be automatically published.<br/><br/>";
            $html .= "<b>Headline: </b>" . $bCMS->sanitizeString($_POST['headline']) . "<br/>";
            if (strtotime($articleData["articles_published"]) > time()) $html .= "This article hasn't been published yet, so it's not accessible on our website. A secret link has been generated for you to preview it, but please don't share this externally: <a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "?key=" . md5($articleID) . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "</a>";
            else $html .= "<b>Link to article: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($articleData['articles_published'])) . "/". $articleData['articles_slug'] . "</a>";
            $html .= "<br/><br/><br/>If you have any questions about this notification please do not hesitate to contact us on support@nouse.co.uk.<br/>For queries relating to this article itself (for example concerns about its content) please contact editor@nouse.co.uk. <br/><br/><br/>Nouse Technical Team<br/><i>" . gethostname() . " (compliance tracked at  " . date("Y-m-d H:i:s") . " UTC)</i>";

            if (sendemail("media-charter-notifications@nouse.co.uk", "New article on Nouse.co.uk", $html)) {
                $DBLIB->where("articles_id", $articleID);
                $DBLIB->update("articles", ["articles_mediaCharterDone" => 1]);
            }
        }

        //Social Media automation
        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['2'] == 1) { //It's backdated so tweet now
            $bCMS->postSocial($articleID, false, true);
        }
        if (strtotime($articleData["articles_published"]) <= time() and $socialMedia['0'] == 1) { //It's backdated so post now
            $bCMS->postSocial($articleID, true, false);
        }

        //Audit log
        $bCMS->auditLog("CREATE", "articles", $articleID, $AUTH->data['users_userid']);

        //Caching
        foreach (explode(",", $articleData['articles_categories']) as $category) {
            $bCMS->cacheClearCategory($category);
        }
        finish(true, null, ["articleid" => $articleID]);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} else finish(false, ["code" => null, "message" => "No data specified"]);

?>