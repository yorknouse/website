import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { Position, PositionMember } from "@/lib/types";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  cors(res);

  const positionsRaw = await prisma.positions.findMany({
    where: {
      userPositions: {
        some: {
          userPositions_end: {
            gt: new Date(),
          },
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
          userPositions_end: {
            gte: new Date(),
          },
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
          users_name1: String(userRaw.users?.users_name1),
          users_name2: String(userRaw.users?.users_name2),
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

  res.status(200).json(positions);
}
