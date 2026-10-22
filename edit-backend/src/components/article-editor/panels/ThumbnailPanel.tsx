"use client";

import { useState } from "react";
import { uploadFile, UploadError, UPLOAD_FAILED } from "@/lib/uploadClient";
import FieldError from "../FieldError";
import { errorId, type PanelProps } from "./types";

const DEFAULT_THUMBNAIL = 1;
const THUMBNAIL_TYPEID = 3;

export default function ThumbnailPanel({
  values,
  setField,
  errorFor,
  articleId,
  currentThumbnailId = DEFAULT_THUMBNAIL,
  thumbnailUrl,
}: PanelProps & {
  articleId?: number;
  /** The stored thumbnail; `values.thumbnailId` null means "unchanged". */
  currentThumbnailId?: number;
  /** Preview URL for the stored thumbnail. */
  thumbnailUrl?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState(thumbnailUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const thumbnail = values.thumbnailId ?? currentThumbnailId;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { id, url } = await uploadFile(
        file,
        THUMBNAIL_TYPEID,
        articleId ?? 0,
      );
      setPreviewUrl(url);
      setField("thumbnailId", id);
    } catch (err) {
      setUploadError(err instanceof UploadError ? err.message : UPLOAD_FAILED);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary S3 URL
        <img src={previewUrl} alt="Thumbnail preview" className="w-full" />
      ) : (
        <p className="text-sm text-gray-500">No thumbnail set</p>
      )}
      {thumbnail !== DEFAULT_THUMBNAIL && (
        <div>
          <label htmlFor="thumbnailCredit" className="sr-only">
            Thumbnail credit
          </label>
          <input
            id="thumbnailCredit"
            value={values.thumbnailCredit}
            onChange={(e) => setField("thumbnailCredit", e.target.value)}
            placeholder="Image credit for caption"
            aria-invalid={!!errorFor("thumbnailCredit")}
            aria-describedby={errorId("thumbnailCredit")}
            className="w-full rounded-md border border-gray-300 p-2"
          />
          <FieldError
            id={errorId("thumbnailCredit")}
            message={errorFor("thumbnailCredit")}
          />
        </div>
      )}
      <div>
        <label
          htmlFor="thumbnailFile"
          className="block cursor-pointer rounded bg-blue-600 px-3 py-2 text-center text-white"
        >
          {uploading ? "Uploading…" : "Upload thumbnail"}
        </label>
        <input
          id="thumbnailFile"
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
          aria-describedby={errorId("thumbnailId")}
          className="sr-only"
        />
        <FieldError
          id={errorId("thumbnailId")}
          message={uploadError ?? errorFor("thumbnailId")}
        />
      </div>
      <p className="text-sm italic">
        To display correctly, thumbnails should be wider they they are tall.
        Landscape images of around 2:1 aspect ratio work well
      </p>
    </div>
  );
}
