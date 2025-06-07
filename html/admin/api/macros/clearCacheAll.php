<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(47))
    finish(false, ["code" => null, "message" => "Auth error"]);

if (!$bCMS->cacheClear(false,true))
    finish(false, ["code" => null, "message" => "Clear cache error"]);

finish(true);
