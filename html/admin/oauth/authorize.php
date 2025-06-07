<?php
require_once 'oauthHeadSecure.php';

if (!isset($_GET['redirect_uri']) or !isset($_GET['scope']))
    die("Error - missing parameters");
if (!isset($_GET['response_type']) && $_GET['response_type'] !== "code")
    return;

//This is an authorization code request, not that we really support anything else
if (!isset($CLIENTS[urldecode($_GET['client_id'])]))
    die("Error - missing app");

$thisClient = $CLIENTS[urldecode($_GET['client_id'])];
if (!$thisClient)
    die("Service not found");
$scope = urldecode($_GET['scope']);
if ($thisClient['permission'] != null && !$AUTH->permissionCheck($thisClient['permission']))
    die("Sorry - you can't access this service");

$code = uniqid("oauthtoken");
$token = $DBLIB->insert("usersOauthCodes",[
    "usersOauthCodes_code" => $code,
    "usersOauthCodes_client" => $_GET['client_id'],
    "usersOauthCodes_valid" => 1,
    "users_userid" => $AUTH->data['users_userid'],
    "usersOauthCodes_type" => "authorize_token",
    "usersOauthCodes_expiry"  => date("Y-m-d H:i:s",strtotime("+1 minute"))
]);

if (!$token)
    die("DB error");

$PAGEDATA['LINK'] = $_GET['redirect_uri'] . "/?code=" . $code . "&state=" . $_GET['state'];

$PAGEDATA['CLIENT'] = $thisClient;

echo $TWIG->render('oauth/authorize.twig', $PAGEDATA);
