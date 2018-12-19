<?php
require_once __DIR__ . '/apiHead.php';
//Log an article as having been read
if (!isset($_POST['searchterm'])) finish(false, ["code" => "PARAM", "message"=> "No term set"]);
$term = $bCMS->sanitizeString($_POST['searchterm']);
if (strlen($term) <1) finish(true, null,null);

$DBLIB->where("(articlesDrafts.articlesDrafts_excerpt LIKE '%" . $term . "%' OR articlesDrafts.articlesDrafts_headline LIKE '%" . $term . "%')");
$DBLIB->orderBy("articles_published", "DESC");
$DBLIB->where("articles_showInSearch", 1);
$DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
$DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
$articles = $DBLIB->get("articles", 3, ["articles.articles_id", "articles.articles_published","articles.articles_slug","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
if (!$articles) finish(true, null, null);
$output = [];
foreach ($articles as $article) {
    $article['url'] = $CONFIG['ROOTFRONTENDURL'] . '/' . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'];
    $output[] = $article;
}
finish(true, null, $output);
