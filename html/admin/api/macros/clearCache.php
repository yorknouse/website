<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!isset($_GET['url']) or !$AUTH->permissionCheck(47))
    finish(false, ["code" => null, "message" => "No data specified"]);

if (!$bCMS->cacheClear(urldecode($_GET['url'])))
    finish(false, ["code" => null, "message" => "Clear cache error"]);

finish(true);
