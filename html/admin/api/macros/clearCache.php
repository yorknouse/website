<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (isset($_GET['url']) and $AUTH->permissionCheck(47)) {
    if ($bCMS->cacheClear(urldecode($_GET['url']))) finish(true);
    else finish(false, ["code" => null, "message" => "Clear cache error"]);
} else finish(false, ["code" => null, "message" => "No data specified"]);

?>