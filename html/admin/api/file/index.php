<?php
global $bCMS;
require_once __DIR__ . '/../apiHeadSecure.php';
/*
 * File interface for Amazon AWS S3.
 *  Parameters
 *      f (required) - the file id as specified in the database
 *      s (filesize) - false to get the original - available is "tiny" (50px) "small" (100px) "medium" (500px) "large" (1000px)
 *      d (optional, default false) - should a download be forced or should it be displayed in the browser? (if set it will download)
 *      r (optional, default false) - should the url be returned by the script as plain text or a redirect triggered? (if set it will return it)
 *      e (optional, default 1 minute) - when should the link expire? Must be a string describing how long in words basically. If this file type has security features then it will default to 1 minute.
 */

$file = $bCMS->s3URL($_GET['f'], ($_GET['s'] ?? null), (isset($_GET['d'])),($_GET['e'] ?? null));
if (!$file) die("404 file not found");

if (!isset($_GET['r']))
    die($file);

header("Location: " . $file);
die();
