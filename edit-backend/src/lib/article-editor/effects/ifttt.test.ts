import { afterEach, describe, expect, it, vi } from "vitest";
import { postToIfttt } from "./ifttt";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("postToIfttt", () => {
  it("posts the excerpt and permalink as a form", async () => {
    vi.stubEnv("bCMS__IFTTT", "secret-key");
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    const ok = await postToIfttt(
      "socialMediaAutomationFB",
      "Big & news",
      "https://nouse.co.uk/articles/2026/06/30/x",
    );
    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://maker.ifttt.com/trigger/socialMediaAutomationFB/with/key/secret-key",
    );
    expect(init.method).toBe("POST");
    expect(String(init.body)).toBe(
      "value1=Big+%26+news&value2=https%3A%2F%2Fnouse.co.uk%2Farticles%2F2026%2F06%2F30%2Fx&value3=null",
    );
  });

  it("fails without a key and without calling out", async () => {
    vi.stubEnv("bCMS__IFTTT", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await postToIfttt("socialMediaAutomationTwitter", "a", "b")).toBe(
      false,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when IFTTT rejects the request", async () => {
    vi.stubEnv("bCMS__IFTTT", "secret-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 401 })),
    );
    expect(await postToIfttt("socialMediaAutomationTwitter", "a", "b")).toBe(
      false,
    );
  });
});
