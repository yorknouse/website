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
    path: z.string(),
    filename: z.string(),
    filenameWithExt: z.string(),
    extension: z.string(),
    target: z.string(),
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
  const s3Key: string = input.s3Key ?? input.name ?? input.originalName;
  if (!s3Key.startsWith("db/webUploads/public/")) {
    throw new Error("Invalid upload path: must start with db/webUploads/public/");
  }

  const parts = s3Key.split("/");
  if (parts.length < 5) {
    throw new Error("Invalid upload path: too few path segments");
  }

  const targetRaw = parts[3]; // db/webUploads/public/<TARGET>/<filename>
  const parsedTarget = uploadTargetSchema.safeParse(targetRaw);
  if (!parsedTarget.success) {
    throw new Error("Invalid upload target");
  }

  const target = parsedTarget.data;

  const filenameWithExt = parts.pop()!;
  const path = parts.join("/");

  const extMatch = filenameWithExt.match(/^[0-9]+-[0-9]+-[a-zA-Z0-9_-]+\.(\w+)$/);
  if (!extMatch) {
    throw new Error("Invalid filename format");
  }

  const extension = extMatch[1].toLowerCase();
  const filename = filenameWithExt.replace(/\.[^.]+$/, "");

  const contentType = input.contentType ?? inferContentType(filenameWithExt);
  if (!contentType) {
    throw new Error("Unable to infer content type for: " + filenameWithExt);
  }

  const isPublic = input.public === "1" || input.public === true;

  return {
    s3Key: s3Key,
    path: path,
    filenameWithExt: filenameWithExt,
    filename: filename,
    extension: extension.toUpperCase(),
    contentType: contentType,
    size: Number(input.size),
    public: isPublic,
    typeid: Number(input.typeid),
    subtype: input.subtype ? Number(input.subtype) : undefined,
    originalName: input.originalName,
    target: target,
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
