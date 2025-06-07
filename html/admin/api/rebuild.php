<?php

// Bail if not post request
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(400);
    exit;
}

$ch = curl_init("http://host.docker.internal:9000/hooks/rebuild-webhook");
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$out = curl_exec($ch);

$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
    http_response_code(500);
    exit;
}

http_response_code(200);
exit;
