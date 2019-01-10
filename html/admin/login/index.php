<?php
require_once __DIR__ . '/../common/head.php';

if (isset($_SESSION['return'])) {
	$PAGEDATA['return'] = $_SESSION['return'];
} else $PAGEDATA['return'] ="/";

if (isset($_GET['logout'])) {
	$GLOBALS['AUTH']->logout();
	try {
		header('Location: ' . $CONFIG['ROOTFRONTENDURL']); exit; //Check for session url to redirect to
	} catch (Exception $e) {
		die('<meta http-equiv="refresh" content="0;url=' . $CONFIG['ROOTFRONTENDURL'] . '" />');
	}
} else {
	try {
		header('Location: ' . $GLOBALS['AUTH']->generateURL()); exit; //Check for session url to redirect to
	} catch (Exception $e) {
		die('<meta http-equiv="refresh" content="0;url=' . $GLOBALS['AUTH']->generateURL() . '" />');
	}
}
?>

