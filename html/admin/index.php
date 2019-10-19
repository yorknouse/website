<?php
require_once __DIR__ . '/common/headSecure.php';

$PAGEDATA['pageConfig'] = ["TITLE" => "Home", "BREADCRUMB" => false];

$PAGEDATA['CHANGELOG'] = [];
exec("cd " . __DIR__ . "/../../ && git log -10", $PAGEDATA['CHANGELOG']);

$PAGEDATA['MOSTACTIVEUSERS'] = [];
$PAGEDATA['MOSTACTIVEUSERS']['WEEK'] = $DBLIB->rawQuery("SELECT users.users_name1, users.users_name2, auditLog.users_userid, COUNT(*) AS counter
FROM auditLog LEFT JOIN users on auditLog.users_userid = users.users_userid WHERE (auditLog.users_userid IS NOT NULL) AND (auditLog.auditLog_timestamp >= curdate() - INTERVAL DAYOFWEEK(curdate())+6 DAY)
GROUP BY auditLog.users_userid ORDER BY counter DESC LIMIT 5");

echo $TWIG->render('index.twig', $PAGEDATA);
?>
