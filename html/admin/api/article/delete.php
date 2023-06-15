<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/plain");

if (!$AUTH->permissionCheck(33) or !isset($_GET['articleid']) or !is_numeric($_GET['articleid'])) die("404");

$bCMS->auditLog("DELETE", "articles", $bCMS->sanitizeString($_GET['articleid']), $AUTH->data['users_userid']);

$DBLIB->where ('articles_id', $bCMS->sanitizeString($_GET['articleid']));
$article = $DBLIB->getOne("articles", ["articles_id", "articles_published", "articles_slug"]);

$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug']);
$DBLIB->where("articlesCategories.articles_id", $bCMS->sanitizeString($_GET['articleid']));
$article['articles_categories'] = array_column($DBLIB->get("articlesCategories"), 'categories_id');
foreach ($article['articles_categories'] as $category) {
    $bCMS->cacheClearCategory($category);
}

$DBLIB->where ('articles_id', $article['articles_id']);
if ($DBLIB->update ('articles', ["articles_showInAdmin" => 0, "articles_showInSearch" => 0, "articles_showInLists" => 0])) die('1');
else die('2');
