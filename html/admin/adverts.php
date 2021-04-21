<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Adverts", "BREADCRUMB" => false];

if (!$AUTH->permissionCheck(58)) die("Sorry - you can't access this page");

if (isset($_GET['q'])) $PAGEDATA['search'] = $bCMS->sanitizeString($_GET['q']);
else $PAGEDATA['search'] = null;

if (isset($_GET['page'])) $page = $bCMS->sanitizeString($_GET['page']);
else $page = 1;
$DBLIB->pageLimit = 20;
if (strlen($PAGEDATA['search']) > 0) {
    //Search
    $DBLIB->where("(
		adverts_name LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
		OR adverts_notes LIKE '%" . $bCMS->sanitizeString($PAGEDATA['search']) . "%'
    )");
}
$DBLIB->orderBy("adverts_default","DESC"); //Get default as first in the list
$DBLIB->orderBy("adverts_start", "DESC");
$DBLIB->where("adverts_deleted", 0); //ie those that can actually be shown
$adverts = $DBLIB->arraybuilder()->paginate("adverts", $page, ["adverts.*"]);
$PAGEDATA['pagination'] = ["page" => $page, "total" => $DBLIB->totalPages];
$PAGEDATA['adverts'] = [];
foreach ($adverts as $advert) {
    if ($advert['adverts_start'] != null
        and $advert['adverts_end'] != null
        and strtotime($advert['adverts_start']) >= time()
        and strtotime($advert['adverts_end']) <= time()
        and $advert['adverts_enabled'] == 1) {
        $advert['CURRENT'] = true;
    } else $advert['CURRENT'] = false;

    $PAGEDATA['adverts'][] = $advert;
}

echo $TWIG->render('adverts.twig', $PAGEDATA);
?>
