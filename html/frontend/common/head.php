<?php
require_once __DIR__ . '/../../common/coreHead.php';

$CONFIG['ROOTURL'] = "http://dev.nouse.co.uk";
$CONFIG['ASSETSURL'] = $CONFIG['ROOTURL'] . "/common/assets/theme/osru/assets/";

$PAGEDATA = array('CONFIG' => $CONFIG, 'BODY' => true);


//TWIG
//Twig_Autoloader::register();
$TWIGLOADER = new Twig_Loader_Filesystem(__DIR__ . '/../templates/');
$TWIG = new Twig_Environment($TWIGLOADER, array(
    'debug' => true
));
$TWIG->addExtension(new Twig_Extension_Debug());
$TWIG->addFilter(new Twig_SimpleFilter('timeago', function ($datetime) {
    $time = time() - strtotime($datetime);
    $units = array (
        31536000 => 'year',
        2592000 => 'month',
        604800 => 'week',
        86400 => 'day',
        3600 => 'hour',
        60 => 'minute',
        1 => 'second'
    );
    foreach ($units as $unit => $val) {
        if ($time < $unit) continue;
        $numberOfUnits = floor($time / $unit);
        return ($val == 'second')? 'a few seconds ago' :
            (($numberOfUnits>1) ? $numberOfUnits : 'a')
            .' '.$val.(($numberOfUnits>1) ? 's' : '').' ago';
    }
}));
$TWIG->addFilter(new Twig_SimpleFilter('formatsize', function ($var) {
    global $bCMS;
    return $bCMS->formatSize($var);
}));
$TWIG->addFilter(new Twig_SimpleFilter('unclean', function ($var) {
    global $bCMS;
    return $bCMS->unCleanString($var);
}));
$TWIG->addFilter(new Twig_SimpleFilter('getCategoryURL', function ($categoryid) {
    //Get the link to the category page
    global $DBLIB, $bCMS;
    $DBLIB->where("categories_id", $bCMS->sanitizeString($categoryid));
    $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
    if ($category["categories_nestUnder"] == null) return $category["categories_name"];
    $url = $category["categories_name"];

    $DBLIB->where("categories_id", $category['categories_nestUnder']);
    $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
    if ($category["categories_nestUnder"] == null) return $category["categories_name"] . "/" . $url;
    $url = $category["categories_name"] . "/" . $url;

    $DBLIB->where("categories_id", $category['categories_nestUnder']);
    $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
    return $category["categories_name"] . "/" . $url;
}));

//Begin Nouse Head
//          MENU
//              CATEGORIES
$DBLIB->where("categories_showPublic",1);
$DBLIB->orderBy("categories_order", "ASC");
$DBLIB->orderBy("categories_displayName", "ASC");
$DBLIB->where("categories_nestUnder IS NULL");
$PAGEDATA['CATEGORIES'] = [];
foreach ($DBLIB->get("categories") as $category) {
    $DBLIB->where("categories_showPublic",1);
    $DBLIB->orderBy("categories_order", "ASC");
    $DBLIB->orderBy("categories_displayName", "ASC");
    $DBLIB->where("categories_nestUnder", $category["categories_id"]);
    $category['SUB'] = [];
    foreach ($DBLIB->get("categories") as $subcategory) {
        $DBLIB->where("categories_showPublic",1);
        $DBLIB->orderBy("categories_order", "ASC");
        $DBLIB->orderBy("categories_displayName", "ASC");
        $DBLIB->where("categories_nestUnder", $subcategory["categories_id"]);
        $subcategory['SUB'] = $DBLIB->get("categories");
        $category['SUB'][] = $subcategory;
    }
    $PAGEDATA['CATEGORIES'][] = $category;
}

function latestInCategory($categoryid, $count = 5) {
    global $DBLIB;
    $DBLIB->where("FIND_IN_SET('" . $categoryid . "',articles_categories)");
    $DBLIB->orderBy("articles_published", "DESC");
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    return $DBLIB->get("articles", $count, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_byline"]);
}