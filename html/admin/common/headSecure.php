<?php
global $CONFIG;
require_once __DIR__ . '/head.php';
require_once __DIR__ . '/authLib.php';

if (!$GLOBALS['AUTH']->login) {
    $_SESSION['return'] = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header("Location: " . $CONFIG['ROOTBACKENDURL'] . "/login/index.php");
    die('<meta http-equiv="refresh" content="0; url="' . $CONFIG['ROOTBACKENDURL'] . "/login/index.php" . '" />');
}

$PAGEDATA['USERDATA'] = $GLOBALS['AUTH']->data;

$USERDATA = $PAGEDATA['USERDATA'];

