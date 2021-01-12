from PIL import Image
import os.path
import boto3
import pymysql

def compressImage(file_name):
    filename, file_extension = os.path.splitext(file_name)
    images = {};

    try:
        firstImage = Image.open("image"+file_extension)
    except:
        return False

    try:
        tiny = firstImage.copy()
        tiny.thumbnail((100, 100), resample=4)
        tiny.save("tiny" + file_extension, optimize=True, quality=65)
        images.update({"tiny": filename + "_tiny" + file_extension})
    except:
        pass
    try:
        small = firstImage.copy()
        small.thumbnail([400, 400], resample=4)
        small.save("small" + file_extension, optimize=True, quality=65)
        images.update({"small": filename + "_small" + file_extension})
    except:
        pass
    try:
        medium = firstImage.copy()
        medium.thumbnail([800, 800], resample=4)
        medium.save("medium" + file_extension, optimize=True, quality=65)
        images.update({"medium": filename + "_medium" + file_extension})
    except:
        pass
    try:
        large = firstImage.copy()
        large.thumbnail([1500, 1500], resample=4)
        large.save("large" + file_extension, optimize=True, quality=65)
        images.update({"large": filename + "_large" + file_extension})
    except:
        pass
    try:
        firstImage.save("comp" + file_extension, optimize=True, quality=65)
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

print("[INFO] Get a file to compress and start compressing it")
dbCursor.execute(
    "SELECT s3files_bucket,s3files_path,s3files_filename,s3files_extension,s3files_id FROM s3files WHERE s3files_compressed = 0 AND s3files_bucket = '" + os.environ['AWS_BUCKET'] + "' AND s3files_extension IN ('jpg','JPG','jpeg','JPEG','png','PNG') AND s3files_meta_deleteOn IS NULL AND s3files_meta_physicallyStored = 1")  # Select everything that needs compressing
listOfFiles = dbCursor.fetchall()

for file in listOfFiles:
    fileKey = str(file['s3files_path']) + "/" + str(file['s3files_filename']) + "." + str(file['s3files_extension'])
    try:
        s3client.download_file(str(file['s3files_bucket']), fileKey, "image."+str(file['s3files_extension']))
    except:
        print("[ERROR] File not found")
        continue
    comp = compressImage(fileKey)
    if comp and len(comp) > 4:
        os.remove("image."+str(file['s3files_extension']))
        success = True
        for type,upload in comp.items():
            try:
                s3client.upload_file(type+"."+str(file['s3files_extension']), str(file['s3files_bucket']), upload)
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
        print("[ERROR] Compression Failed")
print("[INFO] Completed Script")