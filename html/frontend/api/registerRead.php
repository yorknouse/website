<?php
require_once __DIR__ . '/../../common/coreHead.php';

if (!isset($_POST['articleId'])) {
    die(1);
}

$articleId = $bCMS->sanitizeString($_POST['articleId']);

// Insert article read
$readData = array(
    'articles_id' => $articleId
);

$id = $DBLIB->insert('articlesReads', $readData);

if (!$id) {
    die(1);
}

die();
