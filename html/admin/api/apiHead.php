<?php
header('Content-type: application/json');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
require_once __DIR__ . '/../common/head.php';
ini_set('display_errors', 0); //Errors break the output

function finish($result = false, $error = ["code" => null, "message"=> null], $response = []) {
    $dataReturn = ["result" => $result];
    if ($error) $dataReturn["error"] = $error;
    else $dataReturn["response"] = $response;

    die(json_encode($dataReturn));
}