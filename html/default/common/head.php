<?php
global $CONFIG;

use Twig\Environment;
use Twig\Extension\DebugExtension;
use Twig\Loader\FilesystemLoader;

require_once __DIR__ . '/../../common/coreHead.php';

$PAGEDATA = array('CONFIG' => $CONFIG, 'BODY' => true);
//TWIG
//Twig_Autoloader::register();
$TWIGLOADER = new FilesystemLoader(__DIR__ . '/../');
$TWIG = new Environment($TWIGLOADER, array(
    'debug' => true
));
$TWIG->addExtension(new DebugExtension());