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





//Begin Nouse Head
//          MENU
//              CATEGORIES
$DBLIB->where("categories1_showPublic",1);
$DBLIB->orderBy("categories1_order", "ASC");
$DBLIB->orderBy("categories1_displayName", "ASC");
$PAGEDATA['CATEGORIES'] = [];
foreach ($DBLIB->get("categories1") as $category) {
    $DBLIB->orderBy("categories2_order", "ASC");
    $DBLIB->orderBy("categories2_displayName", "ASC");
    $DBLIB->where("categories2_showPublic",1);
    $DBLIB->where("categories2_nestUnder", $category["categories1_id"]);
    $category['SUB'] = [];
    foreach ($DBLIB->get("categories2") as $subcategory) {
        $DBLIB->where("categories3_showPublic",1);
        $DBLIB->orderBy("categories3_order", "ASC");
        $DBLIB->orderBy("categories3_displayName", "ASC");
        $DBLIB->where("categories3_nestUnder", $subcategory["categories2_id"]);
        $subcategory['SUB'] = $DBLIB->get("categories3");
        $category['SUB'][] = $subcategory;
    }
    $PAGEDATA['CATEGORIES'][] = $category;
}