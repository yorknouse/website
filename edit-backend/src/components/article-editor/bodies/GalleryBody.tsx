"use client";

import { useRef, useState } from "react";
import { UploadError, uploadFile } from "@/lib/uploadClient";
import FieldError from "../FieldError";

export interface GalleryImage {
  id: number;
  caption: string;
}

interface GalleryBodyProps {
  images: GalleryImage[];
  /** Display URLs of the existing images, keyed by s3files id. */
  imageUrls?: Record<number, string>;
  onChange: (images: GalleryImage[]) => void;
  /** Field errors keyed like `body.images.0.caption`. */
  fieldErrors?: Record<string, string | undefined>;
}

export default function GalleryBody({
  images,
  imageUrls = {},
  onChange,
  fieldErrors = {},
}: GalleryBodyProps) {
  const [uploaded, setUploaded] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Uploads finish after renders, so append to the latest list, not a stale prop.
  const latest = useRef(images);
  latest.current = images;

  const update = (next: GalleryImage[]) => {
    latest.current = next;
    onChange(next);
  };

  const onFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        // Subtype 2 is the gallery, as in PHP.
        const { id, url } = await uploadFile(file, 2, 2);
        setUploaded((u) => ({ ...u, [id]: url }));
        update([...latest.current, { id, caption: "" }]);
      }
    } catch (err) {
      setUploadError(
        err instanceof UploadError
          ? err.message
          : "The upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Gallery</h2>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((image, i) => {
          const url = uploaded[image.id] ?? imageUrls[image.id];
          const errorId = `gallery-caption-${i}-error`;
          const error = fieldErrors[`body.images.${i}.caption`];
          return (
            <li
              key={image.id}
              className="rounded-md border border-gray-300 p-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span>{image.id}</span>
                <button
                  type="button"
                  aria-label={`Remove image ${image.id}`}
                  onClick={() => update(images.filter((_, j) => j !== i))}
                  className="cursor-pointer px-2 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Image ${image.id}`} className="w-full" />
              )}
              <textarea
                rows={2}
                aria-label={`Caption for image ${image.id}`}
                aria-invalid={!!error}
                aria-describedby={errorId}
                value={image.caption}
                onChange={(e) =>
                  update(
                    images.map((im, j) =>
                      j === i ? { ...im, caption: e.target.value } : im,
                    ),
                  )
                }
                placeholder="Caption"
                className="mt-2 w-full rounded border border-gray-300 p-1 text-sm"
              />
              <FieldError id={errorId} message={error} />
            </li>
          );
        })}
      </ul>
      <div>
        <label htmlFor="gallery-upload" className="block text-sm font-medium">
          Add images
        </label>
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => {
            const input = e.currentTarget;
            const files = Array.from(input.files ?? []);
            input.value = "";
            void onFiles(files);
          }}
        />
        {uploading && <p className="text-sm text-gray-600">Uploading…</p>}
        <FieldError message={uploadError ?? undefined} />
      </div>
    </div>
  );
}
