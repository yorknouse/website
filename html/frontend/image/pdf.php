<?php
require_once __DIR__ . '/../common/head.php';
/*
 * File interface for Amazon AWS S3 - but which will stream a PDF through to the browser
 *  Parameters
 *      f (required) - the file id as specified in the database
 *
 * The big idea here is to try and cheat around CORS issues
 */

$file = $bCMS->s3URL($_GET['f'],false,false,"+5 minutes",true);
if (!$file or $file['data']['s3files_extension'] != "pdf") die("404 image not found");

$data = file_get_contents($file['url']);
if ($data !== false) {
    header("Content-type: application/pdf");
    header("Content-disposition: inline;filename=" . $file['data']['s3files_filename'] . ".pdf");
    die($data);
} else die("File download error");

