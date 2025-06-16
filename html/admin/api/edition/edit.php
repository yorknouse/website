<?php
global $AUTH, $DBLIB, $bCMS, $CONFIG;
require_once __DIR__ . '/../apiHeadSecure.php';
header("Content-Type: text/json");

if (!$AUTH->permissionCheck(51) or !isset($_POST['editionid']) or !is_numeric($_POST['editionid'])) die("404");

$DBLIB->where('editions_id', $bCMS->sanitizeString($_POST['editionid']));
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
$newData["editions_type"] = $_POST['type'];
$newData["editions_pdfOriginal"] = ($_POST["pdforigid"] != null ? $_POST["pdforigid"] : null);
$newData["editions_thumbnail"] = ($_POST["thumbnail"] != null ? $_POST["thumbnail"] : null);
$newData["editions_headerImage"] = ($_POST["header"] != null ? $_POST["header"] : null);
if ($_POST['featuredHighlights'] != "{}") {
    $highlights = json_decode ($_POST['featuredHighlights'],true);
    foreach ($highlights['sections'] as $sectionKey => $section) {
        $highlights['sections'][$sectionKey]['name'] = $bCMS->cleanString($section['name']);
        foreach ($section['customBoxes'] as $boxKey => $box) {
            $highlights['sections'][$sectionKey]['customBoxes'][$boxKey]['title'] = $bCMS->cleanString($box['title']);
            $highlights['sections'][$sectionKey]['customBoxes'][$boxKey]['text'] = $bCMS->cleanString($box['text']);
        }
        $highlights['sections'][$sectionKey]['customBoxHeader']['title'] = $bCMS->cleanString($section['customBoxHeader']['title']);
        $highlights['sections'][$sectionKey]['customBoxHeader']['text'] = $bCMS->cleanString($section['customBoxHeader']['text']);
    }
    $newData["editions_featuredHighlights"] = json_encode($highlights);
} else $newData["editions_featuredHighlights"] = "{}";

$DBLIB->where ('editions_id', $edition['editions_id']);
if (!$DBLIB->update ('editions', $newData))
    finish(false, ["code" => null, "message" => "Edit error"]);

$bCMS->auditLog("EDIT", "editions", json_encode(["edition" => $edition['editions_id'], "newData" => $newData]), $AUTH->data['users_userid']);
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL'] . "/edition/" . $edition['editions_slug']);
$bCMS->cacheClear($CONFIG['ROOTFRONTENDURL']);
finish(true);
