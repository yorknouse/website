<?php
require_once 'oauthHead.php';
if (!isset($_POST['grant_type']) or $_POST['grant_type'] !== "authorization_code")
    return;

//This is an authorization code request, not that we really support anything else
if (!isset($_POST['code']) or !isset($_POST['client_id']))
    die("Error - missing parameters");

$thisClient = $CLIENTS[$_POST['client_id']];
if (!$thisClient) die("Service not found");
if ($thisClient['secret'] != $_POST['client_secret']) die("Auth error");

$DBLIB->where("usersOauthCodes_code", $_POST['code']);
$DBLIB->where("usersOauthCodes_type", "authorize_token");
$DBLIB->where("usersOauthCodes_client", $_POST['client_id']);
$DBLIB->where("usersOauthCodes_valid", 1);
$DBLIB->where("usersOauthCodes_expiry >= '" . date("Y-m-d H:i:s") . "'");
$code = $DBLIB->getOne("usersOauthCodes", ["usersOauthCodes_id", 'users_userid']);
if (!$code) die("Auth error");

$DBLIB->where("usersOauthCodes_id", $code['usersOauthCodes_id']);
$DBLIB->update("usersOauthCodes", ["usersOauthCodes_valid" => 0]);

$accessTokenCode = uniqid("oauthaccesstoken");
$token = $DBLIB->insert("usersOauthCodes", [
    "usersOauthCodes_code" => $accessTokenCode,
    "usersOauthCodes_type" => "access_token",
    "usersOauthCodes_client" => $_POST['client_id'],
    "usersOauthCodes_valid" => 1,
    "users_userid" => $code['users_userid'],
    "usersOauthCodes_expiry" => date("Y-m-d H:i:s", strtotime("+1 hour"))
]);
if (!$token) die("DB error");

$DBLIB->where("users_userid", $code['users_userid']);
$user = $DBLIB->getone("users", ["users_userid", 'users_googleAppsUsernameYork', 'users_googleAppsUsernameNouse', "users_name1", 'users_name2']);
if (!$user) die("User auth error");

if ($user['users_googleAppsUsernameYork'] != null) $email = $user['users_googleAppsUsernameYork'] . "@york.ac.uk";
elseif ($user['users_googleAppsUsernameNouse'] != null) $email = $user['users_googleAppsUsernameNouse'] . "@nouse.co.uk";
else $email = $user['users_userid'] . "@nouse.co.uk"; //Bit of a get-out-of-jail solution

$name = preg_replace("/[^A-Za-z0-9 ]/", '', $user['users_name1']) . " " . preg_replace("/[^A-Za-z0-9 ]/", '', $user['users_name2']);

$jwtArray = ["exp" => strtotime("+1 hour"), "email" => $email, "name" => $name];

if ($_POST['client_id'] == "GRAFANA") $jwtArray["role"] = "Viewer";

die(json_encode(["expires_in" => 3600, "access_token" => $accessTokenCode, "token_type" => "Bearer", "id_token" => generateJWT($jwtArray, $accessTokenCode)]));
