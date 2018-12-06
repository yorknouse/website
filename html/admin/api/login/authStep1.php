<?php
require_once 'loginAjaxHead.php';

if (isset($_POST['formInput'])) {
	$input = trim(strtolower($GLOBALS['bCMS']->sanitizeString($_POST['formInput'])));

	if ($input == "") finish(false, ["code" => null, "message" => "No data specified"]);
	else {
        if (filter_var($input, FILTER_VALIDATE_EMAIL)) $DBLIB->where ("users_email", $input);
        else $DBLIB->where ("users_username", $input);
        $user = $DBLIB->getOne("users",["users.users_emailVerified", "users.users_userid"]);
        if (!$user) finish(false, ["code" => null, "message" => "No user found with associated email address or username"]);
        elseif ($user['users_emailVerified'] != 1) finish(false, ["code" => "VERIFYEMAIL", "message" => "Please verify your email address using the link we sent you to login","userid" => $user['users_userid']]);
        else finish(true, false, ["user" => true, "token" => false, "data" => $user]);
    }
} else finish(false, ["code" => null, "message" => "Unknown error"]);
?>