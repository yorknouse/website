<?php
require_once __DIR__ . '/head.php';
require_once __DIR__ . '/../../common/libs/Auth/main.php';

if (!$GLOBALS['AUTH']->login) {
    die("AUTH FAIL");

    $_SESSION['return'] = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header("Location: /");
    die('<meta http-equiv="refresh" content="0; url="' . '/' . '" />');
}

$PAGEDATA['USERDATA'] = $GLOBALS['AUTH']->data;

$PAGEDATA['USERDATA']["ICON"] = "https://www.gravatar.com/avatar/" . md5(strtolower(trim($PAGEDATA['USERDATA']["users_email"]))) . "?s=90&r=g&d=" . urlencode("");
?>
