<?php
require_once __DIR__ . '/../common/head.php';


$PAGEDATA['pageConfig'] = ["TITLE" => null, "FEATURED" => false];

$DBLIB->where("users_userid", $bCMS->sanitizeString($_GET['a']));
$DBLIB->where("users_deleted", 0);
$PAGEDATA['pageConfig']['USER'] = $DBLIB->getone("users",[
    "users_name1", "users_name2",
    "users_bio",
    "users_social_facebook",
    "users_social_instagram",
    "users_social_twitter",
    "users_social_snapchat",
    "users_userid"
]);
if (!$PAGEDATA['pageConfig']['USER']) render404Error();
$PAGEDATA['pageConfig']['TITLE'] = $PAGEDATA['pageConfig']['USER']['users_name1'] . " " . $PAGEDATA['pageConfig']['USER']['users_name2'] . " | Nouse";

$DBLIB->where("FIND_IN_SET('" . $PAGEDATA['pageConfig']['USER']['users_userid'] . "',articles_authors)");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$PAGEDATA['pageConfig']['USER']['ARTICLECOUNT'] = $DBLIB->getValue("articles", "COUNT(*)");
if ($PAGEDATA['pageConfig']['USER']['ARTICLECOUNT'] < 1) render404Error();


$DBLIB->where("FIND_IN_SET('" . $PAGEDATA['pageConfig']['USER']['users_userid'] . "',articles_authors)");
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
else $page = 1;
$DBLIB->pageLimit = 10; //articles per page
$articles = $DBLIB->arraybuilder()->paginate("articles", $page, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_byline"]);
$PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages, "count" => $DBLIB->pageLimit*$DBLIB->totalPages];
$PAGEDATA['articles'] = [];
foreach ($articles as $article) {
    if ($article['articles_authors'] != null) {
        $authors = explode(",",$article['articles_authors']);
        $article['articles_authors'] = [];
        foreach ($authors as $author) {
            if (strlen($author) < 1) continue;
            $DBLIB->where("users_userid", $author);
            $DBLIB->where("users_deleted", 0);
            $article['articles_authors'][] = $DBLIB->getone("users", ["users.users_name1", "users.users_name2", "users.users_userid"]);
        }
    } else $article['articles_authors'] = false;
    $PAGEDATA['articles'][] = $article;
}


$DBLIB->where("FIND_IN_SET('" . $PAGEDATA['pageConfig']['USER']['users_userid'] . "',articles_authors)");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$PAGEDATA['pageConfig']['USER']['ARTICLECOUNT'] = $DBLIB->getValue("articles", "COUNT(*)");

$PAGEDATA['pageConfig']['USER']['POSITIONS'] = userPositions($PAGEDATA['pageConfig']['USER']['users_userid']);
$PAGEDATA['pageConfig']['USER']['IMAGE'] =  userImage($PAGEDATA['pageConfig']['USER']['users_userid']);

echo $TWIG->render('author.twig', $PAGEDATA);
?>
