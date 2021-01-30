<?php
require_once __DIR__ . '/common/head.php';


function displayEdition($edition, $preview = false) {
    global $PAGEDATA, $DBLIB,$TWIG,$bCMS;
    $PAGEDATA['edition'] = $edition;
    $PAGEDATA['pageConfig']['TITLE'] = $PAGEDATA['edition']['editions_name'] . ($PAGEDATA['edition']['editions_printNumber'] != null ? ' | Edition &numero;' . $PAGEDATA['edition']['editions_printNumber'] : '') . " | Nouse";
    $PAGEDATA['pageConfig']['EDITIONTheme'] = true;


    $PAGEDATA['edition']['editions_featuredHighlights'] = json_decode($PAGEDATA['edition']['editions_featuredHighlights'],true);
    $articlesFeatured = []; //Keep track of articles already displayed once
    if (isset($PAGEDATA['edition']['editions_featuredHighlights']['sections'])) {
        foreach ($PAGEDATA['edition']['editions_featuredHighlights']['sections'] as $sectionKey => $section) {
            foreach ($section['articles'] as $articleKey => $article) {
                $articlesFeatured[] = $article;
                $DBLIB->where("articles.articles_id", $article);
                if (!$preview) $DBLIB->where("articles_showInLists", 1);
                $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
                $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
                $article = $DBLIB->getone("articles", ["articles.articles_categories", "articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
                if ($article) {
                    if ($article['articles_categories']) {
                        $DBLIB->where("(categories_id IN (" . $article['articles_categories'] . "))");
                        $article["CATEGORIES"] = $DBLIB->get("categories", 1, ["categories_displayName","categories_id","categories_backgroundColor","categories_backgroundColorContrast"]);
                    } else $article["CATEGORIES"] = [];
                    $PAGEDATA['edition']['editions_featuredHighlights']['sections'][$sectionKey]['articles'][$articleKey] = $article;
                } else $PAGEDATA['edition']['editions_featuredHighlights']['sections'][$sectionKey]['articles'][$articleKey] = false;
            }
        }
    }

    $categoriesWorker = $PAGEDATA['CATEGORIES'];
    //Download all articles for edition
    $PAGEDATA['CATEGORIESARTICLES'] =[];
    $PAGEDATA['articlesIDs'] = [];
    foreach ($categoriesWorker as $category) {
        $category['articles'] = [];
        $DBLIB->where("FIND_IN_SET('" . $category['categories_id'] . "',articles_categories)");
        $DBLIB->orderBy("articles.articles_editionPage", "ASC");
        $DBLIB->orderBy("articles.articles_published", "DESC");
        $DBLIB->orderBy("articles.articles_slug", "ASC");
        $DBLIB->where("editions_id", $PAGEDATA['edition']['editions_id']);
        if (!$preview) $DBLIB->where("articles_showInLists", 1);
        if (!$preview) $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $articles = $DBLIB->get("articles", null, ["articles.*", "articlesDrafts.articlesDrafts_headline", "articlesDrafts.articlesDrafts_excerpt"]);

        foreach ($articles as $article) {
            if (in_array($article['articles_id'], $articlesFeatured)) continue; //Skip articles that we have already shown as featured
            elseif (in_array($article['articles_id'], $PAGEDATA['articlesIDs'])) continue; //Don't add it twice if it's already been added for another category
            $article['articles_categories'] = explode(",", $article['articles_categories']);
            if ($article['articles_authors'] != null) {
                $authors = explode(",", $article['articles_authors']);
                $article['articles_authors'] = [];
                foreach ($authors as $author) {
                    if (strlen($author) < 1) continue;
                    $DBLIB->where("users_userid", $author);
                    $DBLIB->where("users_deleted", 0);
                    $article['articles_authors'][] = $DBLIB->getone("users", ["users.users_name1", "users.users_name2", "users.users_userid"]);
                }
            } else $article['articles_authors'] = false;
            array_push($PAGEDATA['articlesIDs'],$article['articles_id']);
            $category['articles'][] = $article;
        }
        $PAGEDATA['CATEGORIESARTICLES'][] = $category;
    }

    http_response_code(200);
    echo $TWIG->render('edition.twig', $PAGEDATA);
    exit;
}
function displayPost($post, $preview = false)
{
    global $PAGEDATA, $DBLIB,$TWIG,$bCMS;
    $PAGEDATA['POST'] = $post;

    $PAGEDATA['pageConfig'] = ["TITLE" => $PAGEDATA['POST']['articlesDrafts_headline']];

    if (strlen($PAGEDATA["POST"]['articles_categories']) > 0) {
        $DBLIB->where("categories_id IN (" . $PAGEDATA["POST"]['articles_categories'] . ")");
        $DBLIB->orderBy("categories_order", "ASC");
        if (!$preview) $DBLIB->where("categories_showPublic",1);
        $PAGEDATA['POST']['CATEGORIES'] = $DBLIB->get('categories', null, ["categories_id","categories_nestUnder","categories_displayName","categories_backgroundColorContrast","categories_backgroundColor","categories_customTheme", "categories_socialMediaOverlay"]);
    } else $PAGEDATA['POST']['CATEGORIES'] = [];

    $PAGEDATA['POST']['SOCIAL-OVERLAY'] = false;
    foreach ($PAGEDATA['POST']['CATEGORIES'] as $category) {
        if ($category['categories_socialMediaOverlay'] != null) {
            $PAGEDATA['POST']['SOCIAL-OVERLAY'] = $category['categories_socialMediaOverlay'];
            break;
        }
    }
    if (!$PAGEDATA['POST']['articles_thumbnail']) $PAGEDATA['POST']['SOCIAL-OVERLAY'] = false;


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
    $DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
    $DBLIB->orderBy("comments_created", "ASC");
    $DBLIB->where("comments_nestUnder IS NULL");
    $comments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
    $PAGEDATA['POST']['COMMENTCOUNT'] = count($comments);
    $PAGEDATA['POST']['COMMENTS'] = [];
    foreach ($comments as $comment) {
        $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
        $DBLIB->where("comments_show",1);
        $DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
        $DBLIB->where("comments_nestUnder", $comment['comments_id']);
        $DBLIB->orderby("comments_created","ASC");
        $subcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
        $PAGEDATA['POST']['COMMENTCOUNT'] += count($subcomments);
        $comment['SUB'] = [];
        foreach ($subcomments as $subcomment) {
            $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
            $DBLIB->where("comments_show",1);
            $DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
            $DBLIB->where("comments_nestUnder", $subcomment['comments_id']);
            $DBLIB->orderby("comments_created","ASC");
            $subsubcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
            $PAGEDATA['POST']['COMMENTCOUNT'] += count($subsubcomments);
            $subcomment['SUB'] = [];
            foreach ($subsubcomments as $subsubcomment) {
                $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                $DBLIB->where("comments_show",1);
                $DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
                $DBLIB->where("comments_nestUnder", $subsubcomment['comments_id']);
                $subsubsubcomments = $DBLIB->get("comments", null, ["comments_authorName", "comments_authorURL", "comments_created", "comments_text","comments_upvotes","comments_downvotes","comments_id"]);
                $PAGEDATA['POST']['COMMENTCOUNT'] += count($subsubsubcomments);
                $subsubcomment['SUB'] = [];
                foreach ($subsubsubcomments as $subsubsubcomment) {
                    $DBLIB->where("articles_id",$PAGEDATA['POST']['articles_id']);
                    $DBLIB->where("comments_show",1);
                    $DBLIB->where("(comments_approved = 1 OR comments_approved = 2 OR comments_approved = 3 OR comments_approved = 5)");
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

    if (count($PAGEDATA['POST']['CATEGORIES']) > 0) {
        $PAGEDATA['pageConfig']['leftBar']['LATEST'] = latestInCategory($PAGEDATA['POST']['CATEGORIES'][0]['categories_id'], 4);
    }
    foreach ($PAGEDATA['POST']['CATEGORIES'] as $category) {
        if ($category['categories_customTheme'] != null) {
            $PAGEDATA['pageConfig']["CustomTheme"] = $category['categories_customTheme'];
        } elseif ($category['categories_displayName'] == "Muse") {
            $PAGEDATA['pageConfig']["MUSETheme"] = true;
            $PAGEDATA['pageConfig']['MENUSub'] = 4; //We're on MUSE so show their special menu
        }
        if ($category['categories_backgroundColor'] != null) {
            $PAGEDATA['pageConfig']['MENUColor']['backgroundColor'] = $category['categories_backgroundColor'];
            $PAGEDATA['pageConfig']['MENUColor']['backgroundColorContrast'] = $category['categories_backgroundColorContrast'];
        }
    }

    if ($PAGEDATA['POST']['articles_type'] == 2) {
        $PAGEDATA['POST']['galleryImages'] = [];
        if (strlen($PAGEDATA["POST"]['articlesDrafts_text']) > 0) {
            foreach (explode(",", $PAGEDATA["POST"]['articlesDrafts_text']) as $image) {
                $PAGEDATA['POST']['galleryImages'][] = $bCMS->s3URL($image, "large", false, null, true);
            }
        }
    }

    http_response_code(200);
    echo $TWIG->render('post.twig', $PAGEDATA);
    exit;
}

$URL = substr(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), 1);
//Manually build get because .htaccess 404 handler kills it
$_GET = [];
foreach (explode("&", parse_url($_SERVER["REQUEST_URI"], PHP_URL_QUERY)) as $param) {
    if (strlen($param) > 0) {
        $param = explode("=", $param);
        $_GET[$param[0]] = (isset($param[1]) ? $param[1] : true);
    }
}

//Quick links redirect system
$DBLIB->where("quickLinks_string",strtolower($bCMS->sanitizeString(rtrim($URL,"/"))));
$DBLIB->where("quickLinks_deleted", 0);
$quickLink = $DBLIB->getone("quickLinks",["quickLinks_pointsTo"]);
if ($quickLink) {
    try {
        header('Location: ' . $quickLink["quickLinks_pointsTo"], true, 301);
        exit;
    } catch (Exception $e) {
        die('<meta http-equiv="refresh" content="0;url=' . $quickLink["quickLinks_pointsTo"] . '" />');
    }
}

if (isset($_GET['preview']) and isset($_GET['key'])) {
    if (isset($_GET['edition'])) {
        $DBLIB->where("editions.editions_id", $_GET['edition']); //ie those that can actually be shown
        $DBLIB->where("editions.editions_deleted", 0); //ie those that can actually be shown
        $edition = $DBLIB->getone("editions");
        if (md5($edition['editions_id']) == $_GET['key']) {
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Cache-Control: post-check=0, pre-check=0", false);
            header("Pragma: no-cache");
            displayEdition($edition,true);
        }
    } elseif (isset($_GET['post'])) {
        $DBLIB->where("articles.articles_id", $_GET['post']);
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $post = $DBLIB->getone("articles");
        if (md5($post['articles_id']) == $_GET['key']) {
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Cache-Control: post-check=0, pre-check=0", false);
            header("Pragma: no-cache");
            displayPost($post,true);
        }
    }
}


$urlSplit = explode("/", $URL);
if ($urlSplit[0] == "edition") {
    //This is an edition page

    $DBLIB->where("editions.editions_slug", $urlSplit[1]); //ie those that can actually be shown
    $DBLIB->where("editions.editions_deleted", 0); //ie those that can actually be shown
    $DBLIB->where("editions.editions_show",1);
    $DBLIB->where("editions.editions_published <= '" . date("Y-m-d H:i:s") . "'");
    $edition = $DBLIB->getone("editions");
    if (!$edition) render404Error();
    displayEdition($edition);
} elseif (is_numeric(substr($URL,0,1))) {
    //The first character of URL is a number - this is therefore a post

    if (count($urlSplit) < 4) render404Error(); //There aren't enough parts of the URL
    elseif (!is_numeric($urlSplit[0]) or !is_numeric($urlSplit[1]) or !is_numeric($urlSplit[2])) render404Error(); //The first bits aren't the date

    $DBLIB->where("DATE(articles_published) = '" . $bCMS->sanitizeString($urlSplit[0]) . "-". $bCMS->sanitizeString($urlSplit[1]) . "-" . $bCMS->sanitizeString($urlSplit[2]) . "'");
    $DBLIB->where("articles_slug", $bCMS->sanitizeString($urlSplit[3]));
    $DBLIB->where("articles_showInSearch", 1);
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $post = $DBLIB->getone("articles");
    if (!$post) {
        //A matching post can't be found so see if one exists but with a different date
        $DBLIB->where("articles_slug", $bCMS->sanitizeString($urlSplit[3]));
        $DBLIB->where("articles_showInSearch", 1);
        $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
        $retryPostSearch = $DBLIB->getone("articles", ["articles_published", "articles_slug"]);
        if (!$retryPostSearch) render404Error();
        else {
            //We found an article that it probably is - let's redirect to it to try and be helpful
            try {
                header('Location: ' . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($retryPostSearch["articles_published"])) . "/" . $retryPostSearch['articles_slug']);
                exit;
            } catch (Exception $e) {
                die('<meta http-equiv="refresh" content="0;url=' . ($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($retryPostSearch["articles_published"])) . "/" . $retryPostSearch['articles_slug']) . '" />');
            }
        }
    }
    displayPost($post);
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

    if ($PAGEDATA['pageConfig']['CATEGORY']['categories_customTheme'] != null) {
        $PAGEDATA['pageConfig']["CustomTheme"] = $category['categories_customTheme'];
    } elseif ($PAGEDATA['pageConfig']['CATEGORY']['categories_displayName'] == "Muse") {
        $PAGEDATA['pageConfig']["MUSETheme"] = true;
        $PAGEDATA['pageConfig']['MENUSub'] = 4; //We're on MUSE so show their special menu
    }
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

    if ($page < 1) $page = 1;
    
    $DBLIB->pageLimit = (isset($_GET['rss']) ? 60 : 10); //articles per page
    $articles = $DBLIB->arraybuilder()->paginate("articles", $page, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt","articlesDrafts.articlesDrafts_text"]);
    $PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages, "count" => $DBLIB->totalCount];
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

    //Get a list of featured articles for the masonry at the top
    if (strlen($thisCategory['categories_featured']) > 0) {
        $PAGEDATA['FEATUREDARTICLES'] = [];
        foreach (explode(",",$thisCategory['categories_featured']) as $article) { //Has to be done like this otherwise it won't come out in the correct order
            if (!$article) continue;
            $DBLIB->where("articles.articles_id", $article);
            $DBLIB->where("articles_showInLists", 1);
            $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
            $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
            $PAGEDATA['FEATUREDARTICLES'][] = $DBLIB->getone("articles", ["articles.articles_id","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
        }
    } else  $PAGEDATA['FEATUREDARTICLES'] =null;


    $PAGEDATA['pageConfig']['leftBar']['LATEST'] = latestInCategory($PAGEDATA['pageConfig']['CATEGORY']['categories_id'], 5);

    $PAGEDATA['pageConfig']['TITLE'] = $thisCategory['categories_displayName'] . " | Nouse";

    http_response_code(200);
    if (isset($_GET['rss'])) {
        header('Content-Type: text/xml');
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        echo $TWIG->render('feeds/category.twig', $PAGEDATA);
    }
    else echo $TWIG->render('category.twig', $PAGEDATA);
    exit;
}
?>
