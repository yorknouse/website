<?php
require_once __DIR__ . '/../../common/coreHead.php';

class bID
{
    public $login;
    public $data;
    private $debug;
    private $tokenCheckResult;
    private $permissions;
    function __construct()
    {
        global $DBLIB,$CONFIG;
        if (isset($_SESSION['token'])) {
            //Time to check whether it is valid
            $DBLIB->where('authTokens_token', $_SESSION['token']);
            $DBLIB->where("authTokens_valid", 1);
            $this->tokenCheckResult = $DBLIB->getOne("authTokens", ["authTokens_created", "authTokens_ipAddress", "users_userid", "authTokens_adminId"]);
            if ($this->tokenCheckResult != null) {
                if ((strtotime($this->tokenCheckResult["authTokens_created"]) + (1 * 12 * (3600 * 1000))) < time()) {
                    $this->debug .= "Token expired at " . $this->tokenCheckResult["authTokens_created"] . " - server time is " . time() . "<br/>";
                    $this->login = false;
                } else {
                    if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
                        if ($_SERVER["HTTP_CF_CONNECTING_IP"] != $this->tokenCheckResult["authTokens_ipAddress"]) {
                            $this->debug .= "IP from Cloudflare doesn't match token<br/>";
                            $this->login = false;
                        }
                    } elseif (isset($_SERVER["HTTP_X_FORWARDED_FOR"])) {
                        if ($_SERVER["HTTP_X_FORWARDED_FOR"] != $this->tokenCheckResult["authTokens_ipAddress"]) {
                            //TODO evaluate this as a security risk
                            $this->debug .= "IP from Heroku/generic proxy doesn't match token<br/>";
                            $this->login = false;
                        }
                    } else {
                        if ($_SERVER["REMOTE_ADDR"] != $this->tokenCheckResult["authTokens_ipAddress"]) {
                            $this->debug .= "IP direct doesn't match token<br/>";
                            $this->login = false;
                        }
                    }
                    //Get user data
                    $DBLIB->where("users_userid", $this->tokenCheckResult["users_userid"]);
                    $this->data = $DBLIB->getOne("users");
                    if ($this->data == null) {
                        $this->debug .= "User not found <br/>";
                        $this->login = false;
                    } else {
                        $this->token = $this->tokenCheckResult;
                        if ($this->tokenCheckResult["authTokens_adminId"] != null) { //Admin "view site as" functionality
                            $DBLIB->where("users_userid", $this->tokenCheckResult["authTokens_adminId"]);
                            $this->data['viewSiteAs'] = $DBLIB->getOne("users");
                        } else $this->data['viewSiteAs'] = false;

                        $this->login = true;
                        
                        $DBLIB->where("userPositions_end >= '" . date('Y-m-d H:i:s') . "'");
                        $DBLIB->where("userPositions_start <= '" . date('Y-m-d H:i:s') . "'");
                        $DBLIB->orderBy("positions_rank", "ASC");
                        $DBLIB->orderBy("positions_displayName", "ASC");
                        $DBLIB->join("positions", "userPositions.positions_id=positions.positions_id", "LEFT");
                        $DBLIB->where("users_userid", $this->data['users_userid']);
                        $positions = $DBLIB->get("userPositions");
                        if (count($positions) > 0) { //You must have at least one current position to be allowed to login
                            $this->data['positions'] = [];
                            $permissionCodes = [];
                            foreach ($positions as $position) {
                                $this->data['positions'][] = $position;
                                $position['groups'] = explode(",", $position['positions_positionsGroups']);
                                foreach ($position['groups'] as $positiongroup) {
                                    $DBLIB->where("positionsGroups_id", $positiongroup);
                                    $positiongroup = $DBLIB->getone("positionsGroups", ["positionsGroups_actions"]);
                                    $permissionCodes = array_merge($permissionCodes, explode(",", $positiongroup['positionsGroups_actions']), explode(",", $position['userPositions_extraPermissions']));
                                }
                            }
                            $this->permissions = array_unique($permissionCodes);
                        } else {
                            $this->debug .= 'User found but does not have permission to login';
                            $this->login = false;
                        }
                    }
                }
            } else {
                $this->debug .= "Token not found in db<br/>";
                $this->login = false;
            }
        } else {
            $this->debug .= "No session token<br/>";
            $this->login = false;
        }
    }
    public function login($code) {
        global $CONFIG,$DBLIB;
        $return = ["result" => false, "errorMessage" => "Unknown Error", "url" => (isset($_SESSION['return']) ? $_SESSION['return'] :  $CONFIG['ROOTBACKENDURL'])];

        $client = new Google_Client(['client_id' => $CONFIG['GOOGLE']['AUTH']['CLIENT']]);  // Specify the CLIENT_ID of the app that accesses the backend
        $payload = $client->verifyIdToken($code); //verifies the JWT signature, the aud claim, the exp claim, and the iss claim.
        if ($payload) {
            if ($payload["email_verified"] != true) {
                $return["errorMessage"] = 'Email address not verified';
                return $return;
            }
            if (!isset($payload['hd']) || !in_array($payload["hd"],["york.ac.uk","nouse.co.uk"])) { //Allowed domains
                $return["errorMessage"] = 'Please select a york.ac.uk account to login';
                return $return;
            }
            $usernameFromEmail = str_replace("@" . $payload['hd'],"",strtolower($payload['email']));
            $DBLIB->where("users.users_deleted",0); //Don't select a deleted user
            if ($payload["hd"] == "york.ac.uk") $DBLIB->where("users.users_googleAppsUsernameYork", $usernameFromEmail);
            elseif ($payload['hd'] == "nouse.co.uk") $DBLIB->where("users.users_googleAppsUsernameNouse", $usernameFromEmail);
            else die("Payload HD Error"); //Shouldn't be this far as the HD attribute should have picked it up
            $user = $DBLIB->getOne("users", ["users_userid","users_suspended"]);
            if ($user == null) { //We can't find a username for them
                $return["errorMessage"] = "User not found";
                return $return;
            } elseif ($user['users_suspended'] == 1) {
                $return["errorMessage"] = "User suspended";
                return $return;
            }

            $DBLIB->where("userPositions_end >= '" . date('Y-m-d H:i:s') . "'");
            $DBLIB->where("userPositions_start <= '" . date('Y-m-d H:i:s') . "'");
            $DBLIB->orderBy("positions_rank", "ASC");
            $DBLIB->orderBy("positions_displayName", "ASC");
            $DBLIB->join("positions", "userPositions.positions_id=positions.positions_id", "LEFT");
            $DBLIB->where("users_userid", $user['users_userid']);
            $positionsCount = $DBLIB->getValue("userPositions", "count(*)");
            if ($positionsCount < 1) { //They don't have a role to login to
                $return["errorMessage"] = "No role assigned to user";
                return $return;
            }

            //Generate a token
            $data = [
                "authTokens_created" => date('Y-m-d G:i:s'),
                "authTokens_token" => $this->generateTokenAlias(),
                "users_userid" => $user['users_userid'],
                "authTokens_ipAddress" => (isset($_SERVER["HTTP_CF_CONNECTING_IP"]) ? $_SERVER["HTTP_CF_CONNECTING_IP"] : (isset($_SERVER["HTTP_X_FORWARDED_FOR"]) ? $_SERVER["HTTP_X_FORWARDED_FOR"] : $_SERVER["REMOTE_ADDR"])),
            ];
            $token = $DBLIB->insert('authTokens', $data);
            if (!$token) throw new Exception("Cannot insert a newly created token into DB");
            $_SESSION['token'] = $data["authTokens_token"];

            $return["result"] = true;
            return $return;
        } else { //Google has said the token is invalid
            $return["errorMessage"] = "Invalid ID token";
            return $return;
        }
        return false;
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

    public function logout()
    {
        global $DBLIB;
        if (isset($_SESSION['token'])) {
            $DBLIB->where("authTokens_token", $_SESSION['token']);
            $DBLIB->update('authTokens', ["authTokens_valid" => 0]);
        }
        $_SESSION = array();
    }
    public function destroyTokens($userid = null) {
        global $DBLIB, $CONFIG;

        if ($userid == null) $userid = $this->data['users_userid'];
        else $userid = $GLOBALS['bCMS']->sanitizeString($userid);

        $DBLIB->where ('users_userid', $userid);
        if ($DBLIB->update ('authTokens', ["authTokens_valid" => 0])) return true;
        else return false;
    }

    public function permissionCheck($permissionId) {
        if (!$this->login) return false; //Not logged in
        if (in_array($permissionId, $this->permissions)) return true;
        else return false;
    }
}
