<?php
require_once __DIR__ . '/../../common/coreHead.php';

$CONFIG['ASSETSURL'] = $CONFIG['ROOTFRONTENDURL'] . "/common/assets/theme/osru/assets/";

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
$TWIG->addFilter(new Twig_SimpleFilter('modifyGet', function ($array) {
    global $bCMS;
    return http_build_query(($bCMS->modifyGet($array)));
}));
$TWIG->addFilter(new Twig_SimpleFilter('randomString', function ($characters) {
    global $bCMS;
    return $bCMS->randomString($characters);
}));
$TWIG->addFilter(new Twig_SimpleFilter('s3URL', function ($fileid, $size = false) {
    global $bCMS;
    return $bCMS->s3URL($fileid, $size);
}));
$TWIG->addFilter(new Twig_SimpleFilter('articleThumbnail', function ($article) {
    global $bCMS;
    return $bCMS->articleThumbnail($article);
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
    $PAGEDATA['CATEGORIES'][] = $category;
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
    else return $CONFIG['FILESTOREURL'] . "/archive/public/articleImages/body/" . date("Y/m", strtotime($thumb['users_created'])) . "/" . $thumb["users_thumbnail"];
}