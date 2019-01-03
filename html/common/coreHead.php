<?php
require_once __DIR__ . '/config.php';

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

//GLOBALS STUFF - DON'T CHANGE
/*
function errorHandler() {
    if (error_get_last() and error_get_last()['type'] == '1') {
        global $CONFIG;
        try {
            header('Location: ' . $CONFIG['ERRORS']['URL'] . '?e=' . urlencode(error_get_last()['message']) . '&return=' . urlencode("http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"));
        } catch (Exception $e) {
            die('<meta http-equiv="refresh" content="0; url=' . $CONFIG['ROOTBACKENDURL'] . '/error/?e=' . urlencode(error_get_last()['message']) . '&return=' . urlencode("http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]") . '" />');
        }
    }
}
//set_error_handler('errorHandler');
$CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN'] = new Raven_Client($CONFIG['ERRORS']['SENTRY']);
$CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN']->setRelease($CONFIG['VERSION']['TAG'] . "." . $CONFIG['VERSION']['COMMIT']);
$CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER'] = new Raven_ErrorHandler($CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN']);
$CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerExceptionHandler();
$CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerErrorHandler();
$CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerShutdownFunction();
register_shutdown_function('errorHandler');

*/

/* DATBASE CONNECTIONS */
$CONN = new mysqli($CONFIG['DB_HOSTNAME'], $CONFIG['DB_USERNAME'], $CONFIG['DB_PASSWORD'], $CONFIG['DB_DATABASE']);
if ($CONN->connect_error) throw new Exception($CONN->connect_error);
$DBLIB = new MysqliDb ($CONN); //Re-use it in the wierd lib we love


/* FUNCTIONS */
class bCMS {
    function sanitizeString($var) {
        //Setup Sanitize String Function
        $var = strip_tags($var);
        $var = htmlentities($var);
        $var = stripslashes($var);
        global $CONN;
        return mysqli_real_escape_string($CONN, $var);
    }
    function randomString($length = 10, $stringonly = false) { //Generate a random string
        $characters = 'abcdefghkmnopqrstuvwxyzABCDEFGHKMNOPQRSTUVWXYZ';
        if (!$stringonly) $characters .= '0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
    function cleanString($var) {
        //HTML Purification
        //$var = str_replace(array("\r", "\n"), '<br>', $var); //Replace newlines
/*
        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.DefinitionImpl', null);
        //$config->set('AutoFormat.Linkify', true);
        $purifier = new HTMLPurifier($config);
        $clean_html = $purifier->purify($var);
    return $clean_html; //NOTE THAT THIS REQUIRES THE USE OF PREPARED STATEMENTS AS IT'S NOT ESCAPED
*/
    return $var;

    }
    function formatSize($bytes) {
        if ($bytes >= 1073741824) {
            $bytes = number_format($bytes / 1073741824, 1) . ' GB';
        } elseif ($bytes >= 100000) {
            $bytes = number_format($bytes / 1048576, 1) . ' MB';
        } elseif ($bytes >= 1024) {
            $bytes = number_format($bytes / 1024, 0) . ' KB';
        } elseif ($bytes > 1) {
            $bytes = $bytes . ' bytes';
        } elseif ($bytes == 1) {
            $bytes = $bytes . ' byte';
        } else {
            $bytes = '0 bytes';
        }
        return $bytes;
    }
    function modifyGet($array) {
        //Used to setup links that don't affect search terms etc.
        foreach ($array as $key=>$value) {
            $_GET[$key] = $value;
        }
        return $_GET;
    }
    function auditLog($actionType = null, $table = null, $revelantData = null, $userid = null, $useridTo = null) { //Keep an audit trail of actions - $userid is this user, and $useridTo is who this action was done to if it was at all
        global $DBLIB;
        $data = [
            "auditLog_actionType" => $this->sanitizeString($actionType),
            "auditLog_actionTable" => $this->sanitizeString($table),
            "auditLog_actionData" =>  $this->sanitizeString($revelantData),
            "auditLog_timestamp" =>  date("Y-m-d H:i:s")
            ];
        if ($userid > 0) $data["users_userid"] = $this->sanitizeString($userid);
        if ($useridTo > 0) $data["auditLog_actionUserid"] = $this->sanitizeString($useridTo);

        if ($DBLIB->insert("auditLog", $data)) return true;
        else return false;
    }
    function s3URL($fileid, $size = false, $forceDownload = false, $expire = '+1 minute') {
        global $DBLIB, $CONFIG;
        /*
         * File interface for Amazon AWS S3.
         *  Parameters
         *      f (required) - the file id as specified in the database
         *      s (filesize) - false to get the original - available is "tiny" (100px) "small" (500px) "medium" (800px) "large" (1500px)
         *      d (optional, default false) - should a download be forced or should it be displayed in the browser? (if set it will download)
         *      e (optional, default 1 minute) - when should the link expire? Must be a string describing how long in words basically. If this file type has security features then it will default to 1 minute.
         */
        $fileid = $this->sanitizeString($fileid);
        if (strlen($fileid) < 1) return false;
        $DBLIB->where("s3files_id", $fileid);
        $DBLIB->where("s3files_meta_deleteOn IS NULL"); //If the file is to be deleted soon or has been deleted don't let them download it
        $DBLIB->where("s3files_meta_physicallyStored",1); //If we've lost the file or deleted it we can't actually let them download it
        $file = $DBLIB->getone("s3files");
        if (!$file) return false;
        if ($file['s3files_meta_public'] == 1) {
            $returnFilePath = $file['s3files_cdn_endpoint'] . "/" . $file['s3files_path'] . "/" . $file['s3files_filename'];
            switch ($size) {
                case "tiny":
                    $returnFilePath .= ' (tiny)';
                    break; //The want the original
                case "small":
                    $returnFilePath .= ' (small)';
                    break; //The want the original
                case "medium":
                    $returnFilePath .= ' (medium)';
                    break; //The want the original
                case "large":
                    $returnFilePath .= ' (large)';
                    break; //The want the original
                default:
                    //They want the original
            }
            return $returnFilePath . "." . $file['s3files_extension'];
        } else {
            $s3Client = new Aws\S3\S3Client([
                'region'  => $file["s3files_region"],
                'endpoint' => "https://" . $file["s3files_endpoint"],
                'version' => 'latest',
                'credentials' => array(
                    'key'    => $CONFIG['AWS']['KEY'],
                    'secret' => $CONFIG['AWS']['SECRET'],
                )
            ]);

            $file['expiry'] = $expire;


            switch ($file['s3files_meta_type']) {
                case 1:
                    //This is a user thumbnail
                    break;
                default:
                    //There are no specific requirements for this file so not to worry.
            }

            $parameters = [
                'Bucket' => $file['s3files_bucket'],
                'Key'    => $file['s3files_path'] . "/" . $file['s3files_filename'] . '.' . $file['s3files_extension'],
            ];
            if ($forceDownload) $parameters['ResponseContentDisposition'] = 'attachment; filename="' . $CONFIG['PROJECT_NAME'] . ' ' . $file['s3files_filename'] . '.' . $file['s3files_extension'] . '"';
            $cmd = $s3Client->getCommand('GetObject', $parameters);
            $request = $s3Client->createPresignedRequest($cmd, $file['expiry']);
            $presignedUrl = (string) $request->getUri();

            $presignedUrl = $file['s3files_cdn_endpoint'] . explode($file["s3files_endpoint"],$presignedUrl)[1]; //Remove the endpoint itself from the url in order to set a new one

            return $presignedUrl;
        }
    }
    public function articleThumbnail($article) {
        global $DBLIB,$CONFIG;
        if ($article == null) return false;
        $DBLIB->where("articles_id", $this->sanitizeString($article));
        $thumb = $DBLIB->getone("articles",["articles_thumbnail"]);
        if (!$thumb or $thumb["articles_thumbnail"] == null) return false;
        if (is_numeric($thumb["articles_thumbnail"])) return $this->s3URL($thumb["articles_thumbnail"], "large");
        else return $CONFIG['FILESTOREURL'] . "/archive/public/articleImages/" . $thumb["articles_thumbnail"];
    }
    private $cloudflare = false;
    private function cloudflareInit() {
        global $CONFIG;
        $this->cloudflare = [];
        $this->cloudflare['key'] = new Cloudflare\API\Auth\APIKey($CONFIG['CLOUDFLARE']['EMAIL'], $CONFIG['CLOUDFLARE']['KEY']);
        $this->cloudflare['adapter'] = new Cloudflare\API\Adapter\Guzzle($this->cloudflare['key']);
        $this->cloudflare['zones'] = new \Cloudflare\API\Endpoints\Zones($this->cloudflare['adapter']);
        $this->cloudflare['zoneid'] = $this->cloudflare['zones']->getZoneID('nouse.co.uk');
        if (!$this->cloudflare['zoneid']) return false;
        else return true;
        //$this->cloudflare['user'] = new Cloudflare\API\Endpoints\User($this->cloudflare['adapter']);
    }
    public function cacheClear($URL) {
        if (!$this->cloudflare) $this->cloudflareInit();

        $this->cloudflare['zones']->cachePurge($this->cloudflare['zoneid'], [$URL]);
        $this->auditLog("CACHECLEAR", null, $URL);
        return true;
    }
    public function cacheClearCategory($categoryid) {
        global $DBLIB, $CONFIG;
        if (!$categoryid) return false;

        $DBLIB->where("categories_id", $this->sanitizeString($categoryid));
        $category = $DBLIB->getOne("categories",["categories_name","categories_nestUnder"]);
        if (!$category) return false;
        $url = $CONFIG['ROOTFRONTENDURL'] . '/' . $category['categories_name'];
        if ($category['categories_nestUnder'] != null) {
            $DBLIB->where("categories_id", $category['categories_nestUnder']);
            $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
            $url .= '/' . $category['categories_name'];
            if ($category['categories_nestUnder'] != null) {
                $DBLIB->where("categories_id", $category['categories_nestUnder']);
                $category = $DBLIB->getone("categories",["categories_name"]);
                $url .= '/' . $category['categories_name'];
            }
        }

        return $this->cacheClear($url . "/");
    }
    public function postSocial($articleid, $postToFacebook = true, $postToTwitter = true) {
        global $DBLIB,$CONFIG;
        $DBLIB->where("articles.articles_id", $this->sanitizeString($articleid));
        $DBLIB->where("articles.articles_showInSearch", 1); //ie those that can actually be shown - no point tweeting a dud link
        $DBLIB->where("articles.articles_published <= '" . date("Y-m-d H:i:s") . "'");
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $article = $DBLIB->getone("articles", ["articles_socialExcerpt", "articles.articles_socialConfig","articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline","articlesDrafts.articlesDrafts_excerpt"]);
        if (!$article) return false;

        $realpermalink = $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article["articles_published"])) . "/" . $article['articles_slug'];
        
        if (strlen($article['articles_socialExcerpt']) > 0) {
            $postExcerpt = $article['articles_socialExcerpt'];
        } elseif (strlen($article['articlesDrafts_excerpt']) > 0) {
            $postExcerpt = $article['articlesDrafts_excerpt'];
        } else {
            $postExcerpt = $article['articlesDrafts_headline'];
        }

        $article["articles_socialConfig"] = explode(",", $article["articles_socialConfig"]);
        if ($article["articles_socialConfig"][0] == 1 and $article["articles_socialConfig"][1] != 1 and $postToFacebook) {
            //Go ahead and post to facebook


            $url = 'https://maker.ifttt.com/trigger/socialMediaAutomationFB/with/key/' . $CONFIG['IFTTT'];
            $ch = curl_init($url);
            $xml = "value1=" . urlencode($postExcerpt) . "&value2=" . urlencode($realpermalink) . "&value3=null";
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
            curl_setopt($ch,CURLOPT_RETURNTRANSFER,1); //Supress the output from being dumped
            $response = curl_exec($ch);
            curl_close($ch);

            if (true) $article["articles_socialConfig"][1] = 1; //TODO check the IFTTT response
        }
        if ($article["articles_socialConfig"][2] == 1 and $article["articles_socialConfig"][3] != 1 and $postToTwitter) {
            //Go ahead and post to twitter

            $url = 'https://maker.ifttt.com/trigger/socialMediaAutomationTwitter/with/key/' . $CONFIG['IFTTT'];
            $ch = curl_init($url);
            $xml = "value1=" . urlencode($postExcerpt) . "&value2=" . urlencode($realpermalink) . "&value3=null";
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
            curl_setopt($ch,CURLOPT_RETURNTRANSFER,1); //Supress the output from being dumped
            $response = curl_exec($ch);
            curl_close($ch);

            if (true) $article["articles_socialConfig"][3] = 1; //TODO check the IFTTT response
        }

        $DBLIB->where("articles_id", $this->sanitizeString($articleid));
        if ($DBLIB->update("articles", ["articles.articles_socialConfig" => implode(",", $article["articles_socialConfig"])])) return true;
        else return false;
    }
}

$GLOBALS['bCMS'] = new bCMS;