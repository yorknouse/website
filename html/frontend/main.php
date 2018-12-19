<?php
require_once __DIR__ . '/common/head.php';
$URL = substr(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), 1);

//Manually build get because 404 kills it
$_GET = [];
foreach (explode("&", parse_url($_SERVER["REQUEST_URI"], PHP_URL_QUERY)) as $param) {
    if (strlen($param) > 0) {
        $param = explode("=", $param);
        $_GET[$param[0]] = (isset($param[1]) ? $param[1] : true);
    }
}

if (is_numeric(substr($URL,0,1))) {
    //The first character of URL is a number - this is therefore a post

    $urlSplit = explode("/", $URL);
    if (count($urlSplit) < 4) render404Error(); //There aren't enough parts of the URL
    elseif (!is_numeric($urlSplit[0]) or !is_numeric($urlSplit[1]) or !is_numeric($urlSplit[2])) render404Error(); //The first bits aren't the date

    $DBLIB->where("DATE(articles_published) = '" . $bCMS->sanitizeString($urlSplit[0]) . "-". $bCMS->sanitizeString($urlSplit[1]) . "-" . $bCMS->sanitizeString($urlSplit[2]) . "'");
    $DBLIB->where("articles_slug", $bCMS->sanitizeString($urlSplit[3]));
    $DBLIB->where("articles_showInSearch", 1);
    $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $PAGEDATA['POST'] = $DBLIB->getone("articles");
    if (!$PAGEDATA['POST']) render404Error();

    $PAGEDATA['pageConfig'] = ["TITLE" => $PAGEDATA['POST']['articlesDrafts_headline']];

    $DBLIB->where("categories_id IN (" . $PAGEDATA["POST"]['articles_categories'] . ")");
    $DBLIB->orderBy("categories_order", "ASC");
    $DBLIB->where("categories_showPublic",1);
    $PAGEDATA['POST']['CATEGORIES'] = $DBLIB->get('categories', null, ["categories_id","categories_displayName","categories_backgroundColorContrast","categories_backgroundColor"]);


    if ($PAGEDATA['POST']['articles_authors'] != null) {
        $authors = explode(",",$PAGEDATA['POST']['articles_authors']);
        $PAGEDATA['POST']['articles_authors'] = [];
        foreach ($authors as $author) {
            if (strlen($author) < 1) continue;
            $DBLIB->where("users_userid", $author);
            $DBLIB->where("users_deleted", 0);
            $author = $DBLIB->getone("users", [ "users_name1", "users_name2",
                "users_bio",
                "users_social_facebook",
                "users_social_instagram",
                "users_social_twitter",
                "users_social_snapchat",
                "users_userid"]);
            $author['POSITIONS'] = userPositions($author['users_userid']);
            $author['IMAGE'] =  userImage($author['users_userid']);

            $PAGEDATA['POST']['articles_authors'][] = $author;
        }
    } else $PAGEDATA['POST']['articles_authors'] = false;


    //      GET THE COMMENTS - UPTO 4 TIERS DEEP
    $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
    $DBLIB->where("comments_show",1);
    $DBLIB->orderBy("comments_created", "ASC");
    $DBLIB->where("comments_nestUnder IS NULL");
    $comments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
    $PAGEDATA['POST']['COMMENTCOUNT'] = count($comments);
    $PAGEDATA['POST']['COMMENTS'] = [];
    foreach ($comments as $comment) {
        $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
        $DBLIB->where("comments_show",1);
        $DBLIB->where("comments_nestUnder", $comment['comments_id']);
        $DBLIB->orderby("comments_created","ASC");
        $subcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
        $PAGEDATA['POST']['COMMENTCOUNT'] += count($subcomments);
        $comment['SUB'] = [];
        foreach ($subcomments as $subcomment) {
            $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
            $DBLIB->where("comments_show",1);
            $DBLIB->where("comments_nestUnder", $subcomment['comments_id']);
            $DBLIB->orderby("comments_created","ASC");
            $subsubcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
            $PAGEDATA['POST']['COMMENTCOUNT'] += count($subsubcomments);
            $subcomment['SUB'] = [];
            foreach ($subsubcomments as $subsubcomment) {
                $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                $DBLIB->where("comments_show",1);
                $DBLIB->where("comments_nestUnder", $subsubcomment['comments_id']);
                $subsubsubcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
                $PAGEDATA['POST']['COMMENTCOUNT'] += count($subsubsubcomments);
                $subsubcomment['SUB'] = [];
                foreach ($subsubsubcomments as $subsubsubcomment) {
                    $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                    $DBLIB->where("comments_show",1);
                    $DBLIB->where("comments_nestUnder", $subsubsubcomment['comments_id']);
                    $subsubsubcomment['SUB'] = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
                    $PAGEDATA['POST']['COMMENTCOUNT'] += count($subsubsubcomment['SUB']);
                    $subsubcomment['SUB'][] = $subsubsubcomment;
                }
                $subcomment['SUB'][] = $subsubcomment;
            }
            $comment['SUB'][] = $subcomment;
        }
        $PAGEDATA['POST']['COMMENTS'][] = $comment;
    }
    //          END COMMENTS

    $PAGEDATA['pageConfig']['leftBar']['LATEST'] = latestInCategory($PAGEDATA['POST']['CATEGORIES'][0]['categories_id'], 4);
    $PAGEDATA['pageConfig']['SIMILAR'] = similarArticles($PAGEDATA['POST']['articles_id'],3);

    foreach ($PAGEDATA['POST']['CATEGORIES'] as $category) {
        if ($category['categories_displayName'] == "Muse") $PAGEDATA['pageConfig']["MUSETheme"] = true;
        if ($category['categories_backgroundColor'] != null) {
            $PAGEDATA['pageConfig']['MENUColor']['backgroundColor'] = $category['categories_backgroundColor'];
            $PAGEDATA['pageConfig']['MENUColor']['backgroundColorContrast'] = $category['categories_backgroundColorContrast'];
}
    }
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

    if ($PAGEDATA['pageConfig']['CATEGORY']['categories_displayName'] == "Muse") $PAGEDATA['pageConfig']["MUSETheme"] = true;
    if ($PAGEDATA['pageConfig']['CATEGORY']['categories_backgroundColor'] != null) {
        $PAGEDATA['pageConfig']['MENUColor']['backgroundColor'] = $PAGEDATA['pageConfig']['CATEGORY']['categories_backgroundColor'];
        $PAGEDATA['pageConfig']['MENUColor']['backgroundColorContrast'] = $PAGEDATA['pageConfig']['CATEGORY']['categories_backgroundColorContrast'];
    }

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

    //This is duplicated on the authors page
    $DBLIB->where("FIND_IN_SET('" . $thisCategory['categories_id'] . "',articles_categories)");
    $DBLIB->orderBy("articles_published", "DESC");
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
    else $page = 1;
    $DBLIB->pageLimit = 10; //articles per page
    $articles = $DBLIB->arraybuilder()->paginate("articles", $page, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
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

    $PAGEDATA['pageConfig']['leftBar']['LATEST'] = latestInCategory($PAGEDATA['pageConfig']['CATEGORY']['categories_id'], 5);

    $PAGEDATA['pageConfig']['TITLE'] = $thisCategory['categories_displayName'] . " | Nouse";

    http_response_code(200);
    echo $TWIG->render('category.twig', $PAGEDATA);
    exit;
}
?>
