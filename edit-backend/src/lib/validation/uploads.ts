import { z } from "zod";

export const updateThumbnailSchema = z
  .object({
    users_userid: z.coerce.number().int(),
    thumbnail: z.coerce.number().int().positive().optional(),
    s3fileId: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.thumbnail ?? data.s3fileId, {
    message: "thumbnail or s3fileId is required",
  });

export const uploadCompleteSchema = z
  .object({
    s3Key: z.string().min(1).max(1024),
    contentType: z.string().min(1),

    size: z.coerce.number().int().positive(),
    public: z.coerce.boolean(),
    typeid: z.coerce.number().int(),
    subtype: z.coerce.number().int().optional(),

    originalName: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const match = data.s3Key.match(
      /^db\/webUploads\/public\/([^/]+)\/.+\.([^.]+)$/,
    );

    if (!match) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid upload path",
      });
      return;
    }

    const targetRaw = match[1];

    // Use the uploadTargetSchema to validate the target
    const parsedTarget = uploadTargetSchema.safeParse(targetRaw);
    if (!parsedTarget.success) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid upload target",
      });
      return;
    }

    const target = parsedTarget.data;

    const extensionRaw = match[2].toLowerCase();

    const parsedExt = uploadExtensionSchema.safeParse(extensionRaw);
    if (!parsedExt.success) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid file extension",
      });
      return;
    }

    const extension = parsedExt.data;

    const allowedMimes = EXTENSION_TO_MIME[extension];

    if (!allowedMimes.includes(data.contentType)) {
      ctx.addIssue({
        code: "custom",
        message: "MIME type does not match file extension",
      });
    }

    const maxSize = getMaxUploadSize(target);
    if (data.size > maxSize) {
      ctx.addIssue({
        code: "custom",
        message: `File exceeds max size for ${target}`,
      });
    }
  });

export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "pdf",
  "jfif",
  "webp",
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const EXTENSION_TO_MIME: Record<AllowedExtension, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  jfif: ["image/jpeg"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
};

export const uploadSignSchema = z
  .object({
    filename: z.string().min(1).max(1024),
    contentType: z.string().min(1).max(255),
  })
  .superRefine((data, ctx) => {
    /**
     * Expected format:
     * db/webUploads/public/{TARGET}/something.ext
     */
    const match = data.filename.match(
      /^db\/webUploads\/public\/([^/]+)\/.+\.([^.]+)$/,
    );

    if (!match) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid upload path",
      });
      return;
    }

    const targetRaw = match[1];

    // Use the uploadTargetSchema to validate the target
    const parsedTarget = uploadTargetSchema.safeParse(targetRaw);
    if (!parsedTarget.success) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid upload target",
      });
      return;
    }

    const extensionRaw = match[2].toLowerCase();

    const parsedExt = uploadExtensionSchema.safeParse(extensionRaw);
    if (!parsedExt.success) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid file extension",
      });
      return;
    }

    const extension = parsedExt.data;

    const allowedMimes = EXTENSION_TO_MIME[extension];

    if (!allowedMimes.includes(data.contentType)) {
      ctx.addIssue({
        code: "custom",
        message: "MIME type does not match file extension",
      });
    }
  });

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export const UPLOAD_TARGETS = {
  "USER-THUMBNAIL": {
    maxSize: 10 * 1024 * 1024,
  },
  "ARTICLE-IMAGE": {
    maxSize: 25 * 1024 * 1024,
  },
  "ARTICLE-THUMBNAIL": {
    maxSize: 10 * 1024 * 1024,
  },
  "EDITION-THUMBNAIL": {
    maxSize: 25 * 1024 * 1024,
  },
  "EDITION-HEADER": {
    maxSize: 50 * 1024 * 1024,
  },
  "EDITION-FEATUREHIGHLIGHTS-HEADER": {
    maxSize: 50 * 1024 * 1024,
  },
  "EDITION-PDF": {
    maxSize: 1024 * 1024 * 1024, // 1 GB
  },
  "LIBRARY-IMAGE": {
    maxSize: 25 * 1024 * 1024,
  },
  ADVERT: {
    maxSize: 1024 * 1024 * 1024,
  },
} as const;

export type UploadTarget = keyof typeof UPLOAD_TARGETS;

export const TYPEID_TO_TARGET: Record<number, UploadTarget | null> = {
  0: null, // Unknown
  1: "USER-THUMBNAIL",
  2: "ARTICLE-IMAGE",
  3: "ARTICLE-THUMBNAIL",
  4: "EDITION-THUMBNAIL",
  5: "EDITION-PDF", // uncompressed original
  6: "EDITION-PDF", // compressed version
  7: "EDITION-FEATUREHIGHLIGHTS-HEADER",
  8: "EDITION-HEADER",
  9: "LIBRARY-IMAGE",
  10: "ADVERT",
};

export const ALLOWED_UPLOAD_TARGETS = Object.keys(
  UPLOAD_TARGETS,
) as UploadTarget[];

export function getMaxUploadSize(target: UploadTarget): number {
  return UPLOAD_TARGETS[target].maxSize;
}

export function generateS3Key(
  typeid: number,
  originalFilename: string,
  isPublic: boolean,
): string {
  const ext = originalFilename.split(".").pop();
  const safe = originalFilename.replace(/[^a-z0-9]/gi, "").toLowerCase();

  return buildS3Key(
    typeid,
    `${Date.now()}-${Math.random().toString().slice(2)}-${safe}.${ext}`,
    isPublic,
  );
}

export function buildS3Key(
  typeid: number,
  filename: string,
  isPublic: boolean,
): string {
  const target = TYPEID_TO_TARGET[typeid];

  if (!target) {
    throw new Error(`Unsupported upload typeid: ${typeid}`);
  }

  const visibility = isPublic ? "public" : "private";

  return `db/webUploads/${visibility}/${target}/${filename}`;
}

export const uploadTargetSchema = z.enum(ALLOWED_UPLOAD_TARGETS);

export const uploadExtensionSchema = z.enum(ALLOWED_EXTENSIONS);

export function validateS3Key(s3Key: string): boolean {
  const regex = /^db\/webUploads\/public\/([A-Z-]+)\/[\d-]+-.+\.[a-zA-Z0-9]+$/;
  return regex.test(s3Key);
}

export function normalizeUploadCompletePayload(input: Record<string, any>) {
  // Determine the filename to use for inferring content type
  const filenameForInference = input.originalName ?? input.s3Key;
  const contentType =
    input.contentType ?? inferContentType(filenameForInference);

  if (!contentType) {
    throw new Error(
      "Unable to infer content type, filename: " + filenameForInference,
    );
  }

  const target = TYPEID_TO_TARGET[Number(input.typeid)];

  if (!target) {
    throw new Error("Unknown upload typeid");
  }

  const isPublic =
    input.public === "1" || input.public === 1 || input.public === true;

  const s3Key = input.s3Key;

  if (!validateS3Key(s3Key)) {
    throw new Error("Invalid s3Key format: " + s3Key);
  }

  // Optional: Extract the target from the path
  const match = s3Key.match(/^db\/webUploads\/public\/([A-Z-]+)\//);
  if (!match) {
    throw new Error("Unable to extract upload target from s3Key: " + s3Key);
  }
  const targetFromPath = match[1];
  if (!ALLOWED_UPLOAD_TARGETS.includes(targetFromPath as UploadTarget)) {
    throw new Error("Invalid upload target in s3Key: " + targetFromPath);
  }

  return {
    s3Key: s3Key,
    contentType: input.contentType ?? contentType,
    size: input.size,
    public: isPublic,
    typeid: input.typeid,
    subtype: input.subtype,
    originalName: input.originalName,
  };
}

export function inferContentType(filename?: string): string | undefined {
  if (!filename) return undefined;

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;

  if (!isAllowedExtension(ext)) {
    return undefined;
  }

  const mimes = EXTENSION_TO_MIME[ext];

  return mimes[0];
}
