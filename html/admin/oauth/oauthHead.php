<?php
require_once __DIR__ . '/../common/head.php';

$CLIENTS = [
    "CADDY" => [
        "autoApprove" => true,
        "secret"=>"bqxDRS7h8uAgXc"
    ],
    "GRAFANA" => [
        "autoApprove" => true,
        "secret"=>"7kQ4ybmDTm9pEg"
    ]
];
function base64UrlEncode($text)
{
    return str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($text)
    );
}
function generateJWT($payload, $secret) {
    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'HS256'
    ]);

    $payload = json_encode($payload);

    $base64UrlHeader = base64UrlEncode($header);

    $base64UrlPayload = base64UrlEncode($payload);

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);

    $base64UrlSignature = base64UrlEncode($signature);

    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    return $jwt;
}