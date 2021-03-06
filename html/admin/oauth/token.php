<?php
require_once 'oauthHead.php';
if (isset($_POST['grant_type']) && $_POST['grant_type'] == "authorization_code") {
    //This is an authorization code request, not that we really support anything else
    if (isset($_POST['code'])) {
        $thisClient = $CLIENTS[urldecode($_POST['client_id'])];
        if ($thisClient['secret'] != $_POST['client_secret']) die("Auth error");
        if (!$thisClient['autoApprove']) die("User not approved"); //TODO implement user approvals for oAuth

        $DBLIB->where("usersOauthCodes_code",$_POST['code']);
        $DBLIB->where("usersOauthCodes_type","authorize_token");
        $DBLIB->where("usersOauthCodes_client",$_POST['client_id']);
        $DBLIB->where("usersOauthCodes_valid",1);
        $DBLIB->where("usersOauthCodes_expiry >= '" . date("Y-m-d H:i:s") . "'");
        $code = $DBLIB->getOne("usersOauthCodes",["usersOauthCodes_id",'users_userid']);
        if (!$code) die("Auth error");

        $DBLIB->where("usersOauthCodes_id",$code['usersOauthCodes_id']);
        $DBLIB->update("usersOauthCodes",["usersOauthCodes_valid" => 0]);

        $accessTokenCode = uniqid("oauthaccesstoken");
        $token = $DBLIB->insert("usersOauthCodes",[
            "usersOauthCodes_code" => $accessTokenCode,
            "usersOauthCodes_type" => "access_token",
            "usersOauthCodes_client" => $_POST['client_id'],
            "usersOauthCodes_valid" => 1,
            "users_userid" => $code['users_userid'],
            "usersOauthCodes_expiry"  => date("Y-m-d H:i:s",strtotime("+1 hour"))
        ]);
        if (!$token) die("DB error");

        $DBLIB->where("users_userid",$code['users_userid']);
        $user = $DBLIB->getone("users",["users_userid",'users_googleAppsUsernameYork','users_googleAppsUsernameNouse']);
        if (!$user) die("User auth error");
        
        if ($user['users_googleAppsUsernameYork'] != null) $email = $user['users_googleAppsUsernameYork'] . "@york.ac.uk";
        elseif ($user['users_googleAppsUsernameNouse'] != null) $email = $user['users_googleAppsUsernameNouse']. "@nouse.co.uk";
        else $email = $user['users_userid'] . "@nouse.co.uk";

        die(json_encode(["expires_in" => 3600,"access_token" => $accessTokenCode,"token_type" => "Bearer","id_token"=>generateJWT(["exp"=>strtotime("+1 hour"),"email"=>$email,"role"=>"Viewer"],$accessTokenCode)]));
    } else die("Error - missing parameters");
}