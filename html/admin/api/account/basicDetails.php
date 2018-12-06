<?php
require_once __DIR__ . '/../apiHeadSecure.php';

header('Content-Type:text/plain');




	if (isset($_GET['username'])) {
        if ((strtolower($_GET['email']) != $USERDATA['users_email']) && $AUTH->emailTaken($bCMS->sanitizeString(strtolower($_GET['email'])))) die("Email taken");
    	elseif ((strtolower($_GET['username']) != $USERDATA['users_username']) && $AUTH->usernameTaken($bCMS->sanitizeString(strtolower($_GET['username'])))) die("Username taken");
        else {
            $data = Array (
                'users_email' => strtolower($bCMS->sanitizeString($_GET['email'])),
                'users_username' => strtolower($bCMS->sanitizeString($_GET['username']))
            );
            $data['users_name1'] = $bCMS->sanitizeString($_GET['forename']);
            $data['users_name2'] = $bCMS->sanitizeString($_GET['lastname']);
            $DBLIB->where('users_userid', $USERDATA['users_userid']);
            if ($DBLIB->update('users', $data)) {
                if (strtolower($_GET['email']) != $USERDATA['users_email']) {
                    $DBLIB->where ('users_userid', $USERDATA['users_userid']);
                    $DBLIB->update ('users', ["users_emailVerified" => "0"]); //Set E-Mail to unverified
                    $AUTH->verifyEmail();
                }
                die('1');
            }
            else die('2');
		}
	} else die('3');
?>
