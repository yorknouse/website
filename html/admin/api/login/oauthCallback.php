<?php
require_once __DIR__ . '/../apiHead.php';

var_dump($GLOBALS['AUTH']->oauthCallback($_GET['code']));
?>