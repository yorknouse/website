<?php
require_once __DIR__ . '/../../common/coreHead.php';


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
$TWIGLOADER = new Twig_Loader_Filesystem(__DIR__ . '/../');
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
$TWIG->addFilter(new Twig_SimpleFilter('permissions', function ($permissionid) {
    global $AUTH;
    if (!$AUTH->login) return false;
    else return $AUTH->permissionCheck($permissionid);
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

//Content security policy - frontend has a different one so lookout for that
header("Content-Security-Policy: default-src 'none';" .
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.pubnub.com https://cdnjs.cloudflare.com https://platform.twitter.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.syndication.twimg.com https://connect.facebook.net https://www.google.com;".
    //          We have laods of inline JS              Live sockets         Libs                        Twitter embedd              Google webmaster tools                    Google analytics                  Twitter pictures for embedd   Facebook share           Recapatcha
    "style-src 'unsafe-inline' 'self' https://*.twimg.com https://platform.twitter.com https://cdnjs.cloudflare.com https://fonts.googleapis.com;".
    //          We have loads of inline CSS  Twitter pics                             Live chat supports             Libs                        GFonts
    "font-src https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com;".
    //          Loading in google fonts     more gfonts                 Fonts from libs like fontawesome
    "manifest-src 'self';".
    //          Show images on mobile devices like favicons
    "img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.digitaloceanspaces.com https://*.twitter.com https://*.twimg.com https://www.google-analytics.com https://www.googletagmanager.com https://i2.wp.com;".
    //                    Uploads    Images from libs                 Images                             Twitter embedd      More twitter          Google analytics                                                   User icons fallback
    "connect-src 'self' https://*.digitaloceanspaces.com https://*.pndsn.com https://sentry.io https://www.google-analytics.com;".
    //                  File uploads                    Pubnub sockets          Error reporting     Google analytics
    "frame-src https://*.twitter.com https://staticxx.facebook.com https://www.google.com;".
    //          Embedding twitter feed   Facebook feed              embedded maps
    "object-src 'self' blob:;".
    //          Inline PDFs generated by the system
    //"worker-src 'self' blob:;".
    //          Use of camera
    "report-uri https://bithell.report-uri.com/r/d/csp/enforce"); //Send to report-uri

$GLOBALS['AUTH'] = new bID;