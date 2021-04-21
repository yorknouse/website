<?php
require_once __DIR__ . '/apiHead.php';
//Don't cache to make the browser count each impression
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$DBLIB->where("adverts_deleted",0);
$DBLIB->where("adverts_enabled",1);
$DBLIB->where("adverts_start",date('Y-m-d G:i:s'),"<=");
$DBLIB->where("adverts_end",date('Y-m-d G:i:s'),">=");
$DBLIB->where("adverts_start",NULL,"IS NOT");
$DBLIB->where("adverts_end",NULL,"IS NOT");
$DBLIB->where("adverts_bannerImage",NULL,"IS NOT");
$DBLIB->where("adverts_link",NULL,"IS NOT");
$advert = $DBLIB->getOne("adverts",["adverts_id","adverts_bannerImage","adverts_bannerImageMob","adverts_link"]);
if (!$advert) {
    $DBLIB->where("adverts_deleted",0);
    $DBLIB->where("adverts_enabled",1);
    $DBLIB->where("adverts_default",1);
    $DBLIB->where("adverts_bannerImage",NULL,"IS NOT");
    $DBLIB->where("adverts_link",NULL,"IS NOT");
    $advert = $DBLIB->getOne("adverts",["adverts_id","adverts_bannerImage","adverts_bannerImageMob","adverts_link"]);
}
if (!$advert) die("Error 404 - ad unit not found"); //We can't find any advertising at all :(

if (isset($_GET['link'])) {
    $DBLIB->where("adverts_id",$advert["adverts_id"]);
    $update = $DBLIB->update("adverts",["adverts_clicks"=>$DBLIB->inc(1)],1);
    if (!$update) die("Sorry we encountered a database error processing this request");
    header('Location: ' . $advert['adverts_link'], true, 302);
    die();
} else if (isset($_GET['image'])) {
    $DBLIB->where("adverts_id",$advert["adverts_id"]);
    $update = $DBLIB->update("adverts",["adverts_impressions"=>$DBLIB->inc(1)],1);
    if (!$update) die("Sorry we encountered a database error processing this request");
    $file = $bCMS->s3URL(((isset($_GET['mob']) and $advert['adverts_bannerImageMob'] != null) ? $advert['adverts_bannerImageMob'] : $advert['adverts_bannerImage']), (isset($_GET['mob']) ? "small" : "medium"), false, null,true);
    if (!$file) die("Sorry we encountered a database error serving the image for this request");
    else {
        header('Location: ' . $file['url'], true, 302);
        die();
    }
}