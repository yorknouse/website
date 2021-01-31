<?php
require_once __DIR__ . '/../apiHead.php';
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
/*
 * AUTOMATED CRON JOBS
 */
$output = "[INFO] Starting auto cron script \n";
//          SOCIAL MEDIA POSTING
$DBLIB->where("articles.articles_showInSearch", 1); //ie those that can actually be shown - no point tweeting a dud link
$DBLIB->where("articles.articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->where("(articles_socialConfig = '1,0,1,0' OR articles_socialConfig = '1,1,1,0' OR articles_socialConfig = '1,0,1,1'
OR articles_socialConfig = '1,0,0,0' OR articles_socialConfig = '1,0,0,1' OR articles_socialConfig = '0,0,1,0' OR articles_socialConfig = '0,1,1,0')");
$articles = $DBLIB->get("articles", null, ["articles_id", "articles_socialConfig"]);
if (count($articles) > 0) {
    $output .= "[INFO] Posting " . count($articles) . " articles to social media \n";
    foreach ($articles as $article) {
        $article["articles_socialConfig"] = explode(",", $article["articles_socialConfig"]);

        if ($article["articles_socialConfig"]['2'] == 1 and $article["articles_socialConfig"]['3'] != 1) {
            $bCMS->postSocial($article['articles_id'], false, true); //Post to twitter
        }
        if ($article["articles_socialConfig"]['0'] == 1 and $article["articles_socialConfig"]['1'] != 1) {
            $bCMS->postSocial($article['articles_id'], true, false); //Post to facebook
        }
    }
} else $output .= "[INFO] No articles to post to social media \n";
//          NOTIFY YUSU
$DBLIB->where("articles.articles_showInSearch", 1); //ie those that can actually be shown - no point tweeting a dud link
$DBLIB->where("articles.articles_published <= '" . date("Y-m-d H:i:s") . "'");
$DBLIB->where("articles_mediaCharterDone",0);
$articles = $DBLIB->get("articles", null, ["articles_id"]);
if (count($articles) > 0) {
    $output .= "[INFO] Telling YUSU about " . count($articles) . " articles \n";
    foreach ($articles as $article) {
        $bCMS->yusuNotify($article['articles_id']); //This article has been posted historically so we need to email YUSU
    }
} else $output .= "[INFO] No articles to tell YUSU about \n";

$output .= "[INFO] Script finished \n";