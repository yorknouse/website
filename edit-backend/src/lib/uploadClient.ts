import {
  TYPEID_TO_TARGET,
  generateS3Key,
  getMaxUploadSize,
} from "@/lib/validation/uploads";

export const UPLOAD_TYPE_NOT_ALLOWED = "That file type isn't allowed";
export const UPLOAD_TOO_LARGE = "File is too large";
export const UPLOAD_FAILED =
  "Upload failed — check your connection and try again";

/** An upload failure whose `message` can be shown to the user as-is. */
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface SignedUpload {
  method: "PUT";
  url: string;
  headers?: Record<string, string>;
}

export interface CompleteUploadInput {
  s3Key: string;
  originalName: string;
  size: number;
  contentType: string;
  typeid: number;
  subtype?: number;
}

/** Turn a `/uploads/*` 400 `issues` list into a user-readable message. */
function messageFromIssues(issues: unknown): string {
  const messages = Array.isArray(issues)
    ? issues.map((issue) => String(issue?.message ?? ""))
    : [];
  if (messages.some((m) => /extension|mime type/i.test(m))) {
    return UPLOAD_TYPE_NOT_ALLOWED;
  }
  if (messages.some((m) => /max size/i.test(m))) {
    return UPLOAD_TOO_LARGE;
  }
  return UPLOAD_FAILED;
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new UploadError(UPLOAD_FAILED);
  }
  const json = await res.json().catch(() => null);
  if (res.status === 400 && json && typeof json === "object") {
    throw new UploadError(
      messageFromIssues((json as { issues?: unknown }).issues),
    );
  }
  if (!res.ok || json === null) {
    throw new UploadError(UPLOAD_FAILED);
  }
  return json;
}

/** Ask the backend for a presigned PUT for `s3Key`. */
export async function signUpload(
  s3Key: string,
  contentType: string,
): Promise<SignedUpload> {
  const json = (await postJson("/api/backend/uploads/sign", {
    filename: s3Key,
    contentType,
  })) as Partial<SignedUpload>;
  if (typeof json.url !== "string") {
    throw new UploadError(UPLOAD_FAILED);
  }
  return {
    method: "PUT",
    url: json.url,
    headers: json.headers,
  };
}

/** Register an uploaded object as an s3files row. */
export async function completeUpload(
  input: CompleteUploadInput,
): Promise<{ id: number; url: string }> {
  const json = (await postJson("/api/backend/uploads/complete", {
    s3Key: input.s3Key,
    originalName: input.originalName,
    size: input.size,
    contentType: input.contentType,
    public: true,
    typeid: input.typeid,
    subtype: input.subtype,
  })) as { result?: boolean; response?: { id?: number; url?: string } };
  if (
    !json.result ||
    typeof json.response?.id !== "number" ||
    typeof json.response.url !== "string"
  ) {
    throw new UploadError(UPLOAD_FAILED);
  }
  return { id: json.response.id, url: json.response.url };
}

/** Upload `file` publicly as an s3file of `typeid` (sign → PUT → complete). */
export async function uploadFile(
  file: File,
  typeid: number,
  subtype?: number,
): Promise<{ id: number; url: string }> {
  const target = TYPEID_TO_TARGET[typeid];
  if (target && file.size > getMaxUploadSize(target)) {
    throw new UploadError(UPLOAD_TOO_LARGE);
  }

  const s3Key = generateS3Key(typeid, file.name, true);
  const signed = await signUpload(s3Key, file.type);

  let put: Response;
  try {
    put = await fetch(signed.url, {
      method: signed.method,
      headers: signed.headers,
      body: file,
    });
  } catch {
    throw new UploadError(UPLOAD_FAILED);
  }
  if (!put.ok) {
    throw new UploadError(UPLOAD_FAILED);
  }

  return completeUpload({
    s3Key,
    originalName: file.name,
    size: file.size,
    contentType: file.type,
    typeid,
    subtype,
  });
}
