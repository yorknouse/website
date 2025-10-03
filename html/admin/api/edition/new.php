<?php
global $AUTH, $bCMS, $DBLIB;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(50) or !isset($_GET['title']) or (strlen($_GET['title']) < 1)) die("404");

$editionSlug = "";
function generateEditionSlug($slugDraft) {
    global $editionSlug,$DBLIB,$bCMS;
    $DBLIB->where('editions_slug', $slugDraft);
    if ($DBLIB->getValue("editions", "COUNT(*)") > 0) {
        //Taken so add a bit to the slug and try again
        generateEditionSlug($slugDraft . $bCMS->randomString(3));
        return false;
    }

    $editionSlug = $slugDraft;
}
generateEditionSlug(urlencode(strtolower(str_replace( " ", "-", $bCMS->cleanString($_GET['title']) ))));

$result = $DBLIB->insert("editions", [
    "editions_name" => $bCMS->cleanString($_GET['title']),
    "editions_deleted" => 0,
    "editions_showHome" => 1,
    "editions_show" => 0,
    "editions_type" => "Print Edition",
    "editions_published" => date("Y-m-d H:i:s"),
    "editions_slug" => $editionSlug,
]);
if (!$result) {
    echo $DBLIB->getLastError();
    finish(false, ["code" => null, "message" => "Insert error"]);
}

$bCMS->auditLog("INSERT", "editions", $result, $AUTH->data['users_userid']);
finish(true, null, ["id" => $result]);
