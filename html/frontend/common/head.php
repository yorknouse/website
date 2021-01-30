<?php
require_once __DIR__ . '/../../common/coreHead.php';
header("Cache-Control:public, max-age=900, s-maxage=3600, stale-while-revalidate=900, stale-if-error=3600");


$CONFIG['ASSETSURL'] = $CONFIG['ROOTFRONTENDURL'] . "/common/assets/theme/osru/assets/";

$PAGEDATA = array('CONFIG' => $CONFIG, 'BODY' => true, 'URL' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]");


//TWIG
//Twig_Autoloader::register();
$TWIGLOADER = new \Twig\Loader\FilesystemLoader(__DIR__ . '/../templates/');

if ($CONFIG['DEV']) {
    $TWIG = new \Twig\Environment($TWIGLOADER, array(
        'debug' => true,
        'auto_reload' => true,
        'charset' => 'utf-8'
    ));
    $TWIG->addExtension(new \Twig\Extension\DebugExtension());
} else {
    $TWIG = new \Twig\Environment($TWIGLOADER, array(
        'debug' => false,
        'auto_reload' => false,
        'cache' =>'/tmp/frontend/',
        'charset' => 'utf-8'
    ));
}
$TWIG->addFilter(new \Twig\TwigFilter('timeago', function ($datetime) {
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
$TWIG->addFilter(new \Twig\TwigFilter('formatsize', function ($var) {
    global $bCMS;
    return $bCMS->formatSize($var);
}));
$TWIG->addFilter(new \Twig\TwigFilter('unclean', function ($var) {
    global $bCMS;
    return $bCMS->unCleanString($var);
}));
$TWIG->addFilter(new \Twig\TwigFilter('getCategoryURL', function ($categoryid) {
    //Get the link to the category page
    global $bCMS;
    return $bCMS->categoryURL($categoryid);
}));
$TWIG->addFilter(new \Twig\TwigFilter('modifyGet', function ($array) {
    global $bCMS;
    return http_build_query(($bCMS->modifyGet($array)));
}));
$TWIG->addFilter(new \Twig\TwigFilter('randomString', function ($characters) {
    global $bCMS;
    return $bCMS->randomString($characters);
}));
$TWIG->addFilter(new \Twig\TwigFilter('s3URL', function ($fileid, $size = false) {
    global $bCMS;
    return $bCMS->s3URL($fileid, $size);
}));
$TWIG->addFilter(new \Twig\TwigFilter('s3DATA', function ($fileid) {
    global $bCMS;
    return $bCMS->s3URL($fileid, null, false, '+1 minute', true);
}));
$TWIG->addFilter(new \Twig\TwigFilter('articleThumbnail', function ($article, $size = "large",$socialOverlay='') {
    global $bCMS, $CONFIG;
    if ($socialOverlay != '') return $CONFIG['ROOTFRONTENDURL'] . '/image/socialProcessor.php?url=' .urlencode($bCMS->articleThumbnail($article, $size)) . '&overlay=' . urlencode($CONFIG['FILESTOREURL'] . '/nouseSiteAssets/socialOverlays/' . $socialOverlay . '.png');
    else return $bCMS->articleThumbnail($article, $size);
}));


//Begin Nouse Head
function render404Error() {
    global $PAGEDATA, $TWIG;
    if (!$PAGEDATA) $PAGEDATA = [];
    http_response_code(404);
    die($TWIG->render('404.twig', $PAGEDATA));
}

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
    $PAGEDATA['CATEGORIES'][$category["categories_id"]] = $category;
}
//                SEARCH
$PAGEDATA['totalArticlesCountForSearch'] = $DBLIB->getValue("articles", "COUNT(*)");

function latestInCategory($categoryid, $count = 5) {
    global $DBLIB;
    $DBLIB->where("FIND_IN_SET('" . $categoryid . "',articles_categories)");
    $DBLIB->orderBy("articles_published", "DESC");
    $DBLIB->where("articles_showInLists", 1);
    $DBLIB->where("articles_published <= '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    return $DBLIB->get("articles", $count, ["articles.*","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
}
function similarArticles($articleid, $count = 5) {
    global $DBLIB, $bCMS;
    $DBLIB->where("articles.articles_id", $bCMS->sanitizeString($articleid));
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    $article = $DBLIB->getone("articles",["articles.articles_categories","articlesDrafts.articlesDrafts_headline"]);

    $DBLIB->where("articles.articles_categories", $article["articles_categories"]); //Grab them from the same category
    $DBLIB->where("articles.articles_showInLists", 1);
    $DBLIB->where("articles.articles_id != '" . $bCMS->sanitizeString($articleid) . "'");
    //$DBLIB->where("articlesDrafts.articlesDrafts_text LIKE '%" . $bCMS->sanitizeString($article['articlesDrafts_headline']) . "%'"); //Ideally where the title is a bit simliar maybe?
    $DBLIB->where("articles.articles_published <= '" . date("Y-m-d H:i:s") . "'");
    $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
    $DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
    return $DBLIB->get("articles", $count, ["articles.articles_id","articles.articles_slug","articles.articles_published", "articles.articles_thumbnail","articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
}
function userPositions($userid) {
    global $DBLIB,$bCMS;
    $DBLIB->where("userPositions.users_userid", $bCMS->sanitizeString($userid));
    $DBLIB->orderBy("userPositions.userPositions_start", "DESC");
    $DBLIB->orderBy("positions.positions_rank", "ASC");
    $DBLIB->where("userPositions.userPositions_show",1);
    $DBLIB->join("positions", "userPositions.positions_id=positions.positions_id", "LEFT");
    return $DBLIB->get("userPositions",null, ["positions.positions_displayName","userPositions.userPositions_start","userPositions.userPositions_end","userPositions.userPositions_displayName",]);
}
function userImage($userid) {
    global $DBLIB,$bCMS,$CONFIG;
    $DBLIB->where("users_userid", $bCMS->sanitizeString($userid));
    $thumb = $DBLIB->getone("users",["users_thumbnail", "users_created"]);
    if (!$thumb or $thumb["users_thumbnail"] == null) return false;
    if (is_numeric($thumb["users_thumbnail"])) return $bCMS->s3URL($thumb["users_thumbnail"], "small");
    else return $CONFIG['ARCHIVEFILESTOREURL'] . "/articleImages/body/" . date("Y/m", strtotime($thumb['users_created'])) . "/" . $thumb["users_thumbnail"];
}