import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";

export class S3FileNotFoundError extends Error {
  constructor(fileId: number) {
    super(`S3 file not found: ${fileId}`);
    this.name = "S3FileNotFoundError";
  }
}

export class S3FileInternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S3FileInternalError";
  }
}

/**
 * Retrieves a file from s3 (actually backblaze)
 * @param {number} fileId The file id.
 * @param {"tiny" | "small" | "medium" | "large" | "comp" | false} [size] File size.
 * @returns {Promise<string>} Promise object represents the file URL.
 * @throws S3FileNotFoundError if it cannot find the file by id.
 * @throws S3FileInternalError if there is another error.
 */
export async function s3URL(
  fileId: number,
  size: "tiny" | "small" | "medium" | "large" | "comp" | false = false,
): Promise<string> {
  const key = `s3file:${fileId}:${size || "original"}`;

  try {
    return await cache<string>(key, 2592000, async () => {
      const s3File = await prisma.s3files.findUnique({
        where: { s3files_id: fileId },
      });

      if (!s3File) {
        throw new S3FileNotFoundError(fileId);
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
  } catch (err) {
    // Preserve "not found"
    if (err instanceof S3FileNotFoundError) {
      throw err;
    }

    // Wrap everything else
    throw new S3FileInternalError(
      err instanceof Error ? err.message : "Unknown S3 error",
    );
  }
}
