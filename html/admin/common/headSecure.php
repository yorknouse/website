<?php
require_once __DIR__ . '/head.php';
require_once __DIR__ . '/../common/authLib.php';

if (!$GLOBALS['AUTH']->login) {
    $_SESSION['return'] = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header("Location: " . $CONFIG['ROOTBACKENDURL'] . "/login/");
    die('<meta http-equiv="refresh" content="0; url="' . $CONFIG['ROOTBACKENDURL'] . "/login/" . '" />');
}

$PAGEDATA['USERDATA'] = $GLOBALS['AUTH']->data;

$USERDATA = $PAGEDATA['USERDATA'];
?>
