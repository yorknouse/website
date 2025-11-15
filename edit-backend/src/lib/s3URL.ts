import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";

/**
 * Retrieves a file from s3 (actually backblaze)
 * @param {number} fileId The file id.
 * @param {"tiny" | "small" | "medium" | "large" | "comp" | false} [size] File size.
 * @returns {Promise<string>} Promise object represents the file URL.
 * @throws Error Will throw an error if it cannot find the file by id.
 */
export async function s3URL(
  fileId: number,
  size: "tiny" | "small" | "medium" | "large" | "comp" | false = false,
): Promise<string> {
  const key = `s3file:${fileId}:${size || "original"}`;

  return cache<string>(key, 2592000, async () => {
    const s3File = await prisma.s3files.findUnique({
      where: { s3files_id: fileId },
    });

    if (!s3File) {
      throw new Error("Could not fetch s3 file: " + fileId);
    }

    let fileUrl = `${s3File.s3files_cdn_endpoint}/${s3File.s3files_path}/${encodeURIComponent(
      s3File.s3files_filename,
    )}`;

    if (size) {
      fileUrl += `_${size}`;
    }

    fileUrl += `.${s3File.s3files_extension}`;

    return fileUrl;
  });
}
