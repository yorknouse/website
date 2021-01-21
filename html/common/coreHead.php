<?php
require_once __DIR__ . '/config.php';

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

use voku\helper\HtmlDomParser;

//GLOBALS STUFF - DON'T CHANGE
function errorHandler()
{
    if (error_get_last() and error_get_last()['type'] == '1') {
        global $CONFIG;
        die('Sorry we hit an error. Our tech team have been automatically notified but please contact support@nouse.co.uk for help resolving this error for your device <p style="display:none;">' . "\n\n\n" . error_get_last()['message'] . "\n\n\n" . '</p>');
    }
}

//set_error_handler('errorHandler');
if ($CONFIG['DEV'] != true) {
    $CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN'] = new Raven_Client($CONFIG['ERRORS']['SENTRY']);
    $CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN']->setRelease($CONFIG['VERSION']['TAG'] . "." . $CONFIG['VERSION']['COMMIT']);
    $CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER'] = new Raven_ErrorHandler($CONFIG['ERRORS']['SENTRY-CLIENT']['MAIN']);
    $CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerExceptionHandler();
    $CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerErrorHandler();
    $CONFIG['ERRORS']['SENTRY-CLIENT']['HANDLER']->registerShutdownFunction();
    register_shutdown_function('errorHandler');
}

//Content security policy - BACKEND HAS A DIFFERENT ONE SO LOOK OUT FOR THAT
header("Content-Security-Policy: default-src 'none';" .
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.pubnub.com https://cdnjs.cloudflare.com https://platform.twitter.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.syndication.twimg.com https://connect.facebook.net https://*.google.com https://*.google.co.uk https://www.gstatic.com https://*.googleadservices.com https://*.googlesyndication.com https://www.googletagservices.com  http://*.liveblogpro.com https://*.liveblogpro.com https://platform.vine.co  https://jsd-widget.atlassian.com;".
    //          We have laods of inline JS              Live sockets         Libs                        Twitter embedd              Google webmaster tools                    Google analytics                  Twitter pictures for embedd   Facebook share           Recapatcha +adsense          Google adsense                                                           Google analytics etc                        Liveblog pro                                Liveblog pro                Jira Widget
    "style-src 'unsafe-inline' 'self' https://*.twimg.com https://platform.twitter.com https://cdnjs.cloudflare.com https://fonts.googleapis.com;".
    //          We have loads of inline CSS  Twitter pics                             Live chat supports             Libs                        GFonts
    "font-src https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com;" .
    //          Loading in google fonts     more gfonts                 Fonts from libs like fontawesome
    "manifest-src 'self' https://*.nouse.co.uk;" .
    //          Show images on mobile devices like favicons
    "img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.nouse.co.uk https://nouse.co.uk https://nouse.ams3.digitaloceanspaces.com https://nouse.ams3.cdn.digitaloceanspaces.com https://*.twitter.com https://*.twimg.com https://www.google-analytics.com https://*.googlesyndication.com https://www.googletagmanager.com https://i2.wp.com             http://*.liveblogpro.com https://*.liveblogpro.com;".
    //                    Uploads    Images from libs                 Images                                                                                                                    Twitter embedd      More twitter          Google analytics                                                                          User icons fallback            Liveblog pro
    "connect-src 'self' https://*.nouse.co.uk https://*.backblazeb2.com  https://*.amazonaws.com https://*.digitaloceanspaces.com https://*.pndsn.com https://sentry.io https://www.google-analytics.com https://*.gstatic.com https://*.googlesyndication.com  https://*.atlassian.com;".
    //                  File uploads                                                                                                Pubnub sockets          Error reporting     Google analytics                                        Adds                        Jira Widget
    "frame-src https://*.twitter.com https://staticxx.facebook.com https://www.google.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://e.issuu.com http://*.liveblogpro.com https://*.liveblogpro.com https://twitter.com https://*.nouse.co.uk https://nouse.ams3.cdn.digitaloceanspaces.com https://accounts.google.com;".
    //          Embedding twitter feed   Facebook feed              embedded maps               Google adsense                                                  Embedd older editions         LiveBlog pro                                    Live blog pro       Print editions                                              Login
    "object-src 'self' blob:;".
    //          Inline PDFs generated by the system
    "worker-src 'self' blob:;" .
    //          Use of camera
    "frame-ancestors 'self';");


/* DATBASE CONNECTIONS */
$CONN = new mysqli($CONFIG['DB_HOSTNAME'], $CONFIG['DB_USERNAME'], $CONFIG['DB_PASSWORD'], $CONFIG['DB_DATABASE']);
if ($CONN->connect_error) throw new Exception($CONN->connect_error);
$DBLIB = new MysqliDb ($CONN); //Re-use it in the wierd lib we love


/* FUNCTIONS */
class bCMS {

    private $cloudflare;

    function sanitizeString($var) {
        $var = htmlspecialchars ($var); //Sanitize all html out of it - important for user comments section
        $var = strip_tags($var);
        //$var = htmlentities($var);
        //$var = stripslashes($var);
        global $CONN;
        return mysqli_real_escape_string($CONN, $var);
        return $var;
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

    function cleanString($var)
    {
        //HTML Purification - user comments are run through this so it's pretty important we strip out all bad HTML.
        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.DefinitionImpl', null);
        //$config->set('AutoFormat.Linkify', true);
        $purifier = new HTMLPurifier($config);
        $clean_html = $purifier->purify($var);
        return $clean_html; //NOTE THAT THIS REQUIRES THE USE OF PREPARED STATEMENTS AS IT'S NOT ESCAPED
    }

    function formatSize($bytes)
    {
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

    function modifyGet($array)
    {
        //Used to setup links that don't affect search terms etc.
        foreach ($array as $key => $value) {
            $_GET[$key] = $value;
        }
        return $_GET;
    }

    public function articleThumbnail($article, $size = "large")
    {
        global $DBLIB, $CONFIG;
        if ($article == null) return false;
        $DBLIB->where("articles_id", $this->sanitizeString($article));
        $thumb = $DBLIB->getone("articles", ["articles_thumbnail"]);
        if (!$thumb or $thumb["articles_thumbnail"] == null) return false;
        if (is_numeric($thumb["articles_thumbnail"])) return $this->s3URL($thumb["articles_thumbnail"], $size);
        else return $CONFIG['ARCHIVEFILESTOREURL'] . "/articleImages/" . rawurlencode($thumb["articles_thumbnail"]);
    }

    function s3URL($fileid, $size = false, $forceDownload = false, $expire = '+1 minute', $returnArray = false) {
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
        $DBLIB->where("s3files_meta_physicallyStored", 1); //If we've lost the file or deleted it we can't actually let them download it
        $file = $DBLIB->getone("s3files");
        if (!$file) return false;
        if ($file['s3files_meta_public'] == 1) {
            $returnFilePath = $file['s3files_cdn_endpoint'] . "/" . $file['s3files_path'] . "/" . rawurlencode($file['s3files_filename']);
            if ($file['s3files_compressed'] == 1) {
                //If we have a compressed version of this file opt to use it!
                switch ($size) {
                    case "tiny":
                        $returnFilePath .= '_tiny';
                        break;
                    case "small":
                        $returnFilePath .= '_small';
                        break;
                    case "medium":
                        $returnFilePath .= '_medium';
                        break;
                    case "large":
                        $returnFilePath .= '_large';
                        break;
                    default:
                        $returnFilePath .= '_comp'; //TODO evaluate whether this is a good idea - or whether in some cases it's better to serve a fully uncompressed version
                        break;
                }
            }
            $presignedUrl = $returnFilePath . "." . rawurlencode($file['s3files_extension']);
        } else {
            $s3Client = new Aws\S3\S3Client([
                'region' => $file["s3files_region"],
                'endpoint' => "https://" . $file["s3files_endpoint"],
                'version' => 'latest',
                'credentials' => array(
                    'key' => $CONFIG['AWS']['KEY'],
                    'secret' => $CONFIG['AWS']['SECRET'],
                )
            ]);

            $file['expiry'] = $expire;


            switch ($file['s3files_meta_type']) {
                case 0:
                    //Unknown
                    break;
                case 1:
                    //This is a user thumbnail
                    break;
                case 2:
                    //Article image
                    break;
                case 3:
                    //Article Thumbnail
                    break;
                case 4:
                    //Edition thumbnail
                    break;
                case 5:
                    //Edition pdf uncompressed original
                    break;
                case 6:
                    //Edition pdf
                    break;
                case 9:
                    //Library Image
                    break;
                default:
                    //There are no specific requirements for this file so not to worry.
            }

            $parameters = [
                'Bucket' => $file['s3files_bucket'],
                'Key' => $file['s3files_path'] . "/" . $file['s3files_filename'] . '.' . $file['s3files_extension'],
            ];
            if ($forceDownload) $parameters['ResponseContentDisposition'] = 'attachment; filename="' . $CONFIG['PROJECT_NAME'] . ' ' . $file['s3files_filename'] . '.' . $file['s3files_extension'] . '"';
            $cmd = $s3Client->getCommand('GetObject', $parameters);
            $request = $s3Client->createPresignedRequest($cmd, $file['expiry']);
            $presignedUrl = (string)$request->getUri();

            $presignedUrl = $file['s3files_cdn_endpoint'] . explode($file["s3files_endpoint"],$presignedUrl)[1]; //Remove the endpoint itself from the url in order to set a new one
        }
        if ($returnArray) return ["url" => $presignedUrl, "data" => $file];
        else return $presignedUrl;
    }

    public function cacheClearCategory($categoryid)
    {
        global $DBLIB, $CONFIG;
        if (!$categoryid) return false;

        $DBLIB->where("categories_id", $this->sanitizeString($categoryid));
        $category = $DBLIB->getOne("categories", ["categories_name", "categories_nestUnder"]);
        if (!$category) return false;
        $url = $CONFIG['ROOTFRONTENDURL'] . '/' . $category['categories_name'];
        if ($category['categories_nestUnder'] != null) {
            $DBLIB->where("categories_id", $category['categories_nestUnder']);
            $category = $DBLIB->getone("categories", ["categories_name", "categories_nestUnder"]);
            $url .= '/' . $category['categories_name'];
            if ($category['categories_nestUnder'] != null) {
                $DBLIB->where("categories_id", $category['categories_nestUnder']);
                $category = $DBLIB->getone("categories", ["categories_name"]);
                $url .= '/' . $category['categories_name'];
            }
        }

        return $this->cacheClear($url . "/");
    }

    public function cacheClear($URL, $all = false)
    {
        global $AUTH;

        if (!$this->cloudflare) $this->cloudflareInit();

        if (isset($AUTH->data['users_userid'])) $userid = $AUTH->data['users_userid'];
        else $userid = null;

        if ($URL == false and $all == true) {
            try {
                if ($this->cloudflare['zones']->cachePurgeEverything($this->cloudflare['zoneid'])) {
                    $this->auditLog("CACHECLEARALL", null, "Entire site", $userid);
                    return true;
                } else return false;
            } catch (Exception $e) {
                return false;
            }
        } else {
            if ($URL != rtrim($URL, "/")) $URL = [$URL, rtrim($URL, "/")]; //Also purge without a leading slash
            else $URL = [$URL];

            try {
                if ($this->cloudflare['zones']->cachePurge($this->cloudflare['zoneid'], $URL)) {
                    //$this->auditLog("CACHECLEAR", null, json_encode($URL), $userid); - Don't audit log as it fills the table very quickly
                    return true;
                } else return false;
            } catch (Exception $e) {
                return false;
            }
        }
    }

    private function cloudflareInit()
    {
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

    function auditLog($actionType = null, $table = null, $revelantData = null, $userid = null, $useridTo = null)
    { //Keep an audit trail of actions - $userid is this user, and $useridTo is who this action was done to if it was at all
        global $DBLIB;
        $data = [
            "auditLog_actionType" => $this->sanitizeString($actionType),
            "auditLog_actionTable" => $this->sanitizeString($table),
            "auditLog_actionData" => $this->sanitizeString($revelantData),
            "auditLog_timestamp" => date("Y-m-d H:i:s")
        ];
        if ($userid > 0) $data["users_userid"] = $this->sanitizeString($userid);
        if ($useridTo > 0) $data["auditLog_actionUserid"] = $this->sanitizeString($useridTo);

        if ($DBLIB->insert("auditLog", $data)) return true;
        else return false;
    }

    public function categoryURL($categoryid) {
        global $DBLIB, $bCMS;
        $DBLIB->where("categories_id", $bCMS->sanitizeString($categoryid));
        $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
        if ($category["categories_nestUnder"] == null) return $category["categories_name"];
        $url = $category["categories_name"];

        $DBLIB->where("categories_id", $category['categories_nestUnder']);
        $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
        if ($category["categories_nestUnder"] == null) return $category["categories_name"] . "/" . $url;
        $url = $category["categories_name"] . "/" . $url;

        $DBLIB->where("categories_id", $category['categories_nestUnder']);
        $category = $DBLIB->getone("categories",["categories_name","categories_nestUnder"]);
        return $category["categories_name"] . "/" . $url;
    }

    public function yusuNotify($articleid)
    {
        global $DBLIB, $CONFIG;
        $DBLIB->where("articles.articles_id", $this->sanitizeString($articleid));
        $DBLIB->where("articles_mediaCharterDone", 0);
        $DBLIB->where("articles_showInSearch", 1);
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $article = $DBLIB->getone("articles", ["articles.articles_id", "articles_categories", "articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline", "articlesDrafts.articlesDrafts_excerpt"]);
        if (!$article) return false;

        //YUSU Notification email html
        $html = "You are receiving this email as a notification of a new article being uploaded to the Nouse.co.uk website in compliance with section 5.3 of the YUSU Media Charter.<br/><br/>";
        if (strtotime($article["articles_published"]) > time()) $html .= "This article will be published at " . $article["articles_published"] . " GMT and this email is an advanced notification of publication. No further notifications will follow and this article will be automatically published.<br/><br/>";
        $html .= "<b>Headline: </b>" . $article['articlesDrafts_headline'] . "<br/>";
        $html .= "<b>Excerpt: </b>" . $article['articlesDrafts_excerpt'] . "<br/>";
        if (strtotime($article["articles_published"]) > time()) $html .= "This article hasn't been published yet, so it's not accessible on our website. A secret link has been generated for you to preview it, but please don't share this externally: <a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "?key=" . md5($article['articles_id']) . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "</a>";
        else $html .= "<b>Link to article: </b><a href='" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "'>" . $CONFIG['ROOTFRONTENDURL'] . "/" . date("Y/m/d", strtotime($article['articles_published'])) . "/" . $article['articles_slug'] . "</a>";
        $html .= "<br/><br/><br/>If you have any questions about this notification please do not hesitate to contact us on support@nouse.co.uk.<br/>For queries relating to this article itself (for example concerns about its content) please contact editor@nouse.co.uk. <br/><br/><br/>Nouse Technical Team<br/><i>" . gethostname() . " (compliance tracked at  " . date("Y-m-d H:i:s") . " UTC)</i>";
        if (count(array_intersect([2, 6, 7], explode(",", $article['articles_categories']))) > 0) {
            if (sendemail("media-charter-notifications@nouse.co.uk", "New article on Nouse.co.uk", $html)) {
                $DBLIB->where("articles_id", $article['articles_id']);
                $DBLIB->update("articles", ["articles_mediaCharterDone" => 1]);
                return true;
            } else return false;
        } else {
            //We don't need to tell YUSU about this as it's not in categories 1,6 or 7
            $DBLIB->where("articles_id", $article['articles_id']);
            $DBLIB->update("articles", ["articles_mediaCharterDone" => 2]);
            return true;
        }

    }

    public function postSocial($articleid, $postToFacebook = true, $postToTwitter = true)
    {
        global $DBLIB, $CONFIG;
        $DBLIB->where("articles.articles_id", $this->sanitizeString($articleid));
        $DBLIB->where("articles.articles_showInSearch", 1); //ie those that can actually be shown - no point tweeting a dud link
        $DBLIB->where("articles.articles_published <= '" . date("Y-m-d H:i:s") . "'");
        $DBLIB->join("articlesDrafts", "articles.articles_id=articlesDrafts.articles_id", "LEFT");
        $DBLIB->where("articlesDrafts.articlesDrafts_id = (SELECT articlesDrafts_id FROM articlesDrafts WHERE articlesDrafts.articles_id=articles.articles_id ORDER BY articlesDrafts_timestamp DESC LIMIT 1)");
        $article = $DBLIB->getone("articles", ["articles_socialExcerpt", "articles.articles_socialConfig", "articles.articles_published", "articles.articles_slug", "articlesDrafts.articlesDrafts_headline", "articlesDrafts.articlesDrafts_excerpt"]);
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
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //Supress the output from being dumped
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
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //Supress the output from being dumped
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