import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { userId } = req.query;

    try {
        if (!userId) {
            return res.status(400).json({ message: "Missing userId" });
        }

        const id = Number(userId);

        if (!Number.isInteger(id) || id < 0) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        const user = await prisma.users.findFirst({
            where: {
                users_userid: id
            }
        });

        if (!user) {
            res.status(404).json({ message: "Missing or invalid userId" });
            return;
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error in user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}
