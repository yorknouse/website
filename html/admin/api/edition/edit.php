<?php
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(51) or !isset($_POST['editionid']) or !is_numeric($_POST['editionid'])) die("404");

$DBLIB->where ('editions_id', $bCMS->sanitizeString($_POST['editionid']));
$edition = $DBLIB->getOne("editions");
if (!$edition) die("404");

$newData = [];
$newData["editions_name"] = $bCMS->cleanString($_POST["name"]);
$newData["editions_excerpt"] = $bCMS->cleanString($_POST["excerpt"]);
$newData["editions_printNumber"] = (is_numeric($_POST['printnumber']) ? $_POST['printnumber'] : null);
$newData["editions_published"] = date("Y-m-d H:i:s", strtotime($bCMS->cleanString($_POST["published"])));
$newData["editions_show"] = ($_POST["status"] > 1 ? '1' : 0);
$newData['editions_showHome'] = ($_POST["status"] > 2 ? '1' : 0);
$newData["editions_pdf"] = ($_POST["pdfid"] != null ? $_POST["pdfid"] : null);
$newData["editions_thumbnail"] = ($_POST["thumbnail"] != null ? $_POST["thumbnail"] : null);
$newData["editions_featured"] = implode(",", explode(",", $bCMS->sanitizeString($_POST['featured'])));
$DBLIB->where ('editions_id', $edition['editions_id']);
if ($DBLIB->update ('editions', $newData)) {
    $bCMS->auditLog("EDIT", "editions", $edition['editions_id'], $AUTH->data['users_userid']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/edition/" . $edition['editions_slug']);
    $bCMS->cacheClear($CONFIG['ROOTFRONTENDURL']);
    finish(true);
} else finish(false, ["code" => null, "message" => "Edit error"]);
