<?php
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$AUTH->permissionCheck(10)) die("Sorry - you can't access this page");
if (!(isset($_GET['userid']))) die("No uid passed");

if ($AUTH->generateToken($bCMS->sanitizeString($_GET['userid']), false, $AUTH->data['users_userid'])) header('Location: '. $CONFIG['ROOTURL']);
