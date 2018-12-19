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
    "articlesDrafts_headline" => $bCMS->sanitizeString($_POST['headline']),
    "articlesDrafts_excerpt"=> $bCMS->sanitizeString($_POST['excerpt']),
    "articlesDrafts_text" => $bCMS->cleanString($_POST['text'])
];
if (isset($_POST['articleid']) and $AUTH->permissionCheck(32)) {

    //Edit an existing article

    $DBLIB->where("articles_id", $bCMS->sanitizeString($_POST['articleid']));
    $article = $DBLIB->getone("articles",["articles_id",'articles_published',"articles_slug"]);
    if (!$article) finish(false, ["code" => null, "message" => "No data specified"]);

    $bCMS->auditLog("EDIT", "articles", $article['articles_id'], $AUTH->data['users_userid']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug']);


    $articleDraftsData["articles_id"] = $article['articles_id'];
    $DBLIB->where("articles_id", $article['articles_id']);
    if (!$DBLIB->update("articles", $articleData)) finish(false, ["code" => null, "message" => "Update error"]);
    if ($DBLIB->insert("articlesDrafts", $articleDraftsData)) {
        foreach (explode(",", $articleData['articles_categories']) as $category) {
            $bCMS->cacheClearCategory($category);
        }
        finish(true);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} elseif ($AUTH->permissionCheck(31)) {

    //Create a new article

    $articleID = $DBLIB->insert("articles", $articleData);
    if (!$articleID) finish(false, ["code" => null, "message" => "Insert error"]);
    $articleDraftsData["articles_id"] = $articleID;
    if ($DBLIB->insert("articlesDrafts", $articleDraftsData)) {
        $bCMS->auditLog("CREATE", "articles", $articleID, $AUTH->data['users_userid']);
        foreach (explode(",", $articleData['articles_categories']) as $category) {
            $bCMS->cacheClearCategory($category);
        }
        finish(true, null, ["articleid" => $articleID]);
    } else finish(false, ["code" => null, "message" => "Insert draft error"]);
} else finish(false, ["code" => null, "message" => "No data specified"]);

?>