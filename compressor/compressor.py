from PIL import Image
import functools
import os.path
import boto3
import pymysql
import mimetypes


def image_transpose_exif(im): #To preserve orientation
    """
    Apply Image.transpose to ensure 0th row of pixels is at the visual
    top of the image, and 0th column is the visual left-hand side.
    Return the original image if unable to determine the orientation.

    As per CIPA DC-008-2012, the orientation field contains an integer,
    1 through 8. Other values are reserved.

    Parameters
    ----------
    im: PIL.Image
       The image to be rotated.
    """

    exif_orientation_tag = 0x0112
    exif_transpose_sequences = [                   # Val  0th row  0th col
        [],                                        #  0    (reserved)
        [],                                        #  1   top      left
        [Image.FLIP_LEFT_RIGHT],                   #  2   top      right
        [Image.ROTATE_180],                        #  3   bottom   right
        [Image.FLIP_TOP_BOTTOM],                   #  4   bottom   left
        [Image.FLIP_LEFT_RIGHT, Image.ROTATE_90],  #  5   left     top
        [Image.ROTATE_270],                        #  6   right    top
        [Image.FLIP_TOP_BOTTOM, Image.ROTATE_90],  #  7   right    bottom
        [Image.ROTATE_90],                         #  8   left     bottom
    ]

    try:
        seq = exif_transpose_sequences[im._getexif()[exif_orientation_tag]]
        trans = type(im).transpose
    except Exception:
        return im
    else:
        return functools.reduce(trans, seq, im)
def compressImage(file_name):
    filename, file_extension = os.path.splitext(file_name)
    images = {};

    try:
        firstImage = Image.open("image"+file_extension)
        rotatedImage = image_transpose_exif(firstImage)
    except Exception as e:
        return False

    try:
        tiny = rotatedImage.copy()
        tiny.thumbnail((100, 100), resample=4)
        tiny.save("tiny" + file_extension, optimize=True, quality=65)
        images.update({"tiny": filename + "_tiny" + file_extension})
    except:
        pass
    try:
        small = rotatedImage.copy()
        small.thumbnail([400, 400], resample=4)
        small.save("small" + file_extension, optimize=True, quality=65)
        images.update({"small": filename + "_small" + file_extension})
    except:
        pass
    try:
        medium = rotatedImage.copy()
        medium.thumbnail([800, 800], resample=4)
        medium.save("medium" + file_extension, optimize=True, quality=65)
        images.update({"medium": filename + "_medium" + file_extension})
    except:
        pass
    try:
        large = rotatedImage.copy()
        large.thumbnail([1500, 1500], resample=4)
        large.save("large" + file_extension, optimize=True, quality=65)
        images.update({"large": filename + "_large" + file_extension})
    except:
        pass
    try:
        rotatedImage.save("comp" + file_extension, optimize=True, quality=65)
        images.update({"comp": filename + "_comp" + file_extension})
    except:
        pass

    return images



print("[INFO] Starting")

'''
    Establish a connection to the Database
'''

dbConnection = pymysql.connect(
    host=os.environ.get('MYSQL_HOSTNAME'),
    user=os.environ.get('MYSQL_USER'),
    passwd=os.environ.get('MYSQL_PASSWORD'),
    database=os.environ.get('MYSQL_DATABASE')
)

dbCursor = dbConnection.cursor(pymysql.cursors.DictCursor)
print("[INFO] DB Connected")

'''
    Establish a S3 connection
'''
s3client = boto3.client('s3',
                        endpoint_url=os.environ['AWS_ENDPOINT_URL'],
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )

print("[INFO] S3 Connected")

print("[INFO] Get files to compress")
dbCursor.execute(
    "SELECT s3files_bucket,s3files_path,s3files_filename,s3files_extension,s3files_id,s3files_meta_public FROM s3files WHERE (s3files_compressed = 0 AND s3files_bucket = '" + os.environ['AWS_BUCKET'] + "' AND s3files_extension IN ('jpg','JPG','jpeg','JPEG','png','PNG') AND s3files_meta_deleteOn IS NULL AND s3files_meta_physicallyStored = 1) ORDER BY s3files_id ASC")  # Select everything that needs compressing
listOfFiles = dbCursor.fetchall()
total = len(listOfFiles)
print("[INFO] Got file list - " + str(total))
counter = 0
for file in listOfFiles:
    fileKey = str(file['s3files_path']) + "/" + str(file['s3files_filename']) + "." + str(file['s3files_extension'])
    fileKey = fileKey.replace("\\", "")
    print("[INFO] Starting " + str((counter/total)*100) + "%: " + str(fileKey) + " | " + str(file['s3files_id']))
    counter += 1
    try:
        s3client.download_file(str(file['s3files_bucket']), fileKey, "image."+str(file['s3files_extension']))
    except:
        print("[ERROR] File not found")
        continue
    comp = compressImage(fileKey)
    if comp and len(comp) > 4:
        mimetype, _ = mimetypes.guess_type("image."+str(file['s3files_extension']))
        if mimetype is None:
            mimetype = "binary/octet-stream"
        os.remove("image."+str(file['s3files_extension']))
        extraArgs = {'ContentType': mimetype}
        if file['s3files_meta_public'] == 1:
            extraArgs.update({'ACL':'public-read'})
        success = True
        for type,upload in comp.items():
            try:
                s3client.upload_file(type+"."+str(file['s3files_extension']), str(file['s3files_bucket']), upload,ExtraArgs=extraArgs)
            except boto3.exceptions.S3UploadFailedError:
                print("[ERROR] Failed to upload comp file")
                success = False
            os.remove(type+"."+str(file['s3files_extension']))
        if success:
            dbCursor.execute("UPDATE s3files SET s3files_compressed = 1 WHERE s3files_id = '" + str(file['s3files_id']) + "'")
            dbConnection.commit()
            print("[INFO] Compressed and Uploaded File")
        else:
            print("[ERROR] Failed to compress and upload file")
    else:
        print(comp)
        print("[ERROR] Compression Failed")
print("[INFO] Completed Script")