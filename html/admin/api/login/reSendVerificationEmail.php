<?php
require_once 'loginAjaxHead.php';

if (isset($_POST['userid'])) {
    if (verifyemail($GLOBALS['bCMS']->sanitizeString($_POST['userid'])))finish(true, null, true);
    else finish(true, null, false);
} else die("Sorry - page not found")
?>
