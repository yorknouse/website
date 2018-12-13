<?php
require_once __DIR__ . '/apiHead.php';
//Log an article as having been read
if (!isset($_POST['articleid'])) finish(false, ["code" => "PARAM", "message"=> "No article id set"]);

$DBLIB->rawQuery("UPDATE articles SET articles_lifetimeViews = articles_lifetimeViews +1 WHERE articles_id='". $bCMS->sanitizeString($_POST['articleid']) . "'");

if ($DBLIB->insert("articlesReads", ["articles_id" => $bCMS->sanitizeString($_POST['articleid']), "articlesReads_timestamp" => date('Y-m-d G:i:s')])) finish(true);
else finish(false, ["code" => "DB", "message"=> "Could not insert"]);
