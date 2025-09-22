import prisma from "@/lib/prisma";

/**
 * Retrieves a file from s3 (actually backblaze)
 * @param {number} fileId The file id.
 * @param {"tiny" | "small" | "medium" | "large" | false} [size] File size.
 * @returns {Promise<string>} Promise object represents the file URL.
 * @throws Will throw an error if it cannot find the file by id.
 */
const s3URL = async (
  fileId: number,
  size: "tiny" | "small" | "medium" | "large" | false = false,
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    prisma.s3files
      .findUnique({
        where: {
          s3files_id: fileId,
        },
      })
      .then((s3File) => {
        if (s3File) {
          let fileUrl = `${s3File.s3files_cdn_endpoint}/${
            s3File.s3files_path
          }/${encodeURIComponent(s3File.s3files_filename)}`;

          if (size) {
            fileUrl += `_${size}`;
          }

          fileUrl += `.${s3File.s3files_extension}`;

          resolve(fileUrl);
        }

        reject(new Error("Could not fetch s3 file: " + fileId));
      });
  });
};

export { s3URL };
