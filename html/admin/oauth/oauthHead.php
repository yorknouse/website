<?php
require_once __DIR__ . '/../common/head.php';

$CLIENTS = [
    "GRAFANA" => [
        "secret"=>"LD50Z6QKZXLFAPKQJ136ZLNZBFF38Y2C2ZGKKNI4",
        "permission"=> 57,
        "name" => "Grafana"
    ]
];

function base64UrlEncode(string $text): string {
    return str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($text)
    );
}

function generateJWT(mixed $payload, string $secret): string {
    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'HS256'
    ]);

    if ($header === false) {
        throw new RuntimeException("Failed to encode JWT header");
    }

    $payloadJson = json_encode($payload);
    if ($payloadJson === false) {
        throw new RuntimeException("Failed to encode JWT payload");
    }

    $base64UrlHeader = base64UrlEncode($header);

    $base64UrlPayload = base64UrlEncode($payloadJson);

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);

    $base64UrlSignature = base64UrlEncode($signature);

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}