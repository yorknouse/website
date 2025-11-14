<?php
global $CONFIG, $bCMS;
require_once __DIR__ . '/common/headSecure.php';
require_once __DIR__ . '/../common/config.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit("No ID specified");
}
if (!isset($_GET['slug'])) {
    http_response_code(400);
    exit("No slug specified");
}
if (!isset($_GET['published'])) {
    http_response_code(400);
    exit("No published date specified");
}
/** @var string $articleId */
$articleId = $bCMS->sanitiseString($_GET['id']);
if (!ctype_digit($articleId)) {
    http_response_code(400);
    exit("Invalid article ID");
}
$slug = $bCMS->sanitiseString($_GET['slug']);
$published = $bCMS->sanitiseString($_GET['published']);

try {
    $dateObj = DateTime::createFromFormat('Y.m.d', $published);
    $errors = DateTime::getLastErrors();

    if (!$dateObj || $errors['warning_count'] > 0 || $errors['error_count'] > 0) {
        http_response_code(400);
        exit("Invalid published date format");
    }

    $convertedDate = $dateObj->format('Y/m/d'); // "2025/11/06"
} catch (Exception $e) {
    http_response_code(400);
    exit("Invalid published date format");
}

$token = $CONFIG->DRAFT_VIEW_TOKEN;
if (!$token) {
    http_response_code(500);
    exit("No token present");
}

setcookie(
    "previewToken",
    $token,
    [
        "expires"  => time() + 3600,
        "path"     => "/",
        "domain"   => ".nouse.co.uk",
        "secure"   => true,
        "httponly" => true,
        "samesite" => "None",
    ]
);

// optional legacy params still included for backwards compat
$hash = md5($articleId);
header("Location: {$CONFIG->ROOTFRONTENDURL}/articles/" .
    $convertedDate . "/" .
    $slug .
    "?preview=true&hash={$hash}");
exit;
