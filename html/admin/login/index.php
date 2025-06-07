<?php
require_once __DIR__ . '/../common/head.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Login", "LOGOUT" => false];

if (isset($_SESSION['return'])) {
	$PAGEDATA['return'] = $_SESSION['return'];
} else $PAGEDATA['return'] ="/";

if (isset($_GET['logout'])) {
    $PAGEDATA['LOGOUT'] = true;
	$GLOBALS['AUTH']->logout();
}
echo $TWIG->render('login/login.twig', $PAGEDATA);
