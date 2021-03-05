<?php
require_once 'oauthHeadSecure.php';

if (!isset($_GET['redirect_uri']) or !isset($_GET['scope'])) die("Error - missing parameters");
if (isset($_GET['response_type']) && $_GET['response_type'] == "code") {
    //This is an authorization code request, not that we really support anything else
    if (isset($CLIENTS[urldecode($_GET['client_id'])])) {
        $thisClient = $CLIENTS[urldecode($_GET['client_id'])];
        $scope = urldecode($_GET['scope']);
        if ($thisClient['autoApprove']) {
            $code = uniqid("oauthtoken");
            $token = $DBLIB->insert("usersOauthCodes",[
                "usersOauthCodes_code" => $code,
                "usersOauthCodes_client" => $_GET['client_id'],
                "usersOauthCodes_valid" => 1,
                "users_userid" => $AUTH->data['users_userid'],
                "usersOauthCodes_type" => "authorize_token",
                "usersOauthCodes_expiry"  => date("Y-m-d H:i:s",strtotime("+1 minute"))
            ]);
            if (!$token) die("DB error");

            $returnURL = $_GET['redirect_uri'] . "/?code=" . $code . "&state=" . $_GET['state'];
            header("Location: " . $returnURL);
            die('Continue to <a href="' . $returnURL . '">site</a>');
        } else die("Sorry - this application is not approved");
    } else die("Error - missing app");
}