<?php
if (!isset($_GET['url']) or !isset($_GET['overlay'])) exit;
$scaleFactor = 0.35; // Scale factor for size of overlay
$aspectRatio = 1.91; // Aspect ratio for final image for facebook display etc.
$paddingOfOverlay = 50; //How much of a gap between the bottom of the image and the overlay there shold be

/*
 * DOWNLOAD ALL THE IMAGES
 */
$incomingURL = str_replace(" ", "%20", urldecode($_GET['url']));
if (strtolower(pathinfo($incomingURL, PATHINFO_EXTENSION)) == "jpeg" or strtolower(pathinfo($incomingURL, PATHINFO_EXTENSION)) == "jpg") {
    $file = imagecreatefromjpeg($incomingURL);
} elseif (strtolower(pathinfo($incomingURL, PATHINFO_EXTENSION)) == "png") {
    $file = imagecreatefrompng($incomingURL);
} else header('Location: ' . $incomingURL);
if (!$file) header('Location: ' . $incomingURL);

$incomingOverlay = str_replace(" ", "%20", urldecode($_GET['overlay']));
$overlay = imagecreatefrompng($incomingOverlay);
if (!$overlay) header('Location: ' . $incomingURL);

list($imageWidth, $imageHeight) = getimagesize($incomingURL);
list($overlayWidth, $overlayHeight) = getimagesize($incomingOverlay);
if ($imageWidth < 1 or $imageHeight < 1 or $overlayWidth < 1 or $overlayHeight < 1) header('Location: ' . $incomingURL);

/*
 * CROP THE MAIN IMAGE TO THE FACEBOOK ASPECT RATIO
 */
//Resize the image to a sensible aspect ratio for facebook by cropping it from the centre
if (($imageHeight*$aspectRatio)>$imageWidth) {
    //The image is taller than it is wide
    $imageNewWidth = $imageWidth; //Let's keep the width the same
    $imageNewHeight = floor($imageNewWidth*(1/$aspectRatio)); //But we'll tweak the height
    $posX = 0;
    $posY = round($imageHeight / 2) - round($imageNewHeight / 2);
} else {
    //The image is wider than it is tall
    $imageNewWidth = floor($imageHeight*$aspectRatio); //Let's keep the width the same
    $imageNewHeight = $imageHeight; //But we'll reduce the height
    $posY = 0;
    $posX = round($imageWidth / 2) - round($imageNewWidth / 2);
}

/*
 * RESIZE THE OVERLAY
 */
//Make the overlay smaller than the image
$overlayNewWidth = $imageNewWidth*$scaleFactor;
$overlayNewHeight = ($imageNewWidth/$overlayWidth)*$overlayHeight*$scaleFactor;

/*
 * RENDER THE OUTPUT
 */
header('Content-type: image/jpeg');
$out = imagecreatetruecolor($imageNewWidth, $imageNewHeight);
imagecopyresampled($out, $file, 0,0,$posX,$posY, $imageWidth, $imageHeight, $imageWidth, $imageHeight);
imagecopyresampled($out, $overlay, $imageNewWidth-($overlayNewWidth-1), ($imageNewHeight-($overlayNewHeight-1))-$paddingOfOverlay, 0, 0, $overlayNewWidth, $overlayNewHeight, $overlayWidth, $overlayHeight);
imagejpeg($out, null, 90);
/*
 * CLEAR OUT SOME MEMORY
 */
imagedestroy($file);
imagedestroy($overlay);
imagedestroy($out);