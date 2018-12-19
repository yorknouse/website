<?php
require_once __DIR__ . '/../common/head.php';


$PAGEDATA['pageConfig'] = ["TITLE" => "Search results for " . $_GET['q'] . " | Nouse", "FEATURED" => false];
$term = $bCMS->sanitizeString($_GET['q']);
$DBLIB->where("(articlesDrafts.articlesDrafts_excerpt LIKE '%" . $term . "%' OR articlesDrafts.articlesDrafts_headline LIKE '%" . $term . "%' OR articlesDrafts.articlesDrafts_text LIKE '%" . $term . "%')");
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInSearch", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$articles = $DBLIB->get("articles", 20, ["articles.articles_thumbnail", "articles.articles_authors", "articles.articles_id", "articles.articles_published","articles.articles_slug","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
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

$PAGEDATA['searchTerm'] = $_GET['q'];
echo $TWIG->render('search.twig', $PAGEDATA);
?>
