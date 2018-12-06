<?php
require_once __DIR__ . '/config.php';
//GLOBALS STUFF - DON'T CHANGE
/*
function errorHandler() {
    if (error_get_last() and error_get_last()['type'] == '1') {
        global $CONFIG;
        try {
            header('Location: ' . $CONFIG['ERRORS']['URL'] . '?e=' . urlencode(error_get_last()['message']) . '&return=' . urlencode("http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"));
        } catch (Exception $e) {
            die('<meta http-equiv="refresh" content="0; url=' . $CONFIG['ROOTURL'] . '/error/?e=' . urlencode(error_get_last()['message']) . '&return=' . urlencode("http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]") . '" />');
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

try {
    //session_set_cookie_params(0, '/', '.' . $_SERVER['SERVER_NAME']); //Fix for subdomain bug
    session_start(); //Open up the session
} catch (Exception $e) {
    //Do Nothing
}
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

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.DefinitionImpl', null);
        $config->set('AutoFormat.Linkify', true);
        $purifier = new HTMLPurifier($config);
        $clean_html = $purifier->purify($var);

        $clean_html = urlencode($clean_html); //Url encoding stops \ problems!

        global $CONN;
        return mysqli_real_escape_string($CONN, $clean_html);
    }
    function unCleanString($var) {
        return urldecode($var);
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
}

$GLOBALS['bCMS'] = new bCMS;