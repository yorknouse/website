<?php
global $DBLIB, $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!isset($_GET['editionid'])) finish(false, ["code" => "PARAM", "message"=> "Not set"]);

if (isset($_POST['articleid'])) {
    $DBLIB->where("articles.articles_id IN (" . $bCMS->sanitizeString($_POST['articleid']) . ")");
} else {
    $term = $bCMS->sanitizeString($_POST['term']);
    if (strlen($term) > 0) $DBLIB->where("(articlesDrafts.articlesDrafts_headline LIKE '%" . $bCMS->sanitizeString($term) . "%')");
}
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInAdmin", 1);
$DBLIB->where("editions_id", $_GET['editionid']);
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$articles = $DBLIB->get("articles", 15, ["articles.articles_id", "articlesDrafts.articlesDrafts_headline"]);
if (!$articles) finish(true, null, null);

finish(true, null, $articles);
