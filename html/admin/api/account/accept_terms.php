<?php
	$SECURE=true;
	$MAKESCHANGES = true;
	require_once '../../theme/head.php';

	header('Content-Type:text/plain');


	$DBLIB->where('userid', $USERDATA['userid']);
	if ($DBLIB->update('users', ["accepted_terms" => $USERDATA['token']['tokenid']])) die('1');
	else die('2');
?>
