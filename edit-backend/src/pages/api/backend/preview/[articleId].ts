import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { articleId } = req.query;

    if (!articleId || Array.isArray(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
    }

    // Validate numeric
    if (!/^\d+$/.test(articleId)) {
        return res.status(400).json({ message: "Article ID must be a number" });
    }

    // Fetch the article from Prisma
    const article = await prisma.articles.findUnique({
        where: { articles_id: Number(articleId) },
        select: {
            articles_slug: true,
            articles_published: true,
        },
    });

    if (!article) {
        return res.status(404).json({ message: "Article not found" });
    }

    const { articles_slug: slug, articles_published: published } = article;

    if (!published) {
        return res.status(400).json({ message: "Published date missing" });
    }

    // Convert date to YYYY/MM/DD for URL
    const year = published.getFullYear();
    const month = String(published.getMonth() + 1).padStart(2, "0");
    const day = String(published.getDate()).padStart(2, "0");
    const convertedDate = `${year}/${month}/${day}`;

    // Generate preview token
    const token = process.env.DRAFT_VIEW_TOKEN;
    if (!process.env.DRAFT_VIEW_TOKEN) {
        return res.status(500).json({ message: "Token is missing" });
    }

    // Set the cookie for the frontend domain
    res.setHeader("Set-Cookie", `previewToken=${token}; Path=/; Domain=.nouse.co.uk; HttpOnly; Secure; SameSite=None; Max-Age=3600`);

    // Redirect to frontend preview URL
    const slugParam = Array.isArray(slug) ? slug[0] : slug;
    const frontendUrl = `${process.env.FRONTEND_URL}articles/${convertedDate}/${slugParam}?preview=true&hash=${crypto.createHash('md5').update(articleId).digest('hex')}`;

    res.redirect(frontendUrl);
}
