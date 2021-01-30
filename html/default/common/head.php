<?php
require_once __DIR__ . '/../../common/coreHead.php';

$PAGEDATA = array('CONFIG' => $CONFIG, 'BODY' => true);
//TWIG
//Twig_Autoloader::register();
$TWIGLOADER = new \Twig\Loader\FilesystemLoader(__DIR__ . '/../');
$TWIG = new  \Twig\Environment($TWIGLOADER, array(
    'debug' => true
));
$TWIG->addExtension(new \Twig\Extension\DebugExtension());