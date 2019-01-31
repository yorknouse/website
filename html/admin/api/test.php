<?php
require_once __DIR__ . '/apiHeadSecure.php';

$DBLIB->where("articles_archiveFallback IS NULL");
$DBLIB->where("articles_appleNewsID IS NULL");
$DBLIB->where("articles_extraMetadata IS NULL");
$DBLIB->where("articles_showInLists", 1);
$DBLIB->orderBy("articles_published", "ASC");
$articles = $DBLIB->get("articles");
var_dump($articles);
foreach ($articles as $article) {
    $bCMS->postToAppleNews($article['articles_id']);
}
?>
All done