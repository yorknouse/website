<?php

use Twig\Environment;
use Twig\Extension\DebugExtension;
use Twig\Loader\FilesystemLoader;
use Twig\TwigFilter;

require_once __DIR__ . '/../../common/coreHead.php';
require_once __DIR__ . '/authLib.php';
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

try {
    //session_set_cookie_params(0, '/', '.' . $_SERVER['SERVER_NAME']); //Fix for subdomain bug
    ini_set('session.gc_maxlifetime', 3600*8); //8 hours
    session_set_cookie_params(3600*8);
    session_start(); //Open up the session
} catch (Exception $e) {
    //Do Nothing
}

$PAGEDATA = array('CONFIG' => $CONFIG, 'BODY' => true);
//TWIG
//Twig_Autoloader::register();
$TWIGLOADER = new FilesystemLoader(__DIR__ . '/../');
if ($CONFIG['DEV']) {
    $TWIG = new Environment($TWIGLOADER, array(
        'debug' => true,
        'auto_reload' => true,
        'charset' => 'utf-8'
    ));
    $TWIG->addExtension(new DebugExtension());
} else {
    $TWIG = new Environment($TWIGLOADER, array(
        'debug' => false,
        'auto_reload' => false,
        'cache' =>sys_get_temp_dir().DIRECTORY_SEPARATOR.'admin'.DIRECTORY_SEPARATOR,
        'charset' => 'utf-8'
    ));
}
$TWIG->addFilter(new TwigFilter('timeago', function ($datetime) {
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
$TWIG->addFilter(new TwigFilter('formatsize', function ($var) {
    global $bCMS;
    return $bCMS->formatSize($var);
}));
$TWIG->addFilter(new TwigFilter('unclean', function ($var) {
    global $bCMS;
    return $bCMS->unCleanString($var);
}));
$TWIG->addFilter(new TwigFilter('permissions', function ($permissionid) {
    global $AUTH;
    if (!$AUTH->login) return false;
    else return $AUTH->permissionCheck($permissionid);
}));
$TWIG->addFilter(new TwigFilter('modifyGet', function ($array) {
    global $bCMS;
    return http_build_query(($bCMS->modifyGet($array)));
}));
$TWIG->addFilter(new TwigFilter('randomString', function ($characters) {
    global $bCMS;
    return $bCMS->randomString($characters);
}));
$TWIG->addFilter(new TwigFilter('s3URL', function ($fileid, $size = false) {
    global $bCMS;
    return $bCMS->s3URL($fileid, $size);
}));
$TWIG->addFilter(new TwigFilter('s3DATA', function ($fileid) {
    global $bCMS;
    return $bCMS->s3URL($fileid, null, false, '+1 minute', true);
}));
$TWIG->addFilter(new TwigFilter('articleThumbnail', function ($article,$size = false, $overrideImageDisplay = false) {
    global $bCMS;
    return $bCMS->articleThumbnail($article,$size,$overrideImageDisplay);
}));
$TWIG->addFilter(new TwigFilter('md5', function ($string) {
    return md5($string);
}));
$GLOBALS['AUTH'] = new bID;