import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  GetUserData: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  default: { users: { findMany: vi.fn() } },
}));

import { GetUserData } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GET } from "./route";

const findMany = vi.mocked(prisma.users.findMany);

beforeEach(() => {
  findMany.mockReset();
  findMany.mockResolvedValue([]);
  vi.mocked(GetUserData).mockResolvedValue({
    id: 7,
    actions: new Map([[32, true]]),
  } as unknown as Awaited<ReturnType<typeof GetUserData>>);
});

const get = (q: string) =>
  GET(
    new Request(`http://x/api/backend/users/search?q=${encodeURIComponent(q)}`),
  );

describe("GET /api/backend/users/search", () => {
  it("requires every whitespace-separated token to match either name", async () => {
    await get("  John   Smith ");
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0]?.where).toEqual({
      users_deleted: false,
      AND: [
        {
          OR: [
            { users_name1: { contains: "John" } },
            { users_name2: { contains: "John" } },
          ],
        },
        {
          OR: [
            { users_name1: { contains: "Smith" } },
            { users_name2: { contains: "Smith" } },
          ],
        },
      ],
    });
  });

  it("returns an empty list without querying for a blank query", async () => {
    const res = await get("   ");
    expect(await res.json()).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
