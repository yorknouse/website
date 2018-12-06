<?php
require_once __DIR__ . '/../../config.php';

class bID
{
    public $login;
    private $token;
    public $data;
    private $permissions;
    function __construct()
    {
        global $DBLIB;
        if (isset($_SESSION['token'])) {
            //Time to check whether it is valid
            $DBLIB->where('authTokens_token', $GLOBALS['bCMS']->sanitizeString($_SESSION['token']));
            $DBLIB->where("authTokens_valid", '1');
            $tokencheckresult = $DBLIB->getOne("authTokens");
            if ($tokencheckresult != null) {
                if (strtotime($tokencheckresult["authTokens_created"]) + 3 * 24 * (3600 * 1000) < time() or $tokencheckresult["authTokens_ipAddress"] != (isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"])) {
                    $this->login = false;
                } //Check token hasn't expired and check if the IP matches that preset in table
                else {
                    //Get user data
                    $DBLIB->where("users_userid", $tokencheckresult["users_userid"]);
                    $this->data = $DBLIB->getOne("users");
                    if ($this->data == null) $this->login = false;
                    else {
                        $this->token = $tokencheckresult;

                        if ($tokencheckresult["authTokens_adminId"] != null) { //Admin "view site as" functionality
                            $DBLIB->where("userid", $tokencheckresult["authTokens_adminId"]);
                            $this->data['viewSiteAs'] = $DBLIB->getOne("users");
                        } else $this->data['viewSiteAs'] = false;

                        $DBLIB->where("userPositions_end <= '" . date('Y-m-d H:i:s') . "'");
                        $DBLIB->where("userPositions_start >= '" . date('Y-m-d H:i:s') . "'");
                        $DBLIB->join("positions", "userPositions.positions_id=positions.positions_id", "LEFT");
                        $DBLIB->where("users_userid", $this->data['users_userid']);
                        $positions = $DBLIB->get("userPositions");
                        $this->data['positions'] = [];
                        $permissionCodes = [];
                        foreach ($positions as $position) {
                            $this->data['positions'][] = $position;
                            $permissionCodes = array_merge ( $permissionCodes, explode(",", $position['positions_permissions'],$position['userPositions_extraPermissions']));
                        }
                        $this->permissions = array_unique($permissionCodes);
                        $this->login = true;
                    }
                }
            } else $this->login = false;
        } else {
            $this->login = false;
        }
    }
    public function permissionCheck($permissionId) {
        if (!$this->login) return false; //Not logged in
        if (in_array($permissionId, $this->permissions)) return true;
        else return false;
    }
    private function generateTokenAlias()
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < 30; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return md5(time() . $randomString);
    }

    function generateToken($userid, $redirect = true, $adminuserid = null, $returntoken = false)
    {
        global $CONFIG, $DBLIB;

        $tokenalias = $this->generateTokenAlias();
        $data = Array("authTokens_created" => date('Y-m-d G:i:s'),
            "authTokens_token" => $tokenalias,
            "users_userid" => $userid,
            "authTokens_ipAddress" => isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : $_SERVER["REMOTE_ADDR"],
        );
        if ($adminuserid != null) {
            $data["authTokens_adminId"] = $adminuserid; //Admin login as
        }
        $token = $DBLIB->insert('authTokens', $data);

        if (!$token) throw new Exception("Cannot insert a newly created token into DB");

        $_SESSION['token'] = $tokenalias;

        if ($redirect) {
            //If the function call has asked for a redirect
            try {
                header('Location: ' . (isset($_SESSION['return']) ? $_SESSION['return'] : "/")); //Check for session url to redirect to
            } catch (Exception $e) {
                die('<meta http-equiv="refresh" content="0;url=' . (isset($_SESSION['return']) ? $_SESSION['return'] : "/") . '" />');
            }
        } else if ($returntoken) return $tokenalias;
        else return true;
    }

    function logout()
    {
        global $DBLIB;
        if (isset($_SESSION['token'])) {
            $DBLIB->where("authTokens_token", $_SESSION['token']);
            $DBLIB->update('authTokens', ["authTokens_valid" => 0]);
        }
        $_SESSION = array();
    }

    function emailTaken($email)
    {
        global $DBLIB;
        $email = $GLOBALS['bCMS']->sanitizeString(strtolower($email));
        $DBLIB->where("users_email", $email);
        if ($DBLIB->getValue("users", "count(*)") > 0) return true;
        else return false;
    }

    function usernameTaken($username)
    {
        global $DBLIB;
        $username = $GLOBALS['bCMS']->sanitizeString(strtolower($username)); //Usernames must be unique
        $DBLIB->where("users_username", $username);
        if ($DBLIB->getValue("users", "count(*)") > 0) return true;
        else return false;
    }

    /*
    function verifyEmail($userid = false)
    { //Verify a user's E-Mail address
        global $DBLIB, $CONFIG, $LOGIN, $USERDATA;
        if (!$LOGIN && !$userid) return false;
        if (!$userid) $userid = $USERDATA['userid'];
        else $userid = $GLOBALS['bCMS']->sanitizeString($userid);

        $DBLIB->where("userid", $userid);
        $DBLIB->where("emailverified", 0);
        $DBLIB->where("email IS NOT NULL");
        $DBLIB->where("noEmailNeeded", 0);
        if ($DBLIB->getValue("users", "count(*)") != 1) return false;

        $DBLIB->where('userid', $userid);
        $DBLIB->update('emailverificationcodes', ["valid" => "0"]); //Set all the previous codes to invalid
        $code = md5(randomstring(100) . $userid . time()) . time();
        $data = Array("userid" => $userid,
            "timestamp" => date('Y-m-d G:i:s'),
            "code" => $code
        );
        if (!$DBLIB->insert('emailverificationcodes', $data)) die('Fatal Error verifiying E-Mail');
        if (sendemail($userid, "Verify your E-Mail", '<center><h1>Verify your E-Mail address!</h1><br/><p>Please <a href="' . $CONFIG['ROOTURL'] . '/login/verify_email.php?code=' . $code . '">verify your E-Mail address for ' . $CONFIG['PROJECT_NAME'] . '</a></p><br/><i><b>N.B.</b>The link in this E-Mail will only last for 48 hours!</i></center>')) return true;
        else return false;
    }
    */
}
?>
