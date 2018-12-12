<?php
require_once __DIR__ . '/common/head.php';

$URL = substr(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), 1);
function render404Error() {
    http_response_code(404);
    die("404");
}
if (is_numeric(substr($URL,0,1))) {
    //The first character of URL is a number - this is therefore a post

    $urlSplit = explode("/", $URL);
    if (count($urlSplit) < 4) render404Error(); //There aren't enough parts of the URL
    elseif (!is_numeric($urlSplit[0]) or !is_numeric($urlSplit[1]) or !is_numeric($urlSplit[2])) render404Error(); //The first bits aren't the date

    $DBLIB->where("DATE(articles_published) = '" . $bCMS->sanitizeString($urlSplit[0]) . "-". $bCMS->sanitizeString($urlSplit[1]) . "-" . $bCMS->sanitizeString($urlSplit[2]) . "'");
    $DBLIB->where("articles_slug", $bCMS->sanitizeString($urlSplit[3]));
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $PAGEDATA['POST'] = $DBLIB->getone("articles");
    if (!$PAGEDATA['POST']) render404Error();

    $PAGEDATA['pageConfig'] = ["TITLE" => $PAGEDATA['POST']['articlesDrafts_headline']];

    $DBLIB->where("categories_id IN (" . $PAGEDATA["POST"]['articles_categories'] . ")");
    $DBLIB->orderBy("categories_order", "ASC");
    $DBLIB->where("categories_showPublic",1);
    $PAGEDATA['POST']['CATEGORIES'] = $DBLIB->get('categories', null, ["categories_id","categories_displayName"]);

    //      GET THE COMMENTS - UPTO 4 TIERS DEEP
    $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
    $DBLIB->where("comments_show",1);
    $DBLIB->orderBy("comments_created", "ASC");
    $DBLIB->where("comments_nestUnder IS NULL");
    $comments = $DBLIB->get("comments", null, ["comments.*"]);
    $PAGEDATA['POST']['COMMENTS'] = [];
    foreach ($comments as $comment) {
        $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
        $DBLIB->where("comments_show",1);
        $DBLIB->where("comments_nestUnder", $comment['comments_id']);
        $comment = $DBLIB->get("comments", null, ["comments.*"]);

        $comment['SUB'] = [];
        foreach ($comment['SUB'] as $subcomment) {
            $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
            $DBLIB->where("comments_show",1);
            $DBLIB->where("comments_nestUnder", $comment['comments_id']);
            $subcomment['SUB'] = $DBLIB->get("comments", null, ["comments.*"]);
            $subcomment['SUB'] = [];
            foreach ($subcomment['SUB'] as $subsubcomment) {
                $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                $DBLIB->where("comments_show",1);
                $DBLIB->where("comments_nestUnder", $subcomment['comments_id']);
                $subsubcomment['SUB'] = $DBLIB->get("comments", null, ["comments.*"]);
                $subsubcomment['SUB'] = [];
                foreach ($subcomment['SUB'] as $subsubsubcomment) {
                    $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                    $DBLIB->where("comments_show",1);
                    $DBLIB->where("comments_nestUnder", $subsubcomment['comments_id']);
                    $subsubsubcomment['SUB'] = $DBLIB->get("comments", null, ["comments.*"]);
                    $subsubcomment['SUB'][] = $subsubsubcomment;
                }
                $subcomment['SUB'][] = $subsubcomment;
            }
            $comment['SUB'][] = $subcomment;
        }
        $PAGEDATA['POST']['COMMENTS'] = $comment;
    }
    //          END COMMENTS

    http_response_code(200);
    echo $TWIG->render('post.twig', $PAGEDATA);
    exit;
} else {
    //This is a category page

    $PAGEDATA['pageConfig'] = ["TITLE" => null, "FEATURED" => false];
    $URL = explode("/", $URL);
    if (count($URL)<0) render404Error();
    foreach ($PAGEDATA['CATEGORIES'] as $category) {
        if ($URL[0] == $category['categories_name']) {
            $PAGEDATA['pageConfig']['CATEGORY'] = $category;
            $thisCategory = $category;
            break;
        }
    }
    if (!isset($PAGEDATA['pageConfig']['CATEGORY'])) render404Error(); //We didn't find their category

    if (count($URL)>1) {
        foreach ($PAGEDATA['pageConfig']['CATEGORY']['SUB'] as $category) {
            if (($URL[1] == $category['categories_name']) && ($category['categories_nestUnder'] == $PAGEDATA['pageConfig']['CATEGORY']['categories_id'])) {
                $PAGEDATA['pageConfig']['SUBCATEGORY'] = $category;
                $thisCategory = $category;
                break;
            }
        }
    }
    if (count($URL)>2 && isset($PAGEDATA['pageConfig']['SUBCATEGORY'])) {
        foreach ($PAGEDATA['pageConfig']['SUBCATEGORY']['SUB'] as $category) {
            if (($URL[2] == $category['categories_name']) && ($category['categories_nestUnder'] == $PAGEDATA['pageConfig']['SUBCATEGORY']['categories_id'])) {
                $PAGEDATA['pageConfig']['SUBSUBCATEGORY'] = $category;
                $thisCategory = $category;
                break;
            }
        }
    }

    $DBLIB->where("FIND_IN_SET('" . $thisCategory['categories_id'] . "',articles_categories)");
    $DBLIB->orderBy("articles_published", "DESC");
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $articles = $DBLIB->get("articles", 20, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_byline"]);
    $PAGEDATA['articles'] = [];
    foreach ($articles as $article) {
        if ($article['articles_authors'] != null) {
            $authors = explode(",",$article['articles_authors']);
            $article['articles_authors'] = [];
            foreach ($authors as $author) {
                if (strlen($author) < 1) continue;
                $DBLIB->where("users_userid", $author);
                $article['articles_authors'][] = $DBLIB->getone("users", ["users.users_name1", "users.users_name2", "users.users_userid"]);
            }
        } else $article['articles_authors'] = false;
        $PAGEDATA['articles'][] = $article;
    }

    $PAGEDATA['pageConfig']['leftBar']['LATEST'] = latestInCategory($PAGEDATA['pageConfig']['CATEGORY']['categories_id'], 5);

    $PAGEDATA['pageConfig']['TITLE'] = $thisCategory['categories_displayName'] . " | Nouse";

    http_response_code(200);
    echo $TWIG->render('category.twig', $PAGEDATA);
    exit;
}
?>
