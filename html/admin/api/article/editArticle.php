<?php
global $bCMS, $AUTH, $DBLIB, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

$articleData = [
    "articles_published" => date("Y-m-d H:i:s", strtotime($bCMS->sanitizeString($_POST['published']))),
    "articles_updated" => date("Y-m-d H:i:s"),
    "articles_socialExcerpt" => $bCMS->cleanString(trim($_POST['socialexcerpt'])),
    "articles_displayImages" => $_POST['displayImages'],
    "articles_isThumbnailPortrait" => $_POST['isThumbnailPortrait'],
    "articles_dropCapital" => $_POST['dropCap'],
];

if ($_POST['thumbnail'] != null) {
    $articleData["articles_thumbnail"] = $bCMS->sanitizeString($_POST['thumbnail']);
}

if (isset($_POST['edition'])) $articleData["editions_id"] = ($_POST['edition'] == null ? null : $_POST['edition']);
if (isset($_POST['pagenumber'])) $articleData["articles_editionPage"] = ($_POST['pagenumber'] == null ? null : trim($_POST['pagenumber']));

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
    "articlesDrafts_headline" => $bCMS->cleanString(trim($_POST['headline'])),
    "articlesDrafts_excerpt"=> $bCMS->cleanString(trim($_POST['excerpt'])),
    "articlesDrafts_text" => $bCMS->cleanString(trim($_POST['text']))
];

if (isset($_POST['markdown'])) $articleDraftsData['articlesDrafts_markdown'] = trim($_POST['markdown']);
if (isset($_POST['thumbCredit'])) $articleDraftsData['articlesDrafts_thumbnailCredit'] = $bCMS->cleanString(trim($_POST['thumbCredit']));

if ($bCMS->sanitizeString($_POST['type']) == "2") {
    //Gallery
    $imagesList = explode(",", $bCMS->cleanString($_POST['text']));
    $captionList = explode(",", $bCMS->cleanString($_POST['captions']));
    if (count($captionList) > 0) {
        foreach ($captionList as $key=>$image) {
            if ($image != null) {
                $DBLIB->where("s3files_id", $imagesList[$key]);
                $DBLIB->update("s3files", ["s3files_meta_caption" => $image]);
            }
        }
    }
}


if (isset($_POST['articleid']) and $AUTH->permissionCheck(32)) {

    //Edit an existing article

    $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
    $article = $DBLIB->getone("articles",["articles_socialConfig","articles_id",'articles_published',"articles_slug","articles_mediaCharterDone","articles_showInSearch"]);
    if (!$article) finish(false, ["code" => null, "message" => "No data specified"]);

    $bCMS->auditLog("EDIT", "articles", $article['articles_id'], $AUTH->data['users_userid']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug']);

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

        //Caching
        //Edition
        if ($articleData['editions_id']) {
            $DBLIB->where("editions_id", $articleData['editions_id']);
            $edition = $DBLIB->getOne("editions", ["editions_slug"]);
            if ($edition) $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/editions/" . $edition['editions_slug']);
        }
        //Categories
        $categories = explode(",", $_POST['categories']);
        $DBLIB->where("categories_id", $categories,"NOT IN");
        $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
        $DBLIB->delete("articlesCategories");
        foreach ($categories as $category) {
            $DBLIB->where("categories_id", $category);
            $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
            if ($DBLIB->getValue("articlesCategories", "COUNT(*)") == 0) {
                $articleCategory = [
                    "articles_id" => $bCMS->sanitizeString($_POST['articleid']),
                    "categories_id" => $category
                ];
                $DBLIB->insert("articlesCategories", $articleCategory);
            }
            $bCMS->cacheClearCategory($category);
        }
        //Authors
        $authors = explode(",", $bCMS->sanitizeString($_POST['authors']));
        $DBLIB->where("users_userid", $authors,"NOT IN");
        $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
        $DBLIB->delete("articlesAuthors");
        foreach ($authors as $author) {
            $DBLIB->where("users_userid", $author);
            $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
            if ($DBLIB->getValue("articlesAuthors", "COUNT(*)") == 0) {
                $articlesAuthor = [
                    "articles_id" => $bCMS->sanitizeString($_POST['articleid']),
                    "users_userid" => $author
                ];
                $DBLIB->insert("articlesAuthors", $articlesAuthor);
            }
        }
        finish(true);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} elseif ($AUTH->permissionCheck(31)) {
    //Create a new article
    $articleData["articles_slug"] = $bCMS->sanitizeString($_POST['slug']); //Only set the slug if it's a new article

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


    $articleData["articles_type"] = $bCMS->sanitizeString($_POST['type']);


    $articleID = $DBLIB->insert("articles", $articleData);
    if (!$articleID) finish(false, ["code" => null, "message" => "Insert error" . $DBLIB->getLastError()]);
    $articleDraftsData["articles_id"] = $articleID;
    if ($DBLIB->insert("articlesDrafts", $articleDraftsData)) {

        //Establish if this will make the public - in which case YUSU need to be notified
        //This version is different because the article has to be updated

        if (strtotime($articleData["articles_published"]) <= time() and $articleData["articles_showInSearch"] == 1) {
            $bCMS->yusuNotify($articleID); //This article has been posted historically so we need to email YUSU
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
        //Edition
        if ($articleData['editions_id']) {
            $DBLIB->where("editions_id", $articleData['editions_id']);
            $edition = $DBLIB->getOne("editions", ["editions_slug"]);
            if ($edition) $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/editions/" . $edition['editions_slug']);
        }
        //Categories
        foreach (explode(",", $_POST['categories']) as $category) {
            $articleCategory = [
                "articles_id" => $articleID,
                "categories_id" => $category
            ];
            $DBLIB->insert("articlesCategories", $articleCategory);
            $bCMS->cacheClearCategory($category);
        }
        //Authors
        foreach (explode(",", $bCMS->sanitizeString($_POST['authors'])) as $author) {
            $articlesAuthor = [
                "articles_id" => $articleID,
                "users_userid" => $author
            ];
            $DBLIB->insert("articlesAuthors", $articlesAuthor);
        }
        finish(true, null, ["articleid" => $articleID]);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} else finish(false, ["code" => null, "message" => "No data specified"]);
