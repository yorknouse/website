<?php
require_once __DIR__ . '/../apiHead.php';

header("Content-Type: text/json");

$auth = $GLOBALS['AUTH']->login($_POST['idtoken']);
if ($auth["result"])
    finish(false, ["message"=>$auth['errorMessage']]);

finish(true,null,["return" => $auth['url']]);
