<?php
global $AUTH, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$AUTH->data['viewSiteAs']) die("404");

if ($AUTH->generateToken($AUTH->data['viewSiteAs']['users_userid'], false))
    header('Location: '. $CONFIG->ROOTBACKENDURL);
exit;