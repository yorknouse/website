"use client";

import { useEffect } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import ImageEditor from "@uppy/image-editor";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import { generateS3Key } from "@/lib/validation/uploads";
import { UploadError, completeUpload, signUpload } from "@/lib/uploadClient";

interface UploadMeta {
  typeid: number;
  subtype: number;
  s3Key?: string;

  [key: string]: unknown;
}

interface AvatarUploaderProps {
  userId: number;
  onSuccess?: () => void;
}

export default function AvatarUploader({
  userId,
  onSuccess,
}: AvatarUploaderProps) {
  useEffect(() => {
    const uppy = new Uppy<UploadMeta>({
      autoProceed: false,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["image/jpeg", "image/png", "image/gif"],
      },
      meta: {
        typeid: 1,
        subtype: 1,
      },
    });

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        typeid: 1,
        subtype: 1,
      });
    });

    uppy.use(Dashboard, {
      inline: true,
      target: "#uppy-avatar",
      showRemoveButtonAfterComplete: true,
      proudlyDisplayPoweredByUppy: false,
    });

    uppy.use(ImageEditor, {
      quality: 0.8,
      cropperOptions: {
        aspectRatio: 1,
      },
    });

    uppy.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: async (file) => {
        const s3Key = generateS3Key(1, file.name, true);
        const signed = await signUpload(s3Key, file.type ?? "");

        file.meta.s3Key = s3Key;

        return signed;
      },
    });

    uppy.on("upload-success", async (file) => {
      if (typeof file === "undefined") {
        return;
      }

      const originalName =
        file.data instanceof File ? file.data.name : file.name;
      const s3Key = file.meta.s3Key!;

      // Register upload in backend
      let uploaded: { id: number; url: string };
      try {
        uploaded = await completeUpload({
          s3Key: s3Key,
          originalName: originalName,
          size: file.size ?? 0,
          contentType: file.type ?? "",
          typeid: 1,
          subtype: 1,
        });
      } catch (err) {
        alert(err instanceof UploadError ? err.message : "Upload failed");
        return;
      }

      // Set user thumbnail
      const thumbRes = await fetch(`/api/backend/users/thumbnail`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          users_userid: String(userId),
          thumbnail: uploaded.id,
        }),
      });

      const thumbJson = await thumbRes.json();

      if (!thumbJson.success) {
        alert("Setting thumbnail failed");
        return;
      }

      onSuccess?.();
    });

    return () => {
      uppy.destroy();
    };
  }, [userId, onSuccess]);

  return <div id="uppy-avatar" />;
}
