<?php
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$CONFIG['AWS']['UPLOAD']) die("Uploads disabled");

$fileData = [
    "s3files_extension" => pathinfo($bCMS->sanitizeString($_POST['name']), PATHINFO_EXTENSION),
    "s3files_path" => pathinfo($bCMS->sanitizeString($_POST['name']), PATHINFO_DIRNAME),
    "s3files_region" => $CONFIG['AWS']['DEFAULTUPLOADS']['REGION'],
    "s3files_endpoint" => $CONFIG['AWS']['DEFAULTUPLOADS']['ENDPOINT'],
    "s3files_meta_public" => $bCMS->sanitizeString($_POST['public']),
    "s3files_bucket" => $CONFIG['AWS']['DEFAULTUPLOADS']['BUCKET'],
    "s3files_meta_size" => $bCMS->sanitizeString($_POST['size']),
    "s3files_meta_type" => $bCMS->sanitizeString($_POST['typeid']),
    "s3files_meta_subType" => $bCMS->sanitizeString($_POST['subtype']),
    "users_userid" => $AUTH->data['users_userid'],
    "s3files_original_name" => $bCMS->sanitizeString($_POST['originalName']),
    "s3files_filename" => preg_replace('/\\.[^.\\s]{3,4}$/', '', pathinfo($bCMS->sanitizeString($_POST['name']), PATHINFO_BASENAME)),
    "s3files_cdn_endpoint" => $CONFIG['AWS']['DEFAULTUPLOADS']['CDNEndpoint']
];
$id = $DBLIB->insert("s3files",$fileData);
if (!$id) finish(false, ["code" => null, "message" => "Error"]);
else finish(true, null, ["id" => $id, "resize" => false,"url" => $fileData["s3files_cdn_endpoint"] . "/" . $fileData["s3files_path"] . "/" . $fileData["s3files_filename"] . "." . $fileData["s3files_extension"]]);