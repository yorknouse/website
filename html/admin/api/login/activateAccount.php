<?php
require_once 'loginAjaxHead.php';

if (!isset($_POST['token']) or !isset($_POST['username']) or !isset($_POST['email']) or !isset($_POST['password'])) finish(false, ["code" => null, "message" => "Parameter error"]);
$DBLIB->where ('valid', 1);
$DBLIB->where ('used', 1);
$DBLIB->where ('id', $GLOBALS['bCMS']->sanitizeString($_POST['token']));
$token = $DBLIB->getOne("activation_tokens");
if (!$token) finish(false, ["code" => null, "message" => "Unknown token error"]);

//Get the user
$DBLIB->where ('userid', $token['userid']);
$user = $DBLIB->getOne("users");

if (usernameTaken($GLOBALS['bCMS']->sanitizeString(strtolower($_POST['username'])))) finish(false, ["code" => null, "message" => "Username taken"]);
elseif (trim($GLOBALS['bCMS']->sanitizeString($_POST['email'])) != null && emailTaken($GLOBALS['bCMS']->sanitizeString(strtolower($_POST['email'])))) finish(false, ["code" => null, "message" => "Email taken"]);

//Update the data on the user
$salts = array(randomstring(10), randomstring(10));
$data = Array (
                    'username' => $GLOBALS['bCMS']->sanitizeString(strtolower($_POST['username'])),
                    "password" => hash('sha256', $salts[0] . $GLOBALS['bCMS']->sanitizeString($_POST['password']) . $salts[1]),
                    "salty1" => $salts[0],
                    "salty2" => $salts[1],
                    "notes" => $user['notes'] . '    ' . 'Signed up using token ' . $token['token'] . ' (' . $token['id'] . ') at ' . time(),
                        "accepted_terms" => 1
                );
if (isset($_POST['email']) && trim($GLOBALS['bCMS']->sanitizeString($_POST['email'])) != null) $data['email'] = $GLOBALS['bCMS']->sanitizeString(strtolower($_POST['email']));
elseif ($user["noEmailNeeded"] != 1 && strlen($user["email"]) <1) finish(false, ["code" => null, "message" => "No email supplied"]);

$DBLIB->where ('userid', $user['userid']);
if (!$DBLIB->update ('users', $data)) finish(false, ["code" => null, "message" => "Unknown user update error"]);

$DBLIB->where('id', $token['id']);
if (!$DBLIB->update ('activation_tokens', ["used" => 1])) finish(false, ["code" => null, "message" => "Unknown token update error"]);

$DBLIB->where('userid', $user['userid']);
if (!$DBLIB->update ('activation_tokens', ["valid" => 0])) finish(false, ["code" => null, "message" => "Unknown final token error"]);

if ((trim($GLOBALS['bCMS']->sanitizeString($_POST['email'])) != null && $user["noEmailNeeded"] != 1) or (strlen($user["email"]) > 0 && $user["emailVerified"] != 1)) verifyemail($user['userid']);

finish(true);
?>