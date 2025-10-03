<?php
require_once __DIR__ . '/../common/head.php';

$CLIENTS = [
    "GRAFANA" => [
        "secret"=>"LD50Z6QKZXLFAPKQJ136ZLNZBFF38Y2C2ZGKKNI4",
        "permission"=> 57,
        "name" => "Grafana"
    ]
];

function base64UrlEncode($text) {
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

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}