<?php
global $AUTH, $bCMS, $DBLIB, $TWIG;
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Account Settings", "BREADCRUMB" => false];

if (isset($_GET['new']) and $AUTH->permissionCheck(4)) {
    $PAGEDATA['pageConfig']['TITLE'] = "Create a new user";
    $PAGEDATA['USER'] = ["users_userid" => "NEW"];
} else {
    if (!isset($_GET['uid']) or !$AUTH->permissionCheck(5)) $userid = $AUTH->data['users_userid'];
    else $userid = $bCMS->sanitizeString($_GET['uid']);

    $DBLIB->where("users_userid", $userid);
    $PAGEDATA['USER'] = $DBLIB->getone("users");

    // Decode HTML entities before sending to Twig
    $PAGEDATA['USER']['users_name1'] = html_entity_decode($PAGEDATA['USER']['users_name1'] ?? '', ENT_QUOTES);
    $PAGEDATA['USER']['users_name2'] = html_entity_decode($PAGEDATA['USER']['users_name2'] ?? '', ENT_QUOTES);

    $DBLIB->where("users_userid", $userid);
    $DBLIB->orderBy("userPositions_start", "ASC");
    $DBLIB->orderBy("userPositions_end", "ASC");
    $DBLIB->join("positions", "positions.positions_id=userPositions.positions_id", "LEFT");
    $PAGEDATA['USER']['POSITIONS'] = $DBLIB->get("userPositions");

    $DBLIB->where("users_userid", $userid);
    $DBLIB->where("userPositions_end >= '" . date('Y-m-d H:i:s') . "'");
    $DBLIB->where("userPositions_start <= '" . date('Y-m-d H:i:s') . "'");
    $PAGEDATA['USER']['currentPositions'] = $DBLIB->getvalue("userPositions","COUNT(*)"); //To see if they can login

    $DBLIB->orderBy("positions_rank", "ASC");
    $DBLIB->orderBy("positions_displayName", "ASC");
    $PAGEDATA['POSSIBLEPOSITIONS'] = $DBLIB->get("positions");

    //Featured articles
    if (strlen($PAGEDATA['USER']['articles_featured']) > 0) {
        $PAGEDATA['USER']['articles_featured'] = explode(",",$PAGEDATA['USER']['articles_featured']);
        $PAGEDATA['FEATUREDARTICLES'] = [];
        foreach ($PAGEDATA['USER']['articles_featured'] as $article) { //Has to be done like this otherwise it won't come out in the correct order
            if (!$article) continue;
            $DBLIB->where("articles.articles_id", $article);
            $DBLIB->where("articles_showInLists", 1);
            $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
            $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
            $article = $DBLIB->getone("articles", ["articles.articles_id","articlesDrafts.articlesDrafts_headline"]);
            $PAGEDATA['FEATUREDARTICLES'][] = $article;
        }
    } else {
        $PAGEDATA['FEATUREDARTICLES'] =null;
        $PAGEDATA['USER']['articles_featured'] = null;
    }

    $PAGEDATA['pageConfig']['TITLE'] = "Account Settings for " . $PAGEDATA['USER']['users_name1'] . " " . $PAGEDATA['USER']['users_name2'];
}

echo $TWIG->render('account.twig', $PAGEDATA);
