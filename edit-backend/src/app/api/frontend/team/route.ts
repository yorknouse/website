import prisma from "@/lib/prisma";
import { Position, PositionMember } from "@/lib/types";
import he from "he";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

export async function GET(_: Request) {
  try {
    const positionsRaw = await prisma.positions.findMany({
      where: {
        userPositions: {
          some: {
            OR: [
              { userPositions_end: { gt: new Date() } },
              { userPositions_end: null },
            ],
            userPositions_show: true,
          },
        },
      },
      orderBy: {
        positions_rank: "asc",
      },
      include: {
        userPositions: {
          where: {
            OR: [
              { userPositions_end: { gt: new Date() } },
              { userPositions_end: null },
            ],
            userPositions_show: true,
          },
          include: {
            users: true,
          },
        },
      },
    });

    const positions: Position[] = positionsRaw.flatMap((positionRaw) => {
      const users: PositionMember[] = positionRaw.userPositions.flatMap(
        (userRaw) => {
          const user: PositionMember = {
            users_userid: Number(userRaw.users_userid),
            users_name1: he.decode(userRaw.users?.users_name1 || ""),
            users_name2: he.decode(userRaw.users?.users_name2 || ""),
            users_googleAppsUsernameNouse: String(
              userRaw.users?.users_googleAppsUsernameNouse,
            ),
          };
          return user;
        },
      );
      const position: Position = {
        positions_id: positionRaw.positions_id,
        positions_displayName: positionRaw.positions_displayName,
        positions_teamPageGroup: positionRaw.positions_teamPageGroup,
        users: users,
      };
      return position;
    });

    return NextResponse.json(positions, corsRes);
  } catch (err) {
    console.error("Error in team", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
