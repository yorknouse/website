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

        const res = await fetch(`/api/uploads/sign`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: s3Key,
            contentType: file.type,
          }),
        });

        const json = await res.json();

        file.meta.s3Key = s3Key;

        return json;
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
      const registerRes = await fetch(`/api/uploads/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key: s3Key,
          originalName: originalName,
          size: file.size,
          contentType: file.type,
          public: true,
          typeid: 1,
          subtype: 1,
        }),
      });

      const registerJson = await registerRes.json();

      if (!registerJson.result) {
        alert("Upload failed");
        return;
      }

      // Set user thumbnail
      const thumbRes = await fetch(`/api/users/thumbnail`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          users_userid: String(userId),
          thumbnail: registerJson.response.id,
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
