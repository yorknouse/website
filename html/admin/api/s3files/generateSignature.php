<?php
require_once __DIR__ . '/../apiHeadSecure.php';

if (!$CONFIG['AWS']['UPLOAD']) die("Uploads disabled");

// USER OPTIONS
// Replace these values with ones appropriate to you.
$accessKeyId = $CONFIG['AWS']['UPLOADER']['KEY'];
$secretKey = $CONFIG['AWS']['UPLOADER']['SECRET'];
$region = $CONFIG['AWS']['DEFAULTUPLOADS']['REGION'];
//$acl = 'public'; // private, public-read, etc
// VARIABLES
// These are used throughout the request.


function generatePolicy($inputObject) {
    global $accessKeyId,$region;
    $shortDate = gmdate('Ymd');
    $credential = $accessKeyId . '/' . $shortDate . '/' . $region . '/s3/aws4_request';
    $policyArray = $inputObject;
    $policyArray['conditions'][] = ['x-amz-algorithm' => 'AWS4-HMAC-SHA256'];
    $policyArray['conditions'][] = ['x-amz-credential' => $credential];
    $policyArray['expiration'] = gmdate('Y-m-d\TH:i:s\Z', time() + 86400);
    return base64_encode(json_encode($policyArray));
}
function signV4RestRequest($policy) {
    global $secretKey,$region;
    $shortDate = gmdate('Ymd');
    $signingKey = hash_hmac('sha256', $shortDate, 'AWS4' . $secretKey, true);
    $signingKey = hash_hmac('sha256', $region, $signingKey, true);
    $signingKey = hash_hmac('sha256', 's3', $signingKey, true);
    $signingKey = hash_hmac('sha256', 'aws4_request', $signingKey, true);
    return hash_hmac('sha256', $policy, $signingKey);
}
function signV4RestRequestRaw($rawStringToSign) {
    global $secretKey,$region;

    $pattern = "/.+\\n.+\\n(\\d+)\/(.+)\/s3\/aws4_request\\n(.+)/s";
    preg_match($pattern, $rawStringToSign, $matches);

    $hashedCanonicalRequest = hash('sha256', $matches[3]);
    $stringToSign = preg_replace("/^(.+)\/s3\/aws4_request\\n.+$/s", '$1/s3/aws4_request'."\n".$hashedCanonicalRequest, $rawStringToSign);

    $dateKey = hash_hmac('sha256', $matches[1], 'AWS4' . $secretKey, true);
    $dateRegionKey = hash_hmac('sha256', $matches[2], $dateKey, true);
    $dateRegionServiceKey = hash_hmac('sha256', 's3', $dateRegionKey, true);
    $signingKey = hash_hmac('sha256', 'aws4_request', $dateRegionServiceKey, true);

    return hash_hmac('sha256', $hashedCanonicalRequest, $signingKey);
}

header('Content-Type: application/json');
$responseBody = file_get_contents('php://input');
$contentAsObject = json_decode($responseBody, true);
$jsonContent = json_encode($contentAsObject);
if (isset($contentAsObject["headers"])) $headersStr = $contentAsObject["headers"];
else $headersStr = false;
if ($headersStr) {
    echo json_encode(["signature"=>signV4RestRequestRaw($headersStr)]);
} else {
    $policyObj = json_decode($jsonContent, true);
    $encodedPolicy = generatePolicy($policyObj);
    $response = array('policy' => $encodedPolicy, 'signature' => signV4RestRequest($encodedPolicy));
    echo json_encode($response);
}
?>
