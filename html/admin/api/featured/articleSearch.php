<?php
global $bCMS, $DBLIB;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!isset($_POST['term'])) finish(false, ["code" => "PARAM", "message"=> "No term set"]);
$term = $bCMS->sanitiseString($_POST['term']);
if (strlen($term) > 0)
    $DBLIB->where("(articlesDrafts.articlesDrafts_headline LIKE '%" . $bCMS->sanitiseString($term) . "%')");

if (isset($_POST['categoryid']))
    $DBLIB->where("articles.articles_id IN (SELECT articles_id FROM articlesCategories WHERE categories_id = " . $_POST['categoryid'] . ")");

$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$articles = $DBLIB->get("articles", 15, ["articles.articles_id", "articlesDrafts.articlesDrafts_headline"]);
if (!$articles) finish(true, null, null);

finish(true, null, $articles);
