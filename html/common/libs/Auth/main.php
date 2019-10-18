<?php
require_once __DIR__ . '/../../config.php';

class bID
{
    public $login;
    public $loginErrorMessage = '';
    public $data;
    private $permissions;
    private $googleClient;
    private $googleService;
    function __construct()
    {
        global $DBLIB,$CONFIG;
        $this->googleClient = new Google_Client();
        $this->googleClient->setClientId($CONFIG['GOOGLE']['AUTH']['CLIENT']);
        $this->googleClient->setClientSecret($CONFIG['GOOGLE']['AUTH']['SECRET']);
        $this->googleClient->setRedirectUri($CONFIG['ROOTBACKENDURL'] . '/api/login/oauthCallback.php');
        $this->googleClient->setAccessType('offline'); //Do this so they don't have to login every 60 minutes
        $this->googleClient->setHostedDomain("*");
        $this->googleService = new Google_Service_Oauth2($this->googleClient);
        $this->googleClient->addScope(Google_Service_Oauth2::USERINFO_EMAIL);
        $this->googleClient->addScope(Google_Service_Oauth2::USERINFO_PROFILE);
        $this->loginErrorMessage = false;

        if(isset($_SESSION['token'])) {
            $this->googleClient->setAccessToken($_SESSION['token']);
            if (!$this->googleClient->isAccessTokenExpired()) {
                $googleUserData = $this->googleService->userinfo->get();
                if (!empty($googleUserData)) {
                    if (!isset($googleUserData['hd']) || !in_array($googleUserData["hd"],["york.ac.uk","nouse.co.uk"])) { //Allowed domains
                        $this->logout();
                        $this->login = false;
                        $this->loginErrorMessage = 'Please select a york.ac.uk account to login';
                    }
                    $googleUserData['email'] = strtolower($googleUserData['email']);
                    $googleUserData['usernameFromEmail'] = str_replace("@" . $googleUserData['hd'],"",$googleUserData['email']);
                    $DBLIB->where("users.users_suspended", 0); //Don't select suspended users
                    $DBLIB->where("users.users_deleted",0); //Don't select a deleted user
                    if ($googleUserData["hd"] == "york.ac.uk") {
                        $DBLIB->where("users.users_googleAppsUsernameYork", $googleUserData['usernameFromEmail']);
                        $this->data = $DBLIB->getOne("users");
                    } elseif ($googleUserData['hd'] == "nouse.co.uk") {
                        $DBLIB->where("users.users_googleAppsUsernameNouse", $googleUserData['usernameFromEmail']);
                        $this->data = $DBLIB->getOne("users");
                    }
                    if ($this->data == null) {  //We can't find a username for them
                        $this->logout();
                        $this->loginErrorMessage = 'User not found';
                        $this->login = false;
                    }
                    else {
                        /*if ($tokencheckresult["authTokens_adminId"] != null) { //Admin "view site as" functionality
                            $DBLIB->where("users_userid", $tokencheckresult["authTokens_adminId"]);
                            $this->data['viewSiteAs'] = $DBLIB->getOne("users");
                        } else $this->data['viewSiteAs'] = false;*/
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
                            $this->login = true;
                            $this->loginErrorMessage = false;
                        } else {
                            $this->loginErrorMessage = 'User found but does not have permission to login';
                            $this->logout();
                            $this->login = false;
                        }
                    }
                } else {
                    $this->loginErrorMessage = 'Please select a Google account to login';
                    $this->login = false;
                }
            } else {
                $_SESSION['token'] = '';
                $this->login = false;
            }
        } else $this->login = false;
    }
    public function generateURL()  {
        return $this->googleClient->createAuthUrl();
    }
    public function oauthCallback($code) {
        global $CONFIG;
        $this->googleClient->authenticate($code);
        $_SESSION['token'] = $this->googleClient->getAccessToken();
        try {
            header('Location: ' . (isset($_SESSION['return']) ? $_SESSION['return'] :  $CONFIG['ROOTBACKENDURL']));  exit; //Check for session url to redirect to
        } catch (Exception $e) {
            die('<meta http-equiv="refresh" content="0;url=' . (isset($_SESSION['return']) ? $_SESSION['return'] : $CONFIG['ROOTBACKENDURL']) . '" />');
        }
    }
    public function logout() {
        $_SESSION['token'] = '';
        if ($this->googleClient->getAccessToken()) {
            $this->googleClient->revokeToken();
        }
    }
    public function permissionCheck($permissionId) {
        if (!$this->login) return false; //Not logged in
        if (in_array($permissionId, $this->permissions)) return true;
        else return false;
    }
}
?>
