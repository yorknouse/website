import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ICategory } from "@/lib/types";
import { cache } from "@/lib/cache";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { style } = req.query;

  try {
    if (!style || typeof style === "undefined") {
      res.status(400).json({ message: "Missing or invalid style" });
      return;
    }

    let menuCategories: ICategory[];

    if (String(style) === "nouse") {
      menuCategories = await cache("menuCategories:nouse:latest", 7200, () =>
        prisma.categories.findMany({
          where: {
            categories_showMenu: true,
            categories_showPublic: true,
            categories_nestUnder: null,
          },
        }),
      );

      // Add home as first item - possibly need to adjust values in the future
      menuCategories.unshift({
        categories_name: "home",
        categories_id: 0,
        categories_showHome: true,
        categories_displayName: "Home",
        categories_showMenu: true,
        categories_showPublic: true,
        categories_showAdmin: true,
        categories_featured: null,
        categories_order: null,
        categories_nestUnder: null,
        categories_showSub: false,
        categories_facebook: null,
        categories_twitter: null,
        categories_instagram: null,
        categories_backgroundColor: null,
        categories_backgroundColorContrast: null,
        categories_customTheme: null,
        categories_socialMediaOverlay: null,
      });

      // Muse to last
      menuCategories = menuCategories.sort((a, b) => {
        if (b.categories_name === "muse") return -1;
        if (a.categories_name === "muse") return 1;

        return 0;
      });
    } else {
      menuCategories = await cache("menuCategories:muse:latest", 7200, () =>
        prisma.categories.findMany({
          where: {
            categories_showMenu: true,
            categories_showPublic: true,
            categories_nestUnder: 4, // Muse
          },
        }),
      );

      const muse = await cache("category:name:muse", 7200, () =>
        prisma.categories.findFirst({
          where: {
            categories_name: "muse",
          },
        }),
      );

      if (menuCategories.length > 0 && muse) {
        // Add home as first item - possibly need to adjust values in the future
        const homeCategory: ICategory = {
          categories_id: muse.categories_id ?? 4,
          categories_showHome: true,
          categories_displayName: "Home",
          categories_showMenu: muse.categories_showMenu ?? true,
          categories_name: muse.categories_name ?? "home",
          categories_showPublic: muse.categories_showPublic ?? true,
          categories_showAdmin: muse.categories_showAdmin ?? true,
          categories_featured: muse.categories_featured ?? null,
          categories_order: muse.categories_order ?? null,
          categories_nestUnder: muse.categories_nestUnder ?? null,
          categories_showSub: muse.categories_showSub ?? false,
          categories_facebook: muse.categories_facebook ?? null,
          categories_twitter: muse.categories_twitter ?? null,
          categories_instagram: muse.categories_instagram ?? null,
          categories_backgroundColor: muse.categories_backgroundColor ?? null,
          categories_backgroundColorContrast:
            muse.categories_backgroundColorContrast ?? null,
          categories_customTheme: muse.categories_customTheme ?? null,
          categories_socialMediaOverlay:
            muse.categories_socialMediaOverlay ?? null,
        };

        menuCategories.unshift(homeCategory);

        // Link to Nouse home
        menuCategories.push({
          categories_name: "nouse",
          categories_id: 0,
          categories_showHome: true,
          categories_displayName: "Nouse",
          categories_showMenu: true,
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: null,
          categories_showSub: false,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        });
      }
    }

    if (!menuCategories || menuCategories.length === 0) {
      res.status(400).json({ message: "Menu categories not found" });
      return;
    }

    res.status(200).json(menuCategories);
  } catch (err) {
    console.error("Error in menuCategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
