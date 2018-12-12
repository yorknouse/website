<?php
require_once __DIR__ . '/common/head.php';

$URL = substr(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), 1);
function render404Error() {
    http_response_code(404);
    die("404");
}
if (is_numeric(substr($URL,0,1))) {
    //The first character of URL is a number - this is therefore a post

    $PAGEDATA['pageConfig'] = ["TITLE" => null];

    $PAGEDATA['POST'] = ["title" => "test", "url" => "https://nouse.co.uk"];
    http_response_code(200);
    echo $TWIG->render('post.twig', $PAGEDATA);
    exit;
} else {
    //This is a category page
    $PAGEDATA['pageConfig'] = ["TITLE" => null, "FEATURED" => false];

    $URL = explode("/", $URL);
    if (count($URL)<0) render404Error();
    foreach ($PAGEDATA['CATEGORIES'] as $category) {
        if ($URL[0] == $category['categories1_name']) {
            $PAGEDATA['pageConfig']['CATEGORY'] = $category;
            $categoryid = $category['categories1_id'];
            break;
        }
    }
    if (!isset($PAGEDATA['pageConfig']['CATEGORY'])) render404Error(); //We didn't find their category

    if (count($URL)>1) {
        foreach ($PAGEDATA['pageConfig']['CATEGORY']['SUB'] as $category) {
            if ($URL[1] == $category['categories2_name']) {
                $PAGEDATA['pageConfig']['SUBCATEGORY'] = $category;
                $categoryid = $category['categories2_id'];
                break;
            }
        }
    }
    if (count($URL)>2 && isset($PAGEDATA['pageConfig']['SUBCATEGORY'])) {
        foreach ($PAGEDATA['pageConfig']['SUBCATEGORY']['SUB'] as $category) {
            if ($URL[2] == $category['categories3_name']) {
                $PAGEDATA['pageConfig']['SUBSUBCATEGORY'] = $category;
                $categoryid = $category['categories3_id'];
                break;
            }
        }
    }

    $DBLIB->where("FIND_IN_SET('" . $categoryid . "',articles_categories)");
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
    http_response_code(200);
    echo $TWIG->render('category.twig', $PAGEDATA);
    exit;
}
?>
