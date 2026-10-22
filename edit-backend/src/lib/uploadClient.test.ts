import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadError, uploadFile } from "@/lib/uploadClient";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function imageFile(name = "My Photo.png", size = 10) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadFile", () => {
  it("signs, PUTs and completes, returning the s3file id and url", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          method: "PUT",
          url: "https://s3.example/signed",
          headers: { "content-type": "image/png" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        jsonResponse({
          result: true,
          response: { id: 42, url: "https://cdn.example/a b.png" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const file = imageFile();
    await expect(uploadFile(file, 2, 7)).resolves.toEqual({
      id: 42,
      url: "https://cdn.example/a b.png",
    });

    const [signUrl, signInit] = fetchMock.mock.calls[0];
    expect(signUrl).toBe("/api/backend/uploads/sign");
    const signBody = JSON.parse(signInit.body);
    expect(signBody.filename).toMatch(
      /^db\/webUploads\/public\/ARTICLE-IMAGE\/[0-9]+-[0-9]+-myphotopng\.png$/,
    );
    expect(signBody.contentType).toBe("image/png");

    const [putUrl, putInit] = fetchMock.mock.calls[1];
    expect(putUrl).toBe("https://s3.example/signed");
    expect(putInit.method).toBe("PUT");
    expect(putInit.body).toBe(file);

    const [completeUrl, completeInit] = fetchMock.mock.calls[2];
    expect(completeUrl).toBe("/api/backend/uploads/complete");
    expect(JSON.parse(completeInit.body)).toEqual({
      s3Key: signBody.filename,
      originalName: "My Photo.png",
      size: 10,
      contentType: "image/png",
      public: true,
      typeid: 2,
      subtype: 7,
    });
  });

  it("reports a disallowed extension from the 400 issues", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(
          {
            error: "VALIDATION_ERROR",
            issues: [{ path: "", message: "Invalid file extension" }],
          },
          400,
        ),
      ),
    );

    const err = await uploadFile(imageFile("virus.exe"), 2).catch((e) => e);
    expect(err).toBeInstanceOf(UploadError);
    expect(err.message).toBe("That file type isn't allowed");
  });

  it("reports a file over the size limit from the 400 issues", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ method: "PUT", url: "https://s3.example/s" }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(
          jsonResponse(
            {
              error: "VALIDATION_ERROR",
              issues: [
                {
                  path: "",
                  message: "File exceeds max size for ARTICLE-IMAGE",
                },
              ],
            },
            400,
          ),
        ),
    );

    await expect(uploadFile(imageFile(), 2)).rejects.toThrow(
      "File is too large",
    );
  });

  it("rejects a file over the target's limit before uploading", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const big = imageFile("big.png", 25 * 1024 * 1024 + 1);

    await expect(uploadFile(big, 2)).rejects.toThrow("File is too large");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a network failure as a connection problem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")),
    );

    await expect(uploadFile(imageFile(), 2)).rejects.toThrow(
      "Upload failed — check your connection and try again",
    );
  });

  it("reports a failed PUT to storage as a connection problem", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ method: "PUT", url: "https://s3.example/s" }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 403 })),
    );

    await expect(uploadFile(imageFile(), 2)).rejects.toThrow(
      "Upload failed — check your connection and try again",
    );
  });
});
