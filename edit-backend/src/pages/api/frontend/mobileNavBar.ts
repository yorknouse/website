import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ParseForm } from "@/lib/parseForm";
import { ICategory } from "@/lib/types";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { fields } = await ParseForm(req);
  const active = fields.active;
  const style = fields.style;
  const menuCategories = fields.menuCategories;
  const subMenuCategories = fields.subMenuCategories;

  const activeHere = String(active);
  const styleHere = String(style);
  if (styleHere !== "nouse" && styleHere !== "muse") {
    res.status(400).json({ message: "Missing or invalid style" });
    return;
  }

  const menuCategoriesHere: ICategory[] = JSON.parse(String(menuCategories));

  const rawSubMenuCategories = JSON.parse(String(subMenuCategories));
  const subMenuCategoriesHere = new Map<string, ICategory[]>(
    rawSubMenuCategories,
  );

  try {
    if (!activeHere || typeof activeHere === "undefined") {
      res.status(400).json({ message: "Missing or invalid actives" });
      return;
    }

    const activeCategory = activeHere
      ? await prisma.categories.findFirst({
          where: {
            categories_name: activeHere,
          },
        })
      : undefined;

    let parentColour = undefined;
    let parentCategory: ICategory | null = null;
    if (
      activeCategory &&
      activeCategory.categories_nestUnder &&
      activeCategory.categories_nestUnder !== 4
    ) {
      // Mask muse out of this as muse categories are nested
      parentCategory = await prisma.categories.findFirst({
        where: {
          categories_id: activeCategory.categories_nestUnder,
        },
      });

      if (parentCategory) {
        parentColour = parentCategory.categories_backgroundColor;
      }
    }

    let computedBaseColour = styleHere === "muse" ? "#000" : "#F5EFEB";

    if (activeCategory?.categories_backgroundColor) {
      computedBaseColour = activeCategory.categories_backgroundColor;
    } else if (parentColour) computedBaseColour = parentColour;

    // Whether to invert logo or not.
    // Should be inverted for non-home nouse categories.
    const invert =
      styleHere === "nouse" &&
      activeCategory &&
      activeCategory.categories_name !== "home" &&
      computedBaseColour !== "#F5EFEB";

    // Menu and Search icons colours
    let textColour = "text-black";
    if (styleHere === "muse" || invert) {
      textColour = "text-white";
    }

    if (!menuCategoriesHere || menuCategoriesHere.length === 0) {
      res.status(400).json({ message: "Menu categories not found" });
      return;
    }

    res.status(200).json({
      subMenuCategories: Array.from(subMenuCategoriesHere.entries()),
      activeCategory: activeCategory,
      parentCategory: parentCategory,
      computedBaseColour: computedBaseColour,
      invert: invert,
      textColour: textColour,
    });
  } catch (err) {
    console.error("Error in desktopNavBar:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
