<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if ($AUTH->permissionCheck(47)) {
    if ($bCMS->cacheClear(false,true)) finish(true);
    else finish(false, ["code" => null, "message" => "Clear cache error"]);
} else finish(false, ["code" => null, "message" => "Auth error"]);

?>