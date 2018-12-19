<?php
function watermark($image){
    $overlay = 'temp/overlay.png';
    $opacity = "100";
    if (!file_exists($image)) {
        die("Image does not exist.");
    }
    // Set offset from bottom-right corner
    $w_offset = 0;
    $h_offset = 100;
    $extension = strtolower(substr($image, strrpos($image, ".") + 1));
    // Load image from file
    switch ($extension)
    {
        case 'jpg':
            $background = imagecreatefromjpeg($image);
            break;
        case 'jpeg':
            $background = imagecreatefromjpeg($image);
            break;
        case 'png':
            $background = imagecreatefrompng($image);
            break;
        case 'gif':
            $background = imagecreatefromgif($image);
            break;
        default:
            die("Image is of unsupported type.");
    }
    // Find base image size
    $swidth = imagesx($background);
    $sheight = imagesy($background);
    // Turn on alpha blending
    imagealphablending($background, true);
    // Create overlay image
    //$overlay = imagecreatefrompng($overlay);
    // Get the size of overlay
    //$owidth = imagesx($overlay);
    //$oheight = imagesy($overlay);

    $photo = imagecreatefromjpeg($image);
    $watermark = imagecreatefrompng($overlay);
    // This is the key. Without ImageAlphaBlending on, the PNG won't render correctly.
    imagealphablending($photo, true);
    // Copy the watermark onto the master, $offset px from the bottom right corner.
    $offset = 10;
    imagecopy($photo, $watermark, imagesx($photo) - imagesx($watermark) - $offset, imagesy($photo) - imagesy($watermark) - $offset, 0, 0, imagesx($watermark), imagesy($watermark));
    // Output to the browser
    imagejpeg($photo,$image);
    // Overlay watermark
    // Destroy the images
    imagedestroy($photo);
    imagedestroy($watermark);
}
watermark("temp/photo.jpg");
